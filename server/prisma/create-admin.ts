import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔧 Creating admin user...\n');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@hospital.com'
    }
  });

  if (existingAdmin) {
    console.log('ℹ️  Admin user already exists with email: admin@hospital.com');
    console.log('📧 Email: admin@hospital.com');
    console.log('🔑 Password: Admin@123\n');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      isActive: true,
      isEmailVerified: true
    }
  });

  console.log('✅ Admin user created successfully!\n');
  console.log('═══════════════════════════════════════');
  console.log('📧 Email: admin@hospital.com');
  console.log('🔑 Password: Admin@123');
  console.log('👤 Role: ADMIN');
  console.log('═══════════════════════════════════════\n');
}

createAdmin()
  .catch((error) => {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
