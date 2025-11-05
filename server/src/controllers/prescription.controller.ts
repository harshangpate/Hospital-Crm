import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { generatePrescriptionPDF } from '../utils/pdfGenerator';
import { sendPrescriptionEmail } from '../utils/emailService';

const prisma = new PrismaClient();

// ============================================
// PRESCRIPTIONS CRUD
// ============================================

/**
 * Get all prescriptions with pagination and filters
 */
export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      patientId,
      doctorId,
      status,
      search
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};
    
    if (patientId) where.patientId = patientId as string;
    if (doctorId) where.doctorId = doctorId as string;
    if (status) where.status = status as string;
    
    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search as string, mode: 'insensitive' } },
        { diagnosis: { contains: search as string, mode: 'insensitive' } },
        { 
          patient: {
            user: {
              OR: [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    // Fetch prescriptions with relations
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
                  phone: true
                }
              }
            }
          },
          doctor: {
            select: {
              specialization: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          items: {
            include: {
              medication: {
                select: {
                  name: true,
                  genericName: true,
                  medicationForm: true,
                  strength: true,
                  unitPrice: true
                }
              }
            }
          },
          medicalRecord: {
            select: {
              chiefComplaint: true,
              diagnosis: true
            }
          }
        },
        orderBy: { issuedAt: 'desc' }
      }),
      prisma.prescription.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
};

/**
 * Get single prescription by ID
 */
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
                gender: true
              }
            },
            allergiesList: {
              where: { isActive: true }
            }
          }
        },
        doctor: {
          select: {
            specialization: true,
            qualification: true,
            licenseNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        items: {
          include: {
            medication: true
          }
        },
        medicalRecord: true
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Add current stock information for each medication
    const itemsWithStock = await Promise.all(
      prescription.items.map(async (item) => {
        const totalStock = await prisma.medicineInventory.aggregate({
          where: {
            medicationId: item.medicationId,
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          _sum: {
            quantity: true,
          },
        });

        return {
          ...item,
          medication: {
            ...item.medication,
            currentStock: totalStock._sum.quantity || 0,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        ...prescription,
        items: itemsWithStock,
      },
    });
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
};

/**
 * Create new prescription with drug interaction checking
 */
export const createPrescription = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      doctorId,
      medicalRecordId,
      diagnosis,
      notes,
      refillsAllowed,
      validUntil,
      items
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check for drug interactions
    const medicationIds = items.map((item: any) => item.medicationId);
    const interactions = await checkDrugInteractions(medicationIds);
    
    if (interactions.length > 0) {
      const severeInteractions = interactions.filter(
        (i: any) => i.severityLevel === 'SEVERE' || i.severityLevel === 'CRITICAL'
      );
      
      if (severeInteractions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Severe drug interactions detected',
          interactions: severeInteractions
        });
      }
    }

    // Generate prescription number
    const prescriptionNumber = await generatePrescriptionNumber();

    // Use transaction to create prescription and add consultation fee to invoice
    const result = await prisma.$transaction(async (tx) => {
      // Create prescription with items
      const prescription = await tx.prescription.create({
        data: {
          prescriptionNumber,
          patientId,
          doctorId,
          medicalRecordId: medicalRecordId || undefined,
          diagnosis,
          notes,
          refillsAllowed: refillsAllowed || 0,
          validUntil: validUntil ? new Date(validUntil) : undefined,
          status: 'ISSUED',
          items: {
            create: items.map((item: any) => ({
              medicationId: item.medicationId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              quantity: item.quantity,
              route: item.route,
              instructions: item.instructions
            }))
          }
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          doctor: {
            select: {
              specialization: true,
              consultationFee: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          items: {
            include: {
              medication: true
            }
          }
        }
      });

      // Get doctor's consultation fee
      const consultationFee = prescription.doctor.consultationFee || 0;

      // Always find or create invoice for prescription (even if consultation fee is 0)
      // This ensures there's an invoice for pharmacy to add medication charges to
      let invoice = null;

      // Check if patient has an active admission with an invoice
      const activeAdmission = await tx.admission.findFirst({
        where: {
          patientId,
          status: {
            in: ['ADMITTED', 'UNDER_OBSERVATION']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (activeAdmission && activeAdmission.admissionNumber) {
        invoice = await tx.invoice.findFirst({
          where: {
            invoiceNumber: {
              contains: activeAdmission.admissionNumber
            },
            paymentStatus: {
              in: ['PENDING', 'PARTIALLY_PAID']
            }
          }
        });
      }

      // If no admission invoice, look for any pending invoice for patient
      if (!invoice) {
        invoice = await tx.invoice.findFirst({
          where: {
            patientId,
            paymentStatus: {
              in: ['PENDING', 'PARTIALLY_PAID']
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      // If no existing invoice, create new one
      if (!invoice) {
        const invoiceNumber = `INV-${Date.now()}-${patientId.substring(0, 8)}`;
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            patientId,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            subtotal: 0,
            discount: 0,
            tax: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceAmount: 0,
            paymentStatus: 'PENDING'
          }
        });
      }

      // Add consultation fee as invoice item only if fee > 0
      if (consultationFee > 0) {
        const doctorName = `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`;
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemName: 'Consultation Fee',
            description: `Medical consultation with ${doctorName} - Prescription #${prescriptionNumber}`,
            itemType: 'CONSULTATION',
            quantity: 1,
            unitPrice: consultationFee,
            totalPrice: consultationFee
          }
        });

        // Update invoice totals
        const updatedSubtotal = invoice.subtotal + consultationFee;
        const updatedTax = updatedSubtotal * 0.05; // 5% tax
        const updatedTotalAmount = updatedSubtotal + updatedTax;
        const updatedBalanceAmount = updatedTotalAmount - invoice.paidAmount;

        // Determine payment status
        let paymentStatus: PaymentStatus = 'PENDING';
        if (invoice.paidAmount >= updatedTotalAmount) {
          paymentStatus = 'PAID';
        } else if (invoice.paidAmount > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        }

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: updatedSubtotal,
            tax: updatedTax,
            totalAmount: updatedTotalAmount,
            balanceAmount: updatedBalanceAmount,
            paymentStatus
          }
        });
      }

      return prescription;
    });

    // Automatically send email with prescription PDF
    try {
      const patientEmail = result.patient.user.email;
      if (patientEmail) {
        await sendPrescriptionEmail(result.id, patientEmail);
        console.log(`✅ Prescription email sent automatically to ${patientEmail}`);
      }
    } catch (emailError: any) {
      console.error('⚠️ Failed to send prescription email:', emailError.message);
      // Don't fail the request if email fails, just log it
    }

    // Return with warnings if minor interactions exist
    return res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: result,
      emailSent: !!result.patient.user.email,
      warnings: interactions.length > 0 ? {
        message: 'Minor drug interactions detected',
        interactions
      } : undefined
    });
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
};

/**
 * Update prescription
 */
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnosis, notes, status } = req.body;

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        diagnosis,
        notes,
        status
      },
      include: {
        items: {
          include: {
            medication: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message
    });
  }
};

/**
 * Cancel prescription
 */
export const cancelPrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Prescription cancelled successfully',
      data: prescription
    });
  } catch (error: any) {
    console.error('Error cancelling prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel prescription',
      error: error.message
    });
  }
};

/**
 * Dispense prescription (Pharmacist)
 */
export const dispensePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dispensedBy, pharmacyNotes } = req.body;

    if (!dispensedBy) {
      return res.status(400).json({
        success: false,
        message: 'Dispensed by field is required'
      });
    }

    // Check if prescription exists and is valid
    const existingPrescription = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!existingPrescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    if (existingPrescription.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispense cancelled prescription'
      });
    }

    if (existingPrescription.validUntil && new Date() > existingPrescription.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Prescription has expired'
      });
    }

    // Update prescription
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: 'DISPENSED',
        dispensedAt: new Date(),
        dispensedBy,
        pharmacyNotes
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        items: {
          include: {
            medication: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Prescription dispensed successfully',
      data: prescription
    });
  } catch (error: any) {
    console.error('Error dispensing prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispense prescription',
      error: error.message
    });
  }
};

/**
 * Request prescription refill
 */
export const requestRefill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if refills are available
    if (prescription.refillsUsed >= prescription.refillsAllowed) {
      return res.status(400).json({
        success: false,
        message: 'No refills remaining. Please contact your doctor.'
      });
    }

    // Increment refills used
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: {
        refillsUsed: prescription.refillsUsed + 1
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Refill requested successfully',
      data: updatedPrescription
    });
  } catch (error: any) {
    console.error('Error requesting refill:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to request refill',
      error: error.message
    });
  }
};

// ============================================
// MEDICATIONS
// ============================================

/**
 * Search medications
 */
export const searchMedications = async (req: Request, res: Response) => {
  try {
    const { 
      q,
      category,
      form,
      available = 'true',
      limit = 20
    } = req.query;

    const where: any = {
      isAvailable: available === 'true'
    };

    if (category) where.category = category as string;
    if (form) where.medicationForm = form as string;
    
    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { genericName: { contains: q as string, mode: 'insensitive' } },
        { brandName: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    const medications = await prisma.medication.findMany({
      where,
      take: Number(limit),
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: medications
    });
  } catch (error: any) {
    console.error('Error searching medications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search medications',
      error: error.message
    });
  }
};

/**
 * Get medication by ID with interactions
 */
export const getMedicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        interactions: {
          include: {
            interactsWith: {
              select: {
                name: true,
                genericName: true
              }
            }
          }
        },
        interactsWith: {
          include: {
            medication: {
              select: {
                name: true,
                genericName: true
              }
            }
          }
        }
      }
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: medication
    });
  } catch (error: any) {
    console.error('Error fetching medication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medication',
      error: error.message
    });
  }
};

/**
 * Create medication (Admin only)
 */
export const createMedication = async (req: Request, res: Response) => {
  try {
    const {
      name,
      genericName,
      brandName,
      manufacturer,
      medicationForm,
      strength,
      category,
      drugClass,
      commonUses,
      sideEffects,
      contraindications,
      warnings,
      unitPrice,
      requiresPrescription
    } = req.body;

    if (!name || !medicationForm || !strength) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const medication = await prisma.medication.create({
      data: {
        name,
        genericName,
        brandName,
        manufacturer,
        medicationForm,
        strength,
        category,
        drugClass,
        commonUses,
        sideEffects,
        contraindications,
        warnings,
        unitPrice,
        requiresPrescription: requiresPrescription !== false
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: medication
    });
  } catch (error: any) {
    console.error('Error creating medication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create medication',
      error: error.message
    });
  }
};

/**
 * Update medication
 */
export const updateMedication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const medication = await prisma.medication.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      data: medication
    });
  } catch (error: any) {
    console.error('Error updating medication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update medication',
      error: error.message
    });
  }
};

/**
 * Get patient's prescription history
 */
export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { status, limit = 20 } = req.query;

    const where: any = { patientId };
    if (status) where.status = status as string;

    const prescriptions = await prisma.prescription.findMany({
      where,
      take: Number(limit),
      include: {
        doctor: {
          select: {
            specialization: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        items: {
          include: {
            medication: {
              select: {
                name: true,
                genericName: true,
                medicationForm: true,
                strength: true
              }
            }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (error: any) {
    console.error('Error fetching patient prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient prescriptions',
      error: error.message
    });
  }
};

/**
 * Get doctor's prescriptions
 */
export const getDoctorPrescriptions = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { status, limit = 20 } = req.query;

    const where: any = { doctorId };
    if (status) where.status = status as string;

    const prescriptions = await prisma.prescription.findMany({
      where,
      take: Number(limit),
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        items: {
          include: {
            medication: {
              select: {
                name: true,
                genericName: true
              }
            }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (error: any) {
    console.error('Error fetching doctor prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor prescriptions',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check for drug interactions between multiple medications
 */
async function checkDrugInteractions(medicationIds: string[]) {
  const interactions: any[] = [];

  for (let i = 0; i < medicationIds.length; i++) {
    for (let j = i + 1; j < medicationIds.length; j++) {
      const interaction = await prisma.drugInteraction.findFirst({
        where: {
          OR: [
            {
              medicationId: medicationIds[i],
              interactsWithId: medicationIds[j]
            },
            {
              medicationId: medicationIds[j],
              interactsWithId: medicationIds[i]
            }
          ]
        },
        include: {
          medication: {
            select: { name: true }
          },
          interactsWith: {
            select: { name: true }
          }
        }
      });

      if (interaction) {
        interactions.push(interaction);
      }
    }
  }

  return interactions;
}

/**
 * Generate unique prescription number
 */
async function generatePrescriptionNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Count prescriptions for today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const count = await prisma.prescription.count({
    where: {
      issuedAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const sequenceNumber = String(count + 1).padStart(4, '0');
  return `RX${year}${month}${sequenceNumber}`;
}

/**
 * Download prescription as PDF
 */
export const downloadPrescriptionPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await generatePrescriptionPDF(id, res);
  } catch (error: any) {
    console.error('Download prescription PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating prescription PDF',
      error: error.message,
    });
  }
};

/**
 * Send prescription via email
 */
export const emailPrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    await sendPrescriptionEmail(id, email);

    res.status(200).json({
      success: true,
      message: `Prescription sent successfully to ${email}`,
    });
  } catch (error: any) {
    console.error('Email prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending prescription email',
      error: error.message,
    });
  }
};
