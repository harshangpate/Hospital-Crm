import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding Emergency Staff user...\n');

  try {
    const hashedPassword = await bcrypt.hash('emergency123', 10);

    // Create Emergency Staff
    const emergencyStaff = await prisma.user.upsert({
      where: { email: 'emergency@hospital.com' },
      update: {},
      create: {
        email: 'emergency@hospital.com',
        username: 'emergencystaff',
        password: hashedPassword,
        role: 'EMERGENCY_STAFF',
        firstName: 'Emergency',
        lastName: 'Staff',
        phone: '+1234567892',
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log('✅ Emergency Staff created:', emergencyStaff.email);

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📋 Emergency Staff Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Emergency Staff:');
    console.log('  Email: emergency@hospital.com');
    console.log('  Password: emergency123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
