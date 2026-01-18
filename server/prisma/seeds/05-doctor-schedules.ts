import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDoctorSchedules() {
  console.log('🌱 Seeding Doctor Weekly Schedules...');

  const schedules = [
    // Dr. Sarah Johnson (Cardiologist) - DOC001
    { doctorId: 'DOC001', dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC001', dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC001', dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC001', dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC001', dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '14:00' },
    { doctorId: 'DOC001', dayOfWeek: 6, isAvailable: false, startTime: '00:00', endTime: '00:00' },
    { doctorId: 'DOC001', dayOfWeek: 0, isAvailable: false, startTime: '00:00', endTime: '00:00' },

    // Dr. Michael Chen (General Medicine) - DOC002
    { doctorId: 'DOC002', dayOfWeek: 1, isAvailable: true, startTime: '08:00', endTime: '16:00' },
    { doctorId: 'DOC002', dayOfWeek: 2, isAvailable: true, startTime: '08:00', endTime: '16:00' },
    { doctorId: 'DOC002', dayOfWeek: 3, isAvailable: true, startTime: '08:00', endTime: '16:00' },
    { doctorId: 'DOC002', dayOfWeek: 4, isAvailable: true, startTime: '08:00', endTime: '16:00' },
    { doctorId: 'DOC002', dayOfWeek: 5, isAvailable: true, startTime: '08:00', endTime: '16:00' },
    { doctorId: 'DOC002', dayOfWeek: 6, isAvailable: true, startTime: '09:00', endTime: '13:00' },
    { doctorId: 'DOC002', dayOfWeek: 0, isAvailable: false, startTime: '00:00', endTime: '00:00' },

    // Dr. Emily Brown (Dermatology) - DOC003
    { doctorId: 'DOC003', dayOfWeek: 1, isAvailable: true, startTime: '10:00', endTime: '18:00' },
    { doctorId: 'DOC003', dayOfWeek: 2, isAvailable: true, startTime: '10:00', endTime: '18:00' },
    { doctorId: 'DOC003', dayOfWeek: 3, isAvailable: true, startTime: '10:00', endTime: '18:00' },
    { doctorId: 'DOC003', dayOfWeek: 4, isAvailable: false, startTime: '00:00', endTime: '00:00' },
    { doctorId: 'DOC003', dayOfWeek: 5, isAvailable: true, startTime: '10:00', endTime: '18:00' },
    { doctorId: 'DOC003', dayOfWeek: 6, isAvailable: true, startTime: '10:00', endTime: '14:00' },
    { doctorId: 'DOC003', dayOfWeek: 0, isAvailable: false, startTime: '00:00', endTime: '00:00' },

    // Dr. David Wilson (Orthopedics) - DOC004
    { doctorId: 'DOC004', dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC004', dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '13:00' },
    { doctorId: 'DOC004', dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC004', dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '13:00' },
    { doctorId: 'DOC004', dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { doctorId: 'DOC004', dayOfWeek: 6, isAvailable: false, startTime: '00:00', endTime: '00:00' },
    { doctorId: 'DOC004', dayOfWeek: 0, isAvailable: false, startTime: '00:00', endTime: '00:00' },

    // Dr. Jessica Martinez (Pediatrics) - DOC005
    { doctorId: 'DOC005', dayOfWeek: 1, isAvailable: true, startTime: '08:00', endTime: '15:00' },
    { doctorId: 'DOC005', dayOfWeek: 2, isAvailable: true, startTime: '08:00', endTime: '15:00' },
    { doctorId: 'DOC005', dayOfWeek: 3, isAvailable: true, startTime: '08:00', endTime: '15:00' },
    { doctorId: 'DOC005', dayOfWeek: 4, isAvailable: true, startTime: '08:00', endTime: '15:00' },
    { doctorId: 'DOC005', dayOfWeek: 5, isAvailable: true, startTime: '08:00', endTime: '15:00' },
    { doctorId: 'DOC005', dayOfWeek: 6, isAvailable: true, startTime: '09:00', endTime: '12:00' },
    { doctorId: 'DOC005', dayOfWeek: 0, isAvailable: false, startTime: '00:00', endTime: '00:00' },

    // Dr. Robert Taylor (Neurology) - DOC006
    { doctorId: 'DOC006', dayOfWeek: 1, isAvailable: true, startTime: '10:00', endTime: '16:00' },
    { doctorId: 'DOC006', dayOfWeek: 2, isAvailable: true, startTime: '10:00', endTime: '16:00' },
    { doctorId: 'DOC006', dayOfWeek: 3, isAvailable: true, startTime: '10:00', endTime: '16:00' },
    { doctorId: 'DOC006', dayOfWeek: 4, isAvailable: true, startTime: '10:00', endTime: '16:00' },
    { doctorId: 'DOC006', dayOfWeek: 5, isAvailable: true, startTime: '10:00', endTime: '14:00' },
    { doctorId: 'DOC006', dayOfWeek: 6, isAvailable: false, startTime: '00:00', endTime: '00:00' },
    { doctorId: 'DOC006', dayOfWeek: 0, isAvailable: false, startTime: '00:00', endTime: '00:00' },
  ];

  for (const scheduleData of schedules) {
    await prisma.doctorWeeklySchedule.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: scheduleData.doctorId,
          dayOfWeek: scheduleData.dayOfWeek,
        },
      },
      update: {},
      create: scheduleData,
    });
  }

  console.log(`✅ Seeded ${schedules.length} doctor schedules`);
}
