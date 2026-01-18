const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addHRManagerRole() {
  try {
    console.log('Adding HR_MANAGER to UserRole enum...');
    
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'HR_MANAGER' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'UserRole'
          )
        ) THEN
          ALTER TYPE "UserRole" ADD VALUE 'HR_MANAGER';
        END IF;
      END $$;
    `);
    
    console.log('✅ HR_MANAGER role added successfully!');
  } catch (error) {
    console.error('❌ Error adding HR_MANAGER role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addHRManagerRole();
