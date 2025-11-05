import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  getAppointmentsQuerySchema,
} from '../validators/appointment.validator';
import emailService from '../services/email.service';
import { createNotification } from './notification.controller';

const prisma = new PrismaClient();

// Create appointment (Patient)
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    let patient;

    // If patientId is provided (staff booking for patient), use it
    // Otherwise, use the authenticated user's patient record (patient booking for themselves)
    if (validatedData.patientId) {
      // Verify user is staff member
      if (!['RECEPTIONIST', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only staff members can book appointments for other patients',
        });
      }

      patient = await prisma.patient.findUnique({
        where: { id: validatedData.patientId },
      });
    } else {
      // Get patient record for authenticated user
      patient = await prisma.patient.findUnique({
        where: { userId },
      });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found',
      });
    }

    // Verify doctor exists and is available
    const doctor = await prisma.doctor.findUnique({
      where: { id: validatedData.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Check if slot is available
    const appointmentDateTime = new Date(`${validatedData.appointmentDate.split('T')[0]}T${validatedData.appointmentTime}:00Z`);
    
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: validatedData.doctorId,
        appointmentDate: appointmentDateTime,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked',
      });
    }

    // Generate appointment number
    const appointmentCount = await prisma.appointment.count();
    const appointmentNumber = `APT-${new Date().getFullYear()}-${String(appointmentCount + 1).padStart(6, '0')}`;

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId: patient.id,
        doctorId: validatedData.doctorId,
        appointmentDate: appointmentDateTime,
        appointmentTime: validatedData.appointmentTime,
        reason: validatedData.reason,
        notes: validatedData.notes,
        type: validatedData.appointmentType as any,
        status: 'SCHEDULED',
        bookedBy: userId,
      },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    }) as any;

    // Send confirmation email (don't wait for it)
    emailService.sendAppointmentConfirmation(
      appointment.patient.user.email,
      {
        patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
        doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        appointmentTime: formatTime(appointment.appointmentTime),
        appointmentType: appointment.type.replace('_', ' '),
        doctorSpecialization: appointment.doctor.specialization,
        consultationFee: appointment.doctor.consultationFee,
        hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
        hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center, Healthcare City',
      }
    ).catch(err => console.error('Email sending failed:', err));

    // Send in-app notification to patient
    createNotification(
      appointment.patient.userId,
      'Appointment Confirmed',
      `Your appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName} has been scheduled for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${formatTime(appointment.appointmentTime)}.`,
      'APPOINTMENT',
      'View Appointment',
      `/dashboard/appointments/${appointment.id}`
    ).catch(err => console.error('Notification creation failed:', err));

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create appointment',
    });
  }
};

// Helper function to format time
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Get appointments (with filters)
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const query = getAppointmentsQuerySchema.parse(req.query);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause based on role and filters
    const where: any = {};

    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (patient) {
        where.patientId = patient.id;
      }
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (doctor) {
        where.doctorId = doctor.id;
      }
    }

    // Apply additional filters
    if (query.patientId) where.patientId = query.patientId;
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    
    if (query.startDate || query.endDate) {
      where.appointmentDate = {};
      if (query.startDate) where.appointmentDate.gte = new Date(query.startDate);
      if (query.endDate) where.appointmentDate.lte = new Date(query.endDate);
    }

    // Get appointments
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: { user: true },
          },
          doctor: {
            include: { user: true },
          },
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get appointments error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch appointments',
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (appointment.patientId !== patient?.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (appointment.doctorId !== doctor?.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    console.error('Get appointment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch appointment',
    });
  }
};

// Update appointment status (Doctor/Admin)
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateAppointmentStatusSchema.parse(req.body);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (appointment.doctorId !== doctor?.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: validatedData.status,
        doctorNotes: validatedData.doctorNotes,
      },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: updatedAppointment,
    });
  } catch (error: any) {
    console.error('Update appointment status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update appointment status',
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (appointment.patientId !== patient?.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (appointment.doctorId !== doctor?.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Can't cancel completed appointments
    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointments',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    // Send cancellation email
    emailService.sendAppointmentCancellation(
      updatedAppointment.patient.user.email,
      {
        patientName: `${updatedAppointment.patient.user.firstName} ${updatedAppointment.patient.user.lastName}`,
        doctorName: `${updatedAppointment.doctor.user.firstName} ${updatedAppointment.doctor.user.lastName}`,
        appointmentNumber: updatedAppointment.appointmentNumber,
        appointmentDate: new Date(updatedAppointment.appointmentDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        appointmentTime: formatTime(updatedAppointment.appointmentTime),
        appointmentType: updatedAppointment.type.replace('_', ' '),
        doctorSpecialization: updatedAppointment.doctor.specialization,
        consultationFee: updatedAppointment.doctor.consultationFee,
        hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
        hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center, Healthcare City',
        reason: updatedAppointment.cancellationReason || undefined,
      }
    ).catch(err => console.error('Email sending failed:', err));

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment,
    });
  } catch (error: any) {
    console.error('Cancel appointment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel appointment',
    });
  }
};

// Reschedule appointment
export const rescheduleAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = rescheduleAppointmentSchema.parse(req.body);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (appointment.patientId !== patient?.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Check new slot availability
    const appointmentDateTime = new Date(`${validatedData.appointmentDate.split('T')[0]}T${validatedData.appointmentTime}:00Z`);
    
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: appointmentDateTime,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        id: {
          not: id,
        },
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: appointmentDateTime,
        rescheduledReason: validatedData.reason,
        status: 'SCHEDULED',
      },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    // Send rescheduled email
    emailService.sendAppointmentRescheduled(
      updatedAppointment.patient.user.email,
      {
        patientName: `${updatedAppointment.patient.user.firstName} ${updatedAppointment.patient.user.lastName}`,
        doctorName: `${updatedAppointment.doctor.user.firstName} ${updatedAppointment.doctor.user.lastName}`,
        appointmentNumber: updatedAppointment.appointmentNumber,
        appointmentDate: new Date(updatedAppointment.appointmentDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        appointmentTime: formatTime(validatedData.appointmentTime),
        appointmentType: updatedAppointment.type.replace('_', ' '),
        doctorSpecialization: updatedAppointment.doctor.specialization,
        consultationFee: updatedAppointment.doctor.consultationFee,
        hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
        hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center, Healthcare City',
        reason: updatedAppointment.rescheduledReason || undefined,
      }
    ).catch(err => console.error('Email sending failed:', err));

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment,
    });
  } catch (error: any) {
    console.error('Reschedule appointment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reschedule appointment',
    });
  }
};

// Get appointment statistics (Dashboard)
export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let stats: any = {};

    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      
      if (patient) {
        const [upcoming, total, completed] = await Promise.all([
          prisma.appointment.count({
            where: {
              patientId: patient.id,
              appointmentDate: { gte: today },
              status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
            },
          }),
          prisma.appointment.count({
            where: { patientId: patient.id },
          }),
          prisma.appointment.count({
            where: {
              patientId: patient.id,
              status: 'COMPLETED',
            },
          }),
        ]);

        stats = { upcoming, total, completed };
      }
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      
      if (doctor) {
        const [todayAppointments, completedToday, pending, totalPatients] = await Promise.all([
          prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              appointmentDate: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              appointmentDate: {
                gte: today,
                lt: tomorrow,
              },
              status: 'COMPLETED',
            },
          }),
          prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              appointmentDate: {
                gte: today,
                lt: tomorrow,
              },
              status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
            },
          }),
          // Get unique patients count for this doctor
          prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            distinct: ['patientId'],
            select: { patientId: true }
          }).then(result => result.length)
        ]);

        stats = { todayAppointments, completedToday, pending, totalPatients };
      }
    } else if (userRole === 'ADMIN') {
      const [todayAppointments, totalPatients, totalDoctors] = await Promise.all([
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.patient.count(),
        prisma.doctor.count(),
      ]);

      stats = { todayAppointments, totalPatients, totalDoctors };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get appointment stats error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch appointment statistics',
    });
  }
};
