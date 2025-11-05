const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n');
    
    const userCount = await prisma.user.count();
    console.log(`✓ Users: ${userCount}`);
    
    const doctorCount = await prisma.doctor.count();
    console.log(`✓ Doctors: ${doctorCount}`);
    
    const patientCount = await prisma.patient.count();
    console.log(`✓ Patients: ${patientCount}`);
    
    const appointmentCount = await prisma.appointment.count();
    console.log(`✓ Appointments: ${appointmentCount}`);
    
    const invoiceCount = await prisma.invoice.count();
    console.log(`✓ Invoices: ${invoiceCount}`);
    
    const wardCount = await prisma.ward.count();
    console.log(`✓ Wards: ${wardCount}`);
    
    const bedCount = await prisma.bed.count();
    console.log(`✓ Beds: ${bedCount}`);
    
    const admissionCount = await prisma.admission.count();
    console.log(`✓ Admissions: ${admissionCount}`);
    
    const medicationCount = await prisma.medication.count();
    console.log(`✓ Medications: ${medicationCount}`);
    
    const weeklyScheduleCount = await prisma.doctorWeeklySchedule.count();
    console.log(`✓ Weekly Schedules: ${weeklyScheduleCount}`);
    
    const blockedSlotCount = await prisma.doctorBlockedSlot.count();
    console.log(`✓ Blocked Slots: ${blockedSlotCount}`);
    
    console.log('\n✅ Database is working! All tables exist.');
    
    // Show ward details
    if (wardCount > 0) {
      console.log('\n🏥 Ward Details:');
      const wards = await prisma.ward.findMany({
        include: {
          _count: {
            select: { beds: true }
          }
        }
      });
      wards.forEach(ward => {
        console.log(`  - ${ward.wardName} (${ward.wardNumber}): ${ward._count.beds} beds, ${ward.occupiedBeds} occupied`);
      });
    }
    
    // Show sample users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      }
    });
    
    console.log('\nSample users:');
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - ${u.firstName} ${u.lastName}`);
    });
    
    // Show all doctors with their doctorIds
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
    
    console.log('\n📋 Available Doctors:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    doctors.forEach(d => {
      console.log(`\n✓ Dr. ${d.user.firstName} ${d.user.lastName}`);
      console.log(`  Email: ${d.user.email}`);
      console.log(`  UUID (id): ${d.id}`);
      console.log(`  Doctor ID: ${d.doctorId}`);
      console.log(`  Specialization: ${d.specialization}`);
      console.log(`  Available: ${d.isAvailable ? 'Yes' : 'No'}`);
      if (d.availableFrom && d.availableTo) {
        console.log(`  Hours: ${d.availableFrom} - ${d.availableTo}`);
      }
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
