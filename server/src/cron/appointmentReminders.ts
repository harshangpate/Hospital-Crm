import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/email.service';

// Use singleton Prisma client to avoid multiple connections
const prisma = new PrismaClient();

// Run daily at 9:00 AM to send reminders for appointments 24 hours from now
export const startAppointmentReminderCron = () => {
  // Schedule: "0 9 * * *" = Every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running appointment reminder cron job...');
    
    try {
      // Calculate time range: 24 hours from now (23-25 hours to have buffer)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(tomorrow.getHours() + 23);
      
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 25);

      // Find all confirmed appointments scheduled 24 hours from now
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: tomorrow,
            lte: dayAfterTomorrow,
          },
          status: 'CONFIRMED',
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          doctor: {
            include: {
              user: true,
            },
          },
        },
      });

      console.log(`📧 Found ${upcomingAppointments.length} appointments to send reminders for`);

      // Send reminder email for each appointment
      for (const appointment of upcomingAppointments) {
        try {
          const patientEmail = appointment.patient.user.email;
          const patientName = `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`;
          const doctorName = `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;

          await emailService.sendAppointmentReminder(patientEmail, {
            patientName,
            doctorName,
            doctorSpecialization: appointment.doctor.specialization,
            appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
            appointmentTime: appointment.appointmentTime,
            appointmentNumber: appointment.appointmentNumber,
            appointmentType: 'CONSULTATION',
            consultationFee: 0,
            hospitalName: process.env.HOSPITAL_NAME || 'City General Hospital',
            hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center Drive',
          });

          console.log(`✅ Reminder sent to ${patientEmail} for appointment ${appointment.appointmentNumber}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for appointment ${appointment.appointmentNumber}:`, error);
        }
      }

      console.log('✅ Appointment reminder cron job completed');
    } catch (error) {
      console.error('❌ Error in appointment reminder cron job:', error);
    }
  });

  console.log('✅ Appointment reminder cron job scheduled (daily at 9:00 AM)');
};

// Optional: Manual trigger for testing
export const sendRemindersNow = async () => {
  console.log('🔔 Manually triggering appointment reminders...');
  
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 23);
    
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 25);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: tomorrow,
          lte: dayAfterTomorrow,
        },
        status: 'CONFIRMED',
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`📧 Found ${upcomingAppointments.length} appointments to send reminders for`);

    for (const appointment of upcomingAppointments) {
      try {
        const patientEmail = appointment.patient.user.email;
        const patientName = `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`;
        const doctorName = `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;

        await emailService.sendAppointmentReminder(patientEmail, {
          patientName,
          doctorName,
          doctorSpecialization: appointment.doctor.specialization,
          appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
          appointmentTime: appointment.appointmentTime,
          appointmentNumber: appointment.appointmentNumber,
          appointmentType: 'CONSULTATION',
          consultationFee: 0,
          hospitalName: process.env.HOSPITAL_NAME || 'City General Hospital',
          hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center Drive',
        });

        console.log(`✅ Reminder sent to ${patientEmail} for appointment ${appointment.appointmentNumber}`);
      } catch (error) {
        console.error(`❌ Failed to send reminder for appointment ${appointment.appointmentNumber}:`, error);
      }
    }

    return { success: true, count: upcomingAppointments.length };
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
    return { success: false, error };
  }
};
