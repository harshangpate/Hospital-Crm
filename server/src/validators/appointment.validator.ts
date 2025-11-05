import { z } from 'zod';

// Create appointment validation
export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(), // Optional for staff booking
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().datetime('Invalid appointment date'),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  appointmentType: z.enum(['NEW_CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECKUP', 'TELEMEDICINE']),
});

// Update appointment status validation
export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  doctorNotes: z.string().max(2000, 'Notes too long').optional(),
});

// Reschedule appointment validation
export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().datetime('Invalid appointment date'),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  reason: z.string().min(5, 'Reason for rescheduling required').max(500, 'Reason too long'),
});

// Get appointments query validation
export const getAppointmentsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Doctor availability validation
export const setDoctorAvailabilitySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  slotDuration: z.number().int().min(15).max(120).default(30), // Duration in minutes
  isAvailable: z.boolean().default(true),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>;
export type SetDoctorAvailabilityInput = z.infer<typeof setDoctorAvailabilitySchema>;
