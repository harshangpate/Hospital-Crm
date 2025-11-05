import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDoctor() {
  try {
    const doctorId = 'ff2391f2-ef82-4a3f-ba9a-fd542a12dbbb';
    
    console.log('Checking doctor with ID:', doctorId);
    console.log('='.repeat(60));

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        weeklySchedules: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!doctor) {
      console.log('Doctor not found!');
      return;
    }

    console.log('\n👨‍⚕️ Doctor Information:');
    console.log(`Name: Dr. ${doctor.user.firstName} ${doctor.user.lastName}`);
    console.log(`Doctor ID: ${doctor.doctorId}`);
    console.log(`Specialization: ${doctor.specialization}`);
    console.log(`Is Available: ${doctor.isAvailable}`);
    console.log(`Available From: ${doctor.availableFrom || 'NOT SET'}`);
    console.log(`Available To: ${doctor.availableTo || 'NOT SET'}`);

    console.log('\n📅 Weekly Schedule:');
    if (doctor.weeklySchedules.length === 0) {
      console.log('❌ No weekly schedule set!');
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      doctor.weeklySchedules.forEach((schedule) => {
        console.log(
          `${dayNames[schedule.dayOfWeek]}: ${
            schedule.isAvailable
              ? `${schedule.startTime} - ${schedule.endTime}`
              : 'Day Off'
          }`
        );
      });
    }

    // Check for November 3, 2025 (Sunday = 0)
    const testDate = new Date('2025-11-03');
    const dayOfWeek = testDate.getDay();
    console.log(`\n🔍 For November 3, 2025 (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}):`);
    
    const scheduleForDay = doctor.weeklySchedules.find(s => s.dayOfWeek === dayOfWeek);
    if (scheduleForDay) {
      console.log(`Schedule exists: ${scheduleForDay.isAvailable ? `${scheduleForDay.startTime} - ${scheduleForDay.endTime}` : 'Day Off'}`);
    } else {
      console.log('No schedule for this day - will use general availability:');
      console.log(`${doctor.availableFrom || 'NOT SET'} - ${doctor.availableTo || 'NOT SET'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoctor();
