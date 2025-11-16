import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==================== OPERATION THEATER CONTROLLERS ====================

// Get all operation theaters
export const getAllOperationTheaters = async (req: Request, res: Response) => {
  try {
    const { status, type, isActive } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const operationTheaters = await prisma.operationTheater.findMany({
      where,
      include: {
        _count: {
          select: {
            surgeries: true,
            equipmentList: true,
          },
        },
      },
      orderBy: {
        otNumber: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: operationTheaters,
    });
  } catch (error: any) {
    console.error('Get all operation theaters error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch operation theaters',
      error: error.message,
    });
  }
};

// Get OT by ID
export const getOperationTheaterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ot = await prisma.operationTheater.findUnique({
      where: { id },
      include: {
        surgeries: {
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
          },
          orderBy: {
            scheduledStartTime: 'desc',
          },
        },
        equipmentList: true,
        maintenanceLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!ot) {
      return res.status(404).json({
        success: false,
        message: 'Operation theater not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: ot,
    });
  } catch (error: any) {
    console.error('Get operation theater by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch operation theater details',
      error: error.message,
    });
  }
};

// Create operation theater
const createOTSchema = z.object({
  name: z.string().min(2),
  otNumber: z.string().min(1),
  type: z.enum(['GENERAL', 'CARDIAC', 'ORTHOPEDIC', 'NEUROSURGERY', 'GYNECOLOGY', 'PEDIATRIC', 'TRAUMA', 'OPHTHALMIC', 'ENT', 'ENDOSCOPY']),
  floor: z.number().optional(),
  building: z.string().optional(),
  capacity: z.number().positive().default(1),
  hasLaminairFlow: z.boolean().default(false),
  hasVideoSystem: z.boolean().default(false),
  equipment: z.array(z.string()).optional(),
  specialFeatures: z.string().optional(),
  sterilityLevel: z.string().optional(),
});

export const createOperationTheater = async (req: Request, res: Response) => {
  try {
    const validatedData = createOTSchema.parse(req.body);
    const userRole = (req as any).user.role;

    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create operation theaters',
      });
    }

    // Check if OT number already exists
    const existing = await prisma.operationTheater.findUnique({
      where: { otNumber: validatedData.otNumber },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Operation theater with this OT number already exists',
      });
    }

    const ot = await prisma.operationTheater.create({
      data: validatedData,
    });

    return res.status(201).json({
      success: true,
      message: 'Operation theater created successfully',
      data: ot,
    });
  } catch (error: any) {
    console.error('Create operation theater error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create operation theater',
      error: error.message,
    });
  }
};

// Update operation theater
export const updateOperationTheater = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = (req as any).user.role;

    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update operation theaters',
      });
    }

    const ot = await prisma.operationTheater.findUnique({
      where: { id },
    });

    if (!ot) {
      return res.status(404).json({
        success: false,
        message: 'Operation theater not found',
      });
    }

    const updatedOT = await prisma.operationTheater.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Operation theater updated successfully',
      data: updatedOT,
    });
  } catch (error: any) {
    console.error('Update operation theater error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update operation theater',
      error: error.message,
    });
  }
};

// Update OT status
export const updateOTStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ot = await prisma.operationTheater.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: 'OT status updated successfully',
      data: ot,
    });
  } catch (error: any) {
    console.error('Update OT status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update OT status',
      error: error.message,
    });
  }
};

// Delete operation theater
export const deleteOperationTheater = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;

    if (!['SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can delete operation theaters',
      });
    }

    const ot = await prisma.operationTheater.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            surgeries: true,
          },
        },
      },
    });

    if (!ot) {
      return res.status(404).json({
        success: false,
        message: 'Operation theater not found',
      });
    }

    // Don't allow deletion if there are associated surgeries
    if (ot._count.surgeries > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete operation theater with associated surgeries',
      });
    }

    await prisma.operationTheater.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Operation theater deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete operation theater error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete operation theater',
      error: error.message,
    });
  }
};

// Get OT schedule for a date range
export const getOTSchedule = async (req: Request, res: Response) => {
  try {
    const { otId, startDate, endDate } = req.query;

    if (!otId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'otId, startDate, and endDate are required',
      });
    }

    const surgeries = await prisma.surgery.findMany({
      where: {
        operationTheaterId: otId as string,
        scheduledDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
        status: {
          not: 'CANCELLED',
        },
      },
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
    console.error('Get OT schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch OT schedule',
      error: error.message,
    });
  }
};

// Get OT availability
export const getOTAvailability = async (req: Request, res: Response) => {
  try {
    const { date, duration } = req.query;

    if (!date || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Date and duration (in minutes) are required',
      });
    }

    const selectedDate = new Date(date as string);
    const durationMinutes = parseInt(duration as string);

    // Get all active OTs
    const ots = await prisma.operationTheater.findMany({
      where: {
        isActive: true,
        status: {
          in: ['AVAILABLE', 'RESERVED'],
        },
      },
    });

    // Check availability for each OT
    const availability = await Promise.all(
      ots.map(async (ot) => {
        // Get scheduled surgeries for this OT on the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const surgeries = await prisma.surgery.findMany({
          where: {
            operationTheaterId: ot.id,
            scheduledDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: {
              in: ['SCHEDULED', 'PRE_OP', 'IN_PROGRESS'],
            },
          },
          orderBy: {
            scheduledStartTime: 'asc',
          },
        });

        // Calculate available time slots
        const workingHours = {
          start: 8, // 8 AM
          end: 20, // 8 PM
        };

        const availableSlots: any[] = [];
        let currentTime = new Date(selectedDate);
        currentTime.setHours(workingHours.start, 0, 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(workingHours.end, 0, 0, 0);

        while (currentTime < endTime) {
          const slotEnd = new Date(currentTime);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          if (slotEnd > endTime) break;

          // Check if this slot conflicts with any surgery
          const hasConflict = surgeries.some((surgery) => {
            const surgeryStart = new Date(surgery.scheduledStartTime);
            const surgeryEnd = new Date(surgery.scheduledEndTime);

            return (
              (currentTime >= surgeryStart && currentTime < surgeryEnd) ||
              (slotEnd > surgeryStart && slotEnd <= surgeryEnd) ||
              (currentTime <= surgeryStart && slotEnd >= surgeryEnd)
            );
          });

          if (!hasConflict) {
            availableSlots.push({
              startTime: new Date(currentTime),
              endTime: new Date(slotEnd),
            });
          }

          currentTime.setMinutes(currentTime.getMinutes() + 30); // Move in 30-minute increments
        }

        return {
          ot: {
            id: ot.id,
            name: ot.name,
            otNumber: ot.otNumber,
            type: ot.type,
            status: ot.status,
          },
          availableSlots,
          scheduledSurgeries: surgeries.length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error: any) {
    console.error('Get OT availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch OT availability',
      error: error.message,
    });
  }
};

// Get OT dashboard stats
export const getOTDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOTs,
      availableOTs,
      occupiedOTs,
      todaysSurgeries,
      inProgressSurgeries,
      completedToday,
      upcomingSurgeries,
    ] = await Promise.all([
      prisma.operationTheater.count({ where: { isActive: true } }),
      prisma.operationTheater.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.operationTheater.count({ where: { status: 'OCCUPIED' } }),
      prisma.surgery.count({
        where: {
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.surgery.count({
        where: {
          status: 'IN_PROGRESS',
        },
      }),
      prisma.surgery.count({
        where: {
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
          status: 'COMPLETED',
        },
      }),
      prisma.surgery.count({
        where: {
          scheduledDate: {
            gte: tomorrow,
          },
          status: 'SCHEDULED',
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalOTs,
        availableOTs,
        occupiedOTs,
        underMaintenance: totalOTs - availableOTs - occupiedOTs,
        todaysSurgeries,
        inProgressSurgeries,
        completedToday,
        upcomingSurgeries,
        utilizationRate: totalOTs > 0 ? ((occupiedOTs / totalOTs) * 100).toFixed(2) : 0,
      },
    });
  } catch (error: any) {
    console.error('Get OT dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};

// Add OT maintenance log
const createMaintenanceLogSchema = z.object({
  maintenanceType: z.string(),
  description: z.string(),
  performedBy: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  cost: z.number().optional(),
  vendor: z.string().optional(),
  remarks: z.string().optional(),
});

export const addMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const { otId } = req.params;
    const validatedData = createMaintenanceLogSchema.parse(req.body);

    const log = await prisma.oTMaintenanceLog.create({
      data: {
        operationTheaterId: otId,
        ...validatedData,
        startedAt: new Date(validatedData.startedAt),
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : undefined,
      },
    });

    // Update OT status if maintenance is ongoing
    if (!validatedData.completedAt) {
      await prisma.operationTheater.update({
        where: { id: otId },
        data: { status: 'UNDER_MAINTENANCE' },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Maintenance log added successfully',
      data: log,
    });
  } catch (error: any) {
    console.error('Add maintenance log error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to add maintenance log',
      error: error.message,
    });
  }
};
