import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearMedications() {
  console.log('🗑️  Clearing medications...');

  try {
    // Delete drug interactions first (foreign key constraint)
    const deletedInteractions = await prisma.drugInteraction.deleteMany({});
    console.log(`✅ Deleted ${deletedInteractions.count} drug interactions`);

    // Delete medications
    const deletedMedications = await prisma.medication.deleteMany({});
    console.log(`✅ Deleted ${deletedMedications.count} medications`);

    console.log('\n✨ Cleanup completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearMedications();
