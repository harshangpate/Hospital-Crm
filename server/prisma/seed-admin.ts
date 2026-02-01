import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin users...\n');

  try {
    // Hash password for both admins
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@hospital.com' },
      update: {},
      create: {
        email: 'superadmin@hospital.com',
        username: 'superadmin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1234567890',
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@hospital.com' },
      update: {},
      create: {
        email: 'admin@hospital.com',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567891',
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log('✅ Admin created:', admin.email);

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: superadmin@hospital.com');
    console.log('  Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@hospital.com');
    console.log('  Password: admin123');
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
