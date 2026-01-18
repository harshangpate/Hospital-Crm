import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/01-users';
import { seedPatients } from './seeds/02-patients';
import { seedDoctors } from './seeds/03-doctors';
import { seedStaff } from './seeds/04-staff';
import { seedDoctorSchedules } from './seeds/05-doctor-schedules';
import { seedAppointments } from './seeds/06-appointments';
import { seedAllergies } from './seeds/07-allergies';
import { seedMedicalHistory } from './seeds/08-medical-history';
import { seedMedications } from './seeds/09-medications';
import { seedMedicineInventory } from './seeds/10-medicine-inventory';
import { seedWards } from './seeds/11-wards';
import { seedBeds } from './seeds/12-beds';
import { seedAdmissions } from './seeds/13-admissions';
import { seedSettings } from './seeds/14-settings';
import { seedNotifications } from './seeds/15-notifications';
import { seedAuditLogs } from './seeds/16-audit-logs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Core System Data
    await seedUsers();
    await seedPatients();
    await seedDoctors();
    await seedStaff();

    // Doctor Availability
    await seedDoctorSchedules();

    // Appointments
    await seedAppointments();

    // Patient Medical Information
    await seedAllergies();
    await seedMedicalHistory();

    // Pharmacy
    await seedMedications();
    await seedMedicineInventory();

    // IPD (In-Patient Department)
    await seedWards();
    await seedBeds();
    await seedAdmissions();

    // System Settings
    await seedSettings();
    await seedNotifications();
    await seedAuditLogs();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  • Users: Seeded');
    console.log('  • Patients: Seeded');
    console.log('  • Doctors: Seeded');
    console.log('  • Staff: Seeded');
    console.log('  • Doctor Schedules: Seeded');
    console.log('  • Appointments: Seeded');
    console.log('  • Allergies: Seeded');
    console.log('  • Medical History: Seeded');
    console.log('  • Medications: Seeded');
    console.log('  • Medicine Inventory: Seeded');
    console.log('  • Wards & Beds: Seeded');
    console.log('  • Admissions: Seeded');
    console.log('  • Settings: Seeded');
    console.log('  • Notifications: Seeded');
    console.log('  • Audit Logs: Seeded');
    console.log('\n🎉 You can now login with the following credentials:');
    console.log('  📧 Super Admin: superadmin@hospital.com');
    console.log('  🔑 Password: SuperAdmin@123');
    console.log('\n  📧 Doctor: sarah.johnson@hospital.com');
    console.log('  🔑 Password: Doctor@123');
    console.log('\n  📧 Patient: john.doe@email.com');
    console.log('  🔑 Password: Patient@123');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
