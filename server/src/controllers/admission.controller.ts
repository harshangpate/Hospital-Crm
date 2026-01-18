import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Create new admission
export const createAdmission = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      bedId,
      admissionType,
      attendingDoctorId,
      reasonForAdmission,
      primaryDiagnosis,
      estimatedDischarge,
      relativeName,
      relativePhone,
      advancePayment,
    } = req.body;

    // Validate required fields
    if (!patientId || !admissionType || !attendingDoctorId || !reasonForAdmission) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate admission number
    const year = new Date().getFullYear();
    const admissionCount = await prisma.admission.count();
    const admissionNumber = `ADM-${year}-${String(admissionCount + 1).padStart(5, '0')}`;

    // If bed is assigned, check availability and update status
    if (bedId) {
      const bed = await prisma.bed.findUnique({ where: { id: bedId } });
      if (!bed || bed.status !== 'AVAILABLE') {
        return res.status(400).json({ message: 'Selected bed is not available' });
      }

      // Update bed status to OCCUPIED
      await prisma.bed.update({
        where: { id: bedId },
        data: { status: 'OCCUPIED' },
      });

      // Update ward occupied beds count
      await prisma.ward.update({
        where: { id: bed.wardId },
        data: { occupiedBeds: { increment: 1 } },
      });
    }

    // Create admission
    const admission = await prisma.admission.create({
      data: {
        admissionNumber,
        patientId,
        bedId: bedId || null,
        admissionType,
        attendingDoctorId,
        reasonForAdmission,
        primaryDiagnosis: primaryDiagnosis || null,
        estimatedDischarge: estimatedDischarge ? new Date(estimatedDischarge) : null,
        relativeName: relativeName || null,
        relativePhone: relativePhone || null,
        advancePayment: advancePayment || null,
        status: 'ADMITTED',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                gender: true,
                dateOfBirth: true,
              },
            },
          },
        },
        bed: {
          include: {
            ward: true,
          },
        },
      },
    });

    // Create invoice for admission
    if (bedId) {
      const bed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: { ward: true },
      });

      if (bed) {
        const year = new Date().getFullYear();
        const invoiceCount = await prisma.invoice.count();
        const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(6, '0')}`;

        // Create invoice with initial bed charge (1 day minimum)
        const bedCharges = bed.ward.chargesPerDay;
        
        let paymentStatus: PaymentStatus = 'PENDING';
        if (advancePayment && advancePayment >= bedCharges) {
          paymentStatus = 'PAID';
        } else if (advancePayment && advancePayment > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        }
        
        await prisma.invoice.create({
          data: {
            invoiceNumber,
            patientId,
            subtotal: bedCharges,
            totalAmount: bedCharges,
            balanceAmount: advancePayment ? bedCharges - advancePayment : bedCharges,
            paidAmount: advancePayment || 0,
            paymentStatus,
            notes: `IPD Admission - ${admissionNumber}`,
            invoiceItems: {
              create: [
                {
                  itemType: 'BED_CHARGES',
                  itemName: `Bed Charges - Day 1`,
                  description: `${bed.ward.wardName} - ${bed.ward.wardType} (${bed.bedNumber})`,
                  quantity: 1,
                  unitPrice: bedCharges,
                  totalPrice: bedCharges,
                  serviceDate: admission.admissionDate,
                },
              ],
            },
          },
        });
      }
    }

    res.status(201).json({
      message: 'Patient admitted successfully',
      data: admission,
    });
  } catch (error: any) {
    console.error('Error creating admission:', error);
    res.status(500).json({ message: 'Failed to create admission', error: error.message });
  }
};

// Get all admissions with filters
export const getAdmissions = async (req: Request, res: Response) => {
  try {
    const {
      status,
      patientId,
      bedId,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (bedId) where.bedId = bedId;

    if (search) {
      where.OR = [
        { admissionNumber: { contains: search as string, mode: 'insensitive' } },
        { reasonForAdmission: { contains: search as string, mode: 'insensitive' } },
        { primaryDiagnosis: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        skip,
        take,
        orderBy: { admissionDate: 'desc' },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  gender: true,
                  dateOfBirth: true,
                },
              },
            },
          },
          bed: {
            include: {
              ward: true,
            },
          },
        },
      }),
      prisma.admission.count({ where }),
    ]);

    res.json({
      data: {
        admissions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ message: 'Failed to fetch admissions', error: error.message });
  }
};

// Get admission by ID
export const getAdmissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const admission = await prisma.admission.findUnique({
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
                gender: true,
                dateOfBirth: true,
              },
            },
          },
        },
        bed: {
          include: {
            ward: true,
          },
        },
      },
    });

    if (!admission) {
      return res.status(404).json({ 
        success: false,
        message: 'Admission not found' 
      });
    }

    res.json({ 
      success: true,
      data: admission 
    });
  } catch (error: any) {
    console.error('Error fetching admission:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch admission', 
      error: error.message 
    });
  }
};

// Update admission
export const updateAdmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if admission exists
    const existing = await prisma.admission.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    // If bed is being changed
    if (updates.bedId && updates.bedId !== existing.bedId) {
      // Free old bed if exists
      if (existing.bedId) {
        const oldBed = await prisma.bed.findUnique({ where: { id: existing.bedId } });
        if (oldBed) {
          await prisma.bed.update({
            where: { id: existing.bedId },
            data: { status: 'AVAILABLE' },
          });
          await prisma.ward.update({
            where: { id: oldBed.wardId },
            data: { occupiedBeds: { decrement: 1 } },
          });
        }
      }

      // Occupy new bed
      const newBed = await prisma.bed.findUnique({ where: { id: updates.bedId } });
      if (!newBed || newBed.status !== 'AVAILABLE') {
        return res.status(400).json({ message: 'Selected bed is not available' });
      }

      await prisma.bed.update({
        where: { id: updates.bedId },
        data: { status: 'OCCUPIED' },
      });
      await prisma.ward.update({
        where: { id: newBed.wardId },
        data: { occupiedBeds: { increment: 1 } },
      });
    }

    const admission = await prisma.admission.update({
      where: { id },
      data: updates,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                gender: true,
                dateOfBirth: true,
              },
            },
          },
        },
        bed: {
          include: {
            ward: true,
          },
        },
      },
    });

    res.json({
      message: 'Admission updated successfully',
      data: admission,
    });
  } catch (error: any) {
    console.error('Error updating admission:', error);
    res.status(500).json({ message: 'Failed to update admission', error: error.message });
  }
};

// Discharge patient
export const dischargePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      dischargeDate,
      dischargeSummary, 
      finalDiagnosis,
      treatmentProvided,
      medicationsOnDischarge,
      followUpInstructions,
      followUpDate,
      dischargedBy,
      patientCondition,
      dischargeType
    } = req.body;

    // Validation
    if (!dischargeSummary || !finalDiagnosis || !dischargedBy) {
      return res.status(400).json({ 
        message: 'Discharge summary, final diagnosis, and discharging doctor are required' 
      });
    }

    const admission = await prisma.admission.findUnique({
      where: { id },
      include: { 
        bed: {
          include: {
            ward: true,
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    if (admission.status === 'DISCHARGED') {
      return res.status(400).json({ message: 'Patient already discharged' });
    }

    // Calculate total days and update invoice with all bed charges before discharge
    if (admission.bed) {
      const admissionDate = new Date(admission.admissionDate);
      const now = new Date();
      const totalDays = Math.ceil(
        (now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find invoice for this admission
      const invoice = await prisma.invoice.findFirst({
        where: {
          patientId: admission.patientId,
          invoiceNumber: { contains: admission.admissionNumber },
        },
        include: {
          invoiceItems: true,
        },
      });

      if (invoice) {
        // Count existing bed charge items
        const existingBedDays = invoice.invoiceItems.filter((item) =>
          item.itemType === 'BED_CHARGES' || item.itemName.includes('Bed Charges')
        ).length;

        // Add missing days
        if (totalDays > existingBedDays) {
          const daysToAdd = totalDays - existingBedDays;
          const chargesPerDay = admission.bed.ward.chargesPerDay;

          // Add new invoice items for missing days
          for (let day = existingBedDays + 1; day <= totalDays; day++) {
            await prisma.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                itemName: `${admission.bed.ward.wardName} - ${admission.bed.bedNumber}`,
                description: `Bed charges for ${admission.bed.ward.wardType} ward - Day ${day}`,
                itemType: 'BED_CHARGES',
                quantity: 1,
                unitPrice: chargesPerDay,
                totalPrice: chargesPerDay,
              },
            });
          }

          // Update invoice totals
          const newTotalAmount = invoice.totalAmount + (daysToAdd * chargesPerDay);
          const newBalanceAmount = newTotalAmount - invoice.paidAmount;

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              subtotal: newTotalAmount,
              totalAmount: newTotalAmount,
              balanceAmount: newBalanceAmount,
              paymentStatus:
                newBalanceAmount <= 0
                  ? 'PAID'
                  : invoice.paidAmount > 0
                  ? 'PARTIALLY_PAID'
                  : 'PENDING',
            },
          });
        }
      }
    }

    // Free the bed if assigned
    if (admission.bedId && admission.bed) {
      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });
      await prisma.ward.update({
        where: { id: admission.bed.wardId },
        data: { occupiedBeds: { decrement: 1 } },
      });
    }

    // Update admission with complete discharge details
    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: {
        status: 'DISCHARGED',
        dischargeDate: dischargeDate ? new Date(dischargeDate) : new Date(),
        dischargeSummary,
        dischargeInstructions: followUpInstructions || null,
        finalDiagnosis: finalDiagnosis || null,
        treatmentProvided: treatmentProvided || null,
        medicationsOnDischarge: medicationsOnDischarge || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        dischargedBy: dischargedBy || null,
        patientCondition: patientCondition || 'STABLE',
        dischargeType: dischargeType || 'ROUTINE',
      },
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
      },
    });

    // Create notification for patient
    try {
      await prisma.notification.create({
        data: {
          userId: admission.patient.userId,
          title: 'Discharge Summary Available',
          message: `You have been discharged from ${admission.bed?.ward.wardName || 'the hospital'}. Your discharge summary is now available.`,
          type: 'INFO',
          linkText: 'View Summary',
          linkUrl: `/dashboard/ipd/admissions/${admission.id}`,
        },
      });
    } catch (notifError) {
      console.error('Failed to create discharge notification:', notifError);
      // Don't fail the discharge if notification fails
    }

    res.json({
      message: 'Patient discharged successfully',
      data: updatedAdmission,
    });
  } catch (error: any) {
    console.error('Error discharging patient:', error);
    res.status(500).json({ message: 'Failed to discharge patient', error: error.message });
  }
};

// Transfer patient (to different bed/ward)
export const transferPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newBedId, reason } = req.body;

    if (!newBedId) {
      return res.status(400).json({ message: 'New bed ID is required' });
    }

    const admission = await prisma.admission.findUnique({
      where: { id },
      include: { bed: true },
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    if (admission.status !== 'ADMITTED') {
      return res.status(400).json({ message: 'Can only transfer admitted patients' });
    }

    // Check new bed availability
    const newBed = await prisma.bed.findUnique({ where: { id: newBedId } });
    if (!newBed || newBed.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'New bed is not available' });
    }

    // Free old bed if exists
    if (admission.bedId && admission.bed) {
      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });
      await prisma.ward.update({
        where: { id: admission.bed.wardId },
        data: { occupiedBeds: { decrement: 1 } },
      });
    }

    // Occupy new bed
    await prisma.bed.update({
      where: { id: newBedId },
      data: { status: 'OCCUPIED' },
    });
    await prisma.ward.update({
      where: { id: newBed.wardId },
      data: { occupiedBeds: { increment: 1 } },
    });

    // Update admission
    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: {
        bedId: newBedId,
        status: 'TRANSFERRED',
      },
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
        bed: {
          include: {
            ward: true,
          },
        },
      },
    });

    res.json({
      message: 'Patient transferred successfully',
      data: updatedAdmission,
    });
  } catch (error: any) {
    console.error('Error transferring patient:', error);
    res.status(500).json({ message: 'Failed to transfer patient', error: error.message });
  }
};

// Get admission statistics
export const getAdmissionStats = async (req: Request, res: Response) => {
  try {
    const [
      totalAdmissions,
      activeAdmissions,
      dischargedToday,
      totalBeds,
      occupiedBeds,
    ] = await Promise.all([
      prisma.admission.count(),
      prisma.admission.count({ where: { status: 'ADMITTED' } }),
      prisma.admission.count({
        where: {
          status: 'DISCHARGED',
          dischargeDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.bed.count({ where: { isActive: true } }),
      prisma.bed.count({ where: { status: 'OCCUPIED', isActive: true } }),
    ]);

    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';

    res.json({
      data: {
        totalAdmissions,
        activeAdmissions,
        dischargedToday,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: parseFloat(occupancyRate),
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};

// Delete admission
export const deleteAdmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const admission = await prisma.admission.findUnique({
      where: { id },
      include: { bed: true },
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    // Free bed if occupied
    if (admission.bedId && admission.bed && admission.status === 'ADMITTED') {
      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });
      await prisma.ward.update({
        where: { id: admission.bed.wardId },
        data: { occupiedBeds: { decrement: 1 } },
      });
    }

    await prisma.admission.delete({ where: { id } });

    res.json({ message: 'Admission deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting admission:', error);
    res.status(500).json({ message: 'Failed to delete admission', error: error.message });
  }
};
