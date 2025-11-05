import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔧 Creating super admin user...\n');

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      email: 'superadmin@hospital.com'
    }
  });

  if (existingSuperAdmin) {
    console.log('ℹ️  Super Admin user already exists with email: superadmin@hospital.com');
    console.log('📧 Email: superadmin@hospital.com');
    console.log('🔑 Password: SuperAdmin@123\n');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

  // Create super admin user
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@hospital.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Administrator',
      phone: '+1234567891',
      isActive: true,
      isEmailVerified: true
    }
  });

  console.log('✅ Super Admin user created successfully!\n');
  console.log('═══════════════════════════════════════');
  console.log('📧 Email: superadmin@hospital.com');
  console.log('🔑 Password: SuperAdmin@123');
  console.log('👤 Role: SUPER_ADMIN');
  console.log('═══════════════════════════════════════\n');
}

createSuperAdmin()
  .catch((error) => {
    console.error('❌ Error creating super admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
