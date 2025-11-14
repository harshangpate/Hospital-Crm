import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get available doctors by specialty
export const getDoctorsBySpecialty = async (req: Request, res: Response) => {
  try {
    const { specialty } = req.query;

    const where: any = {};

    if (specialty && typeof specialty === 'string') {
      where.specialization = specialty;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error: any) {
    console.error('Get doctors by specialty error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch doctors',
    });
  }
};

// Get available time slots for a doctor on a specific date
export const getAvailableSlots = async (req: Request, res: Response) => {
  console.log('=== GET AVAILABLE SLOTS CALLED ===');
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers.authorization);
  
  try {
    const { doctorId, date } = req.query;

    console.log('Doctor ID:', doctorId);
    console.log('Date:', date);

    if (!doctorId || !date) {
      console.log('Missing doctorId or date');
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required',
      });
    }

    // Parse the date
    const appointmentDate = new Date(date as string);
    const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Day of week:', dayOfWeek);
    console.log('Looking for doctor...');

    // Get doctor's general availability
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId as string },
      select: {
        id: true,
        doctorId: true,
        isAvailable: true,
        availableFrom: true,
        availableTo: true,
      },
    });

    console.log('Doctor found:', doctor);

    if (!doctor) {
      console.log('Doctor not found - returning 404');
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    if (!doctor.isAvailable) {
      return res.json({
        success: true,
        data: {
          date: appointmentDate.toISOString().split('T')[0],
          slots: [],
          message: 'Doctor is currently not accepting appointments',
        },
      });
    }

    // Check for weekly schedule (takes precedence over general availability)
    const weeklySchedule = await prisma.doctorWeeklySchedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctor.doctorId,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    console.log('Weekly schedule found:', weeklySchedule);

    let startTime: string;
    let endTime: string;

    // Use weekly schedule if available, otherwise fall back to general availability
    if (weeklySchedule) {
      console.log('Using weekly schedule');
      if (!weeklySchedule.isAvailable) {
        console.log('Doctor not available on this day of week');
        return res.json({
          success: true,
          data: {
            date: appointmentDate.toISOString().split('T')[0],
            slots: [],
            message: 'Doctor is not available on this day of the week',
          },
        });
      }
      startTime = weeklySchedule.startTime;
      endTime = weeklySchedule.endTime;
      console.log(`Schedule times: ${startTime} - ${endTime}`);
    } else {
      console.log('No weekly schedule, using general availability');
      // Fall back to general availability
      if (!doctor.availableFrom || !doctor.availableTo) {
        console.log('General availability not set, using default hours (9 AM - 5 PM)');
        startTime = '09:00';
        endTime = '17:00';
      } else {
        startTime = doctor.availableFrom;
        endTime = doctor.availableTo;
      }
      console.log(`General availability times: ${startTime} - ${endTime}`);
    }

    // Get existing appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'],
        },
      },
      select: {
        id: true,
        appointmentNumber: true,
        appointmentTime: true,
        status: true,
      },
    });
    
    console.log(`Found ${existingAppointments.length} existing appointments:`, existingAppointments);

    // Get blocked slots for this date
    const blockedSlots = await prisma.doctorBlockedSlot.findMany({
      where: {
        doctorId: doctor.doctorId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        startTime: true,
        endTime: true,
        type: true,
        reason: true,
      },
    });

    // Helper function to check if a time is within a blocked slot
    const isTimeBlocked = (timeString: string): { blocked: boolean; reason?: string } => {
      for (const blocked of blockedSlots) {
        if (timeString >= blocked.startTime && timeString < blocked.endTime) {
          const reasonText = blocked.reason 
            ? `${blocked.type}: ${blocked.reason}` 
            : blocked.type;
          return { blocked: true, reason: reasonText };
        }
      }
      return { blocked: false };
    };

    // Generate time slots
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    console.log(`Generating slots from ${startHour}:${startMinute} to ${endHour}:${endMinute}`);
    
    const slots: { time: string; available: boolean; reason?: string }[] = [];
    const slotDuration = 30; // minutes

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      const isBooked = existingAppointments.some(
        (apt) => apt.appointmentTime === timeString
      );
      
      const blockedCheck = isTimeBlocked(timeString);
      
      slots.push({
        time: timeString,
        available: !isBooked && !blockedCheck.blocked,
        reason: blockedCheck.blocked ? blockedCheck.reason : (isBooked ? 'Booked' : undefined),
      });

      // Increment time
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    console.log(`Generated ${slots.length} total slots`);
    console.log(`Available slots: ${slots.filter(s => s.available).length}`);

    res.json({
      success: true,
      data: {
        date: appointmentDate.toISOString().split('T')[0],
        slots,
      },
    });
  } catch (error: any) {
    console.error('Get available slots error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch available slots',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Get all unique specializations
export const getSpecializations = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      select: {
        specialization: true,
      },
      distinct: ['specialization'],
    });

    const specializations = doctors.map((d) => d.specialization).filter(Boolean);

    res.json({
      success: true,
      data: specializations,
    });
  } catch (error: any) {
    console.error('Get specializations error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch specializations',
    });
  }
};

// Update doctor availability
export const updateDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { isAvailable, availableFrom, availableTo } = req.body;

    // Find doctor by user ID
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Update availability
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        isAvailable: isAvailable !== undefined ? isAvailable : doctor.isAvailable,
        availableFrom: availableFrom || doctor.availableFrom,
        availableTo: availableTo || doctor.availableTo,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: updatedDoctor,
    });
  } catch (error: any) {
    console.error('Update availability error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update availability',
    });
  }
};

// Get doctor's own availability
export const getMyAvailability = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: {
        id: true,
        doctorId: true,
        specialization: true,
        isAvailable: true,
        availableFrom: true,
        availableTo: true,
        consultationFee: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error: any) {
    console.error('Get availability error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch availability',
    });
  }
};

// ============================================
// WEEKLY SCHEDULE MANAGEMENT
// ============================================

// Set or update weekly schedule for a doctor
export const setWeeklySchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { schedules } = req.body; // Array of { dayOfWeek, isAvailable, startTime, endTime }

    // Find doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Delete existing schedules and create new ones
    await prisma.doctorWeeklySchedule.deleteMany({
      where: { doctorId: doctor.doctorId },
    });

    const createdSchedules = await prisma.doctorWeeklySchedule.createMany({
      data: schedules.map((schedule: any) => ({
        doctorId: doctor.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        isAvailable: schedule.isAvailable,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    });

    res.json({
      success: true,
      message: 'Weekly schedule updated successfully',
      data: createdSchedules,
    });
  } catch (error: any) {
    console.error('Set weekly schedule error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set weekly schedule',
    });
  }
};

// Get weekly schedule for a doctor
export const getWeeklySchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const schedules = await prisma.doctorWeeklySchedule.findMany({
      where: { doctorId: doctor.doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    console.error('Get weekly schedule error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch weekly schedule',
    });
  }
};

// ============================================
// BLOCKED SLOTS MANAGEMENT
// ============================================

// Add a blocked slot (break, surgery, emergency, etc.)
export const addBlockedSlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { date, startTime, endTime, type, reason, isRecurring } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const blockedSlot = await prisma.doctorBlockedSlot.create({
      data: {
        doctorId: doctor.doctorId,
        date: new Date(date),
        startTime,
        endTime,
        type,
        reason: reason || null,
        isRecurring: isRecurring || false,
      },
    });

    res.json({
      success: true,
      message: 'Blocked slot added successfully',
      data: blockedSlot,
    });
  } catch (error: any) {
    console.error('Add blocked slot error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add blocked slot',
    });
  }
};

// Get all blocked slots for a doctor
export const getBlockedSlots = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const where: any = { doctorId: doctor.doctorId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const blockedSlots = await prisma.doctorBlockedSlot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({
      success: true,
      data: blockedSlots,
    });
  } catch (error: any) {
    console.error('Get blocked slots error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch blocked slots',
    });
  }
};

// Delete a blocked slot
export const deleteBlockedSlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Verify the blocked slot belongs to this doctor
    const blockedSlot = await prisma.doctorBlockedSlot.findFirst({
      where: {
        id,
        doctorId: doctor.doctorId,
      },
    });

    if (!blockedSlot) {
      return res.status(404).json({
        success: false,
        message: 'Blocked slot not found',
      });
    }

    await prisma.doctorBlockedSlot.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Blocked slot deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete blocked slot error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete blocked slot',
    });
  }
};

