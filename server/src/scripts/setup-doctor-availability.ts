import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDoctorAvailability() {
  try {
    console.log('Setting up doctor availability...');

    // Get all doctors
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        doctorId: true,
        availableFrom: true,
        availableTo: true,
        isAvailable: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`Found ${doctors.length} doctors`);

    // Update doctors without availability times
    for (const doctor of doctors) {
      if (!doctor.availableFrom || !doctor.availableTo) {
        console.log(
          `Setting default hours for Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
        );

        await prisma.doctor.update({
          where: { id: doctor.id },
          data: {
            availableFrom: '09:00',
            availableTo: '17:00',
            isAvailable: true,
          },
        });

        // Create weekly schedule for Monday to Friday
        const weekDays = [1, 2, 3, 4, 5]; // Monday to Friday
        for (const dayOfWeek of weekDays) {
          // Check if schedule already exists
          const existing = await prisma.doctorWeeklySchedule.findUnique({
            where: {
              doctorId_dayOfWeek: {
                doctorId: doctor.doctorId,
                dayOfWeek,
              },
            },
          });

          if (!existing) {
            await prisma.doctorWeeklySchedule.create({
              data: {
                doctorId: doctor.doctorId,
                dayOfWeek,
                isAvailable: true,
                startTime: '09:00',
                endTime: '17:00',
              },
            });
            console.log(
              `  - Created schedule for day ${dayOfWeek} (Mon-Fri)`
            );
          }
        }

        // Set Saturday as half day
        const saturdayExists = await prisma.doctorWeeklySchedule.findUnique({
          where: {
            doctorId_dayOfWeek: {
              doctorId: doctor.doctorId,
              dayOfWeek: 6,
            },
          },
        });

        if (!saturdayExists) {
          await prisma.doctorWeeklySchedule.create({
            data: {
              doctorId: doctor.doctorId,
              dayOfWeek: 6,
              isAvailable: true,
              startTime: '09:00',
              endTime: '13:00',
            },
          });
          console.log(`  - Created schedule for Saturday (half day)`);
        }

        // Set Sunday as off
        const sundayExists = await prisma.doctorWeeklySchedule.findUnique({
          where: {
            doctorId_dayOfWeek: {
              doctorId: doctor.doctorId,
              dayOfWeek: 0,
            },
          },
        });

        if (!sundayExists) {
          await prisma.doctorWeeklySchedule.create({
            data: {
              doctorId: doctor.doctorId,
              dayOfWeek: 0,
              isAvailable: false,
              startTime: '00:00',
              endTime: '00:00',
            },
          });
          console.log(`  - Set Sunday as day off`);
        }
      } else {
        console.log(
          `Dr. ${doctor.user.firstName} ${doctor.user.lastName} already has availability set`
        );
      }
    }

    console.log('\n✅ Doctor availability setup complete!');
    console.log('All doctors now have:');
    console.log('  - Monday-Friday: 9:00 AM - 5:00 PM');
    console.log('  - Saturday: 9:00 AM - 1:00 PM');
    console.log('  - Sunday: Off');
  } catch (error) {
    console.error('Error setting up doctor availability:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDoctorAvailability();
