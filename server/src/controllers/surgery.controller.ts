import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==================== SURGERY CONTROLLERS ====================

// Get all surgeries with filters
export const getAllSurgeries = async (req: Request, res: Response) => {
  try {
    const {
      status,
      surgeryType,
      priority,
      patientId,
      surgeonId,
      operationTheaterId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (status) where.status = status;
    if (surgeryType) where.surgeryType = surgeryType;
    if (priority) where.priority = priority;
    if (patientId) where.patientId = patientId;
    if (surgeonId) where.primarySurgeonId = surgeonId;
    if (operationTheaterId) where.operationTheaterId = operationTheaterId;

    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [surgeries, total] = await Promise.all([
      prisma.surgery.findMany({
        where,
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
          primarySurgeon: {
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
          operationTheater: true,
          surgicalTeam: true,
          preOpChecklist: true,
          intraOpRecord: true,
          postOpRecord: true,
        },
        skip,
        take,
        orderBy: {
          scheduledDate: 'desc',
        },
      }),
      prisma.surgery.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: surgeries,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Get all surgeries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch surgeries',
      error: error.message,
    });
  }
};

// Get surgery by ID
export const getSurgeryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const surgery = await prisma.surgery.findUnique({
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
        primarySurgeon: {
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
        operationTheater: true,
        surgicalTeam: true,
        preOpChecklist: true,
        intraOpRecord: true,
        postOpRecord: true,
        billingItems: true,
      },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: surgery,
    });
  } catch (error: any) {
    console.error('Get surgery by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch surgery details',
      error: error.message,
    });
  }
};

// Create surgery
const createSurgerySchema = z.object({
  patientId: z.string().uuid(),
  primarySurgeonId: z.string().uuid(),
  operationTheaterId: z.string().uuid(),
  surgeryType: z.enum(['ELECTIVE', 'EMERGENCY', 'DAY_CARE']),
  surgeryName: z.string().min(3),
  description: z.string().optional(),
  diagnosis: z.string().optional(),
  scheduledDate: z.string().datetime(),
  scheduledStartTime: z.string().datetime(),
  scheduledEndTime: z.string().datetime(),
  estimatedDuration: z.number().positive(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  anesthesiaType: z.enum(['GENERAL', 'SPINAL', 'EPIDURAL', 'LOCAL', 'REGIONAL', 'SEDATION']).optional(),
  bloodRequirement: z.string().optional(),
  specialEquipment: z.string().optional(),
  specialInstructions: z.string().optional(),
  estimatedCost: z.number().positive().optional(),
  surgicalTeam: z.array(z.object({
    userId: z.string().uuid().optional(),
    role: z.enum(['PRIMARY_SURGEON', 'ASSISTANT_SURGEON', 'ANESTHESIOLOGIST', 'SCRUB_NURSE', 'CIRCULATING_NURSE', 'TECHNICIAN', 'ANESTHESIA_TECHNICIAN']),
    name: z.string(),
    specialization: z.string().optional(),
    contactNumber: z.string().optional(),
  })).optional(),
});

export const createSurgery = async (req: Request, res: Response) => {
  try {
    const validatedData = createSurgerySchema.parse(req.body);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Check authorization
    if (!['DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to schedule surgeries',
      });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Verify surgeon exists
    const surgeon = await prisma.doctor.findUnique({
      where: { id: validatedData.primarySurgeonId },
    });

    if (!surgeon) {
      return res.status(404).json({
        success: false,
        message: 'Surgeon not found',
      });
    }

    // Verify OT exists and is available
    const ot = await prisma.operationTheater.findUnique({
      where: { id: validatedData.operationTheaterId },
    });

    if (!ot) {
      return res.status(404).json({
        success: false,
        message: 'Operation theater not found',
      });
    }

    if (!ot.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected operation theater is not active',
      });
    }

    // Check for scheduling conflicts
    const conflicts = await prisma.surgery.findMany({
      where: {
        operationTheaterId: validatedData.operationTheaterId,
        status: {
          in: ['SCHEDULED', 'PRE_OP', 'IN_PROGRESS'],
        },
        OR: [
          {
            AND: [
              { scheduledStartTime: { lte: new Date(validatedData.scheduledStartTime) } },
              { scheduledEndTime: { gte: new Date(validatedData.scheduledStartTime) } },
            ],
          },
          {
            AND: [
              { scheduledStartTime: { lte: new Date(validatedData.scheduledEndTime) } },
              { scheduledEndTime: { gte: new Date(validatedData.scheduledEndTime) } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot conflict detected. The operation theater is already booked for this time.',
        conflicts: conflicts,
      });
    }

    // Generate surgery number
    const surgeryCount = await prisma.surgery.count();
    const surgeryNumber = `SRG-${new Date().getFullYear()}-${String(surgeryCount + 1).padStart(6, '0')}`;

    // Create surgery with surgical team
    const surgery = await prisma.surgery.create({
      data: {
        surgeryNumber,
        patientId: validatedData.patientId,
        primarySurgeonId: validatedData.primarySurgeonId,
        operationTheaterId: validatedData.operationTheaterId,
        surgeryType: validatedData.surgeryType,
        surgeryName: validatedData.surgeryName,
        description: validatedData.description,
        diagnosis: validatedData.diagnosis,
        scheduledDate: new Date(validatedData.scheduledDate),
        scheduledStartTime: new Date(validatedData.scheduledStartTime),
        scheduledEndTime: new Date(validatedData.scheduledEndTime),
        estimatedDuration: validatedData.estimatedDuration,
        priority: validatedData.priority,
        anesthesiaType: validatedData.anesthesiaType,
        bloodRequirement: validatedData.bloodRequirement,
        specialEquipment: validatedData.specialEquipment,
        specialInstructions: validatedData.specialInstructions,
        estimatedCost: validatedData.estimatedCost,
        createdBy: userId,
        surgicalTeam: validatedData.surgicalTeam ? {
          create: validatedData.surgicalTeam,
        } : undefined,
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
        primarySurgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        operationTheater: true,
        surgicalTeam: true,
      },
    });

    // Update OT status if surgery is immediate
    const now = new Date();
    const surgeryStart = new Date(validatedData.scheduledStartTime);
    const timeDiff = surgeryStart.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      await prisma.operationTheater.update({
        where: { id: validatedData.operationTheaterId },
        data: { status: 'RESERVED' },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Surgery scheduled successfully',
      data: surgery,
    });
  } catch (error: any) {
    console.error('Create surgery error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to schedule surgery',
      error: error.message,
    });
  }
};

// Update surgery
export const updateSurgery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = (req as any).user.role;

    // Check authorization
    if (!['DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update surgeries',
      });
    }

    const surgery = await prisma.surgery.findUnique({
      where: { id },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    // Don't allow updates if surgery is completed or cancelled
    if (['COMPLETED', 'CANCELLED'].includes(surgery.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${surgery.status.toLowerCase()} surgery`,
      });
    }

    const updatedSurgery = await prisma.surgery.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        primarySurgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        operationTheater: true,
        surgicalTeam: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Surgery updated successfully',
      data: updatedSurgery,
    });
  } catch (error: any) {
    console.error('Update surgery error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update surgery',
      error: error.message,
    });
  }
};

// Update surgery status
export const updateSurgeryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const surgery = await prisma.surgery.findUnique({
      where: { id },
      include: {
        operationTheater: true,
      },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    const updateData: any = { status };

    // Handle status-specific logic
    if (status === 'IN_PROGRESS' && !surgery.actualStartTime) {
      updateData.actualStartTime = new Date();
      
      // Update OT status
      await prisma.operationTheater.update({
        where: { id: surgery.operationTheaterId },
        data: { status: 'OCCUPIED' },
      });
    }

    if (status === 'COMPLETED') {
      updateData.actualEndTime = new Date();
      
      if (surgery.actualStartTime) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(surgery.actualStartTime).getTime()) / (1000 * 60)
        );
        updateData.actualDuration = duration;
      }

      // Update OT status to cleaning
      await prisma.operationTheater.update({
        where: { id: surgery.operationTheaterId },
        data: { status: 'CLEANING' },
      });
    }

    if (status === 'CANCELLED') {
      updateData.cancelledReason = remarks;
      updateData.cancelledAt = new Date();

      // Free up the OT
      await prisma.operationTheater.update({
        where: { id: surgery.operationTheaterId },
        data: { status: 'AVAILABLE' },
      });
    }

    const updatedSurgery = await prisma.surgery.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        primarySurgeon: {
          include: {
            user: true,
          },
        },
        operationTheater: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Surgery status updated successfully',
      data: updatedSurgery,
    });
  } catch (error: any) {
    console.error('Update surgery status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update surgery status',
      error: error.message,
    });
  }
};

// Delete surgery
export const deleteSurgery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;

    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete surgeries',
      });
    }

    const surgery = await prisma.surgery.findUnique({
      where: { id },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    // Only allow deletion of scheduled or cancelled surgeries
    if (!['SCHEDULED', 'CANCELLED'].includes(surgery.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete surgery in current status',
      });
    }

    await prisma.surgery.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Surgery deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete surgery error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete surgery',
      error: error.message,
    });
  }
};

// Get upcoming surgeries for a surgeon
export const getSurgeonUpcomingSurgeries = async (req: Request, res: Response) => {
  try {
    const { surgeonId } = req.params;
    const { days = '7' } = req.query;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days as string));

    const surgeries = await prisma.surgery.findMany({
      where: {
        primarySurgeonId: surgeonId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['SCHEDULED', 'PRE_OP'],
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        operationTheater: true,
        surgicalTeam: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: surgeries,
    });
  } catch (error: any) {
    console.error('Get surgeon upcoming surgeries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming surgeries',
      error: error.message,
    });
  }
};

// Get patient surgeries
export const getPatientSurgeries = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const surgeries = await prisma.surgery.findMany({
      where: {
        patientId,
      },
      include: {
        primarySurgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        operationTheater: true,
        surgicalTeam: true,
        preOpChecklist: true,
        postOpRecord: true,
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: surgeries,
    });
  } catch (error: any) {
    console.error('Get patient surgeries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient surgeries',
      error: error.message,
    });
  }
};
