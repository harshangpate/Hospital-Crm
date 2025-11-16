import { Request, Response } from 'express';
import { PrismaClient, PrescriptionStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Get pending prescriptions (ISSUED status)
export const getPendingPrescriptions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', patientId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      status: PrescriptionStatus.ISSUED,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search as string, mode: 'insensitive' } },
        { patient: { user: { name: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          items: {
            include: {
              medication: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching pending prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending prescriptions',
      error: error.message,
    });
  }
};

// Get prescription by ID
export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message,
    });
  }
};

// Dispense prescription
export const dispensePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dispensedBy, pharmacyNotes, items } = req.body;

    // Validate required fields
    if (!dispensedBy) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacist name is required',
      });
    }

    // Check if prescription exists and is in ISSUED status
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescription.status !== PrescriptionStatus.ISSUED) {
      return res.status(400).json({
        success: false,
        message: 'Prescription is not in issued status',
      });
    }

    // Validate inventory availability
    const inventoryUpdates: any[] = [];
    for (const item of prescription.items) {
      const totalQuantity = item.quantity;
      
      // Find available inventory for this medication
      const medicationInventory = await prisma.medicineInventory.findMany({
        where: {
          medicationId: item.medicationId,
          quantity: { gt: 0 },
          expiryDate: { gt: new Date() },
        },
        orderBy: {
          expiryDate: 'asc', // Use older stock first (FIFO)
        },
      });

      let remainingQuantity = totalQuantity;
      for (const inventory of medicationInventory) {
        if (remainingQuantity <= 0) break;

        const quantityToDeduct = Math.min(inventory.quantity, remainingQuantity);
        inventoryUpdates.push({
          id: inventory.id,
          medicationId: item.medicationId,
          newQuantity: inventory.quantity - quantityToDeduct,
          quantityUsed: quantityToDeduct,
          sellingPrice: inventory.sellingPrice,
        });
        remainingQuantity -= quantityToDeduct;
      }

      if (remainingQuantity > 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.medication.brandName || item.medication.genericName || item.medication.name}. Required: ${totalQuantity}, Available: ${totalQuantity - remainingQuantity}`,
        });
      }
    }

    // Update prescription status and inventory in a transaction
    const updatedPrescription = await prisma.$transaction(async (tx) => {
      // Update inventory quantities
      for (const update of inventoryUpdates) {
        await tx.medicineInventory.update({
          where: { id: update.id },
          data: { quantity: update.newQuantity },
        });
      }

      // Update prescription
      const updated = await tx.prescription.update({
        where: { id },
        data: {
          status: PrescriptionStatus.DISPENSED,
          dispensedAt: new Date(),
          dispensedBy,
          pharmacyNotes,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          items: {
            include: {
              medication: true,
            },
          },
        },
      });

      // Add prescription charges to patient's invoice
      // Try to find existing invoice for this patient (from active admission)
      const activeAdmission = await tx.admission.findFirst({
        where: {
          patientId: prescription.patientId,
          status: {
            in: ['ADMITTED', 'UNDER_TREATMENT']
          }
        },
        orderBy: {
          admissionDate: 'desc'
        }
      });

      let invoice;
      if (activeAdmission) {
        // Find invoice by admission number
        invoice = await tx.invoice.findFirst({
          where: {
            invoiceNumber: {
              contains: activeAdmission.admissionNumber
            }
          }
        });
      }

      // If no invoice found from admission, try to find any pending invoice for patient
      if (!invoice) {
        invoice = await tx.invoice.findFirst({
          where: {
            patientId: prescription.patientId,
            paymentStatus: {
              in: ['PENDING', 'PARTIALLY_PAID']
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      // If still no invoice, create a new one
      if (!invoice) {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            patientId: prescription.patientId,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            paymentStatus: 'PENDING',
            subtotal: 0,
            discount: 0,
            tax: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceAmount: 0,
          }
        });
      }

      // Add prescription items to invoice
      let prescriptionTotal = 0;
      for (const item of updated.items) {
        const totalQuantity = item.quantity;
        
        // Get the price from the inventory that was used for dispensing
        const inventoryUsed = inventoryUpdates.filter(upd => upd.medicationId === item.medicationId);
        let totalPrice = 0;
        
        if (inventoryUsed.length > 0) {
          // Calculate total price from inventory batches used (FIFO)
          for (const inv of inventoryUsed) {
            totalPrice += inv.sellingPrice * inv.quantityUsed;
          }
        } else {
          // Fallback to medication unitPrice if available
          const unitPrice = item.medication.unitPrice || 0;
          totalPrice = unitPrice * totalQuantity;
        }
        
        prescriptionTotal += totalPrice;

        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemName: item.medication.brandName || item.medication.genericName || item.medication.name,
            description: `${item.dosage}, ${item.frequency}, ${item.duration} - Qty: ${totalQuantity}`,
            itemType: 'PHARMACY',
            quantity: totalQuantity,
            unitPrice: totalPrice / totalQuantity,
            totalPrice: totalPrice,
          }
        });
      }

      // Update invoice totals
      const updatedSubtotal = invoice.subtotal + prescriptionTotal;
      const updatedTax = updatedSubtotal * 0.05; // 5% tax
      const updatedTotal = updatedSubtotal + updatedTax;
      const updatedBalance = updatedTotal - invoice.paidAmount;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: updatedSubtotal,
          tax: updatedTax,
          totalAmount: updatedTotal,
          balanceAmount: updatedBalance,
          paymentStatus: updatedBalance > 0 
            ? (invoice.paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING')
            : 'PAID'
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
      data: updatedPrescription,
    });
  } catch (error: any) {
    console.error('Error dispensing prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispense prescription',
      error: error.message,
    });
  }
};

// Get medicine inventory
export const getInventory = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (search) {
      where.medication = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { genericName: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [inventory, total] = await Promise.all([
      prisma.medicineInventory.findMany({
        where,
        skip,
        take,
        include: {
          medication: true,
        },
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.medicineInventory.count({ where }),
    ]);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message,
    });
  }
};

// Add or update inventory
export const updateInventory = async (req: Request, res: Response) => {
  try {
    const {
      medicationId,
      batchNumber,
      quantity,
      expiryDate,
      reorderLevel,
      unitCost,
      sellingPrice,
      supplierName,
      rackNumber,
      shelfNumber,
    } = req.body;

    // Validate required fields
    if (!medicationId || !batchNumber || !quantity || !expiryDate || !unitCost || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: medicationId, batchNumber, quantity, expiryDate, unitCost, sellingPrice',
      });
    }

    // Check if medication exists
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    // Check if batch already exists
    const existingInventory = await prisma.medicineInventory.findFirst({
      where: {
        medicationId,
        batchNumber,
      },
    });

    let inventory;
    if (existingInventory) {
      // Update existing inventory
      inventory = await prisma.medicineInventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: existingInventory.quantity + quantity,
          lastRestockedDate: new Date(),
          reorderLevel,
          unitCost,
          sellingPrice,
          supplierName,
          rackNumber,
          shelfNumber,
        },
        include: {
          medication: true,
        },
      });
    } else {
      // Create new inventory entry
      inventory = await prisma.medicineInventory.create({
        data: {
          medicationId,
          batchNumber,
          quantity,
          expiryDate: new Date(expiryDate),
          reorderLevel: reorderLevel || 10,
          unitCost,
          sellingPrice,
          supplierName,
          rackNumber,
          shelfNumber,
        },
        include: {
          medication: true,
        },
      });
    }

    res.json({
      success: true,
      message: existingInventory ? 'Inventory updated successfully' : 'Inventory added successfully',
      data: inventory,
    });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message,
    });
  }
};

// Get pharmacy statistics
export const getPharmacyStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingPrescriptions,
      dispensedToday,
      allInventoryItems,
      expiringItems,
      totalMedicines,
    ] = await Promise.all([
      // Pending prescriptions count
      prisma.prescription.count({
        where: { status: PrescriptionStatus.ISSUED },
      }),

      // Dispensed today count
      prisma.prescription.count({
        where: {
          status: PrescriptionStatus.DISPENSED,
          dispensedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Get all inventory items to calculate low stock and total value
      prisma.medicineInventory.findMany({
        select: {
          quantity: true,
          reorderLevel: true,
          sellingPrice: true,
        },
      }),

      // Items expiring in next 30 days
      prisma.medicineInventory.count({
        where: {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),

      // Total unique medications
      prisma.medication.count({
        where: {
          isAvailable: true,
        },
      }),
    ]);

    // Calculate low stock items (quantity <= reorder level)
    const lowStockItems = allInventoryItems.filter(
      item => item.quantity <= item.reorderLevel
    ).length;

    // Calculate total inventory value
    const totalInventoryValue = allInventoryItems.reduce(
      (sum, item) => sum + (item.quantity * item.sellingPrice),
      0
    );

    res.json({
      success: true,
      data: {
        pendingPrescriptions,
        dispensedToday,
        lowStockItems,
        expiringItems,
        totalMedicines,
        totalInventoryValue: Math.round(totalInventoryValue),
      },
    });
  } catch (error: any) {
    console.error('Error fetching pharmacy stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacy statistics',
      error: error.message,
    });
  }
};

// Get dispensed prescriptions history
export const getDispensedPrescriptions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      status: PrescriptionStatus.DISPENSED,
    };

    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search as string, mode: 'insensitive' } },
        { patient: { user: { name: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.dispensedAt = {};
      if (startDate) where.dispensedAt.gte = new Date(startDate as string);
      if (endDate) where.dispensedAt.lte = new Date(endDate as string);
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          items: {
            include: {
              medication: true,
            },
          },
        },
        orderBy: { dispensedAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching dispensed prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispensed prescriptions',
      error: error.message,
    });
  }
};

// Update specific inventory item by ID
export const updateInventoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      reorderLevel,
      unitCost,
      sellingPrice,
      supplierName,
      rackNumber,
      shelfNumber,
    } = req.body;

    const inventory = await prisma.medicineInventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const updated = await prisma.medicineInventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(reorderLevel !== undefined && { reorderLevel }),
        ...(unitCost !== undefined && { unitCost }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(supplierName !== undefined && { supplierName }),
        ...(rackNumber !== undefined && { rackNumber }),
        ...(shelfNumber !== undefined && { shelfNumber }),
        lastRestockedDate: new Date(),
      },
      include: {
        medication: true,
      },
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message,
    });
  }
};
