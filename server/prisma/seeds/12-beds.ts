import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBeds() {
  console.log('🌱 Seeding Beds...');

  const beds = [
    // ICU Beds
    ...Array.from({ length: 10 }, (_, i) => ({
      bedNumber: `ICU-BED-${String(i + 1).padStart(2, '0')}`,
      wardId: '', // Will be updated after fetching ward
      bedType: 'ICU',
      status: i < 6 ? 'OCCUPIED' : 'AVAILABLE',
      isActive: true,
    })),
    // General Ward Male Beds
    ...Array.from({ length: 20 }, (_, i) => ({
      bedNumber: `GEN-M-BED-${String(i + 1).padStart(2, '0')}`,
      wardId: '', // Will be updated after fetching ward
      bedType: 'Standard',
      status: i < 12 ? 'OCCUPIED' : 'AVAILABLE',
      isActive: true,
    })),
    // General Ward Female Beds
    ...Array.from({ length: 20 }, (_, i) => ({
      bedNumber: `GEN-F-BED-${String(i + 1).padStart(2, '0')}`,
      wardId: '', // Will be updated after fetching ward
      bedType: 'Standard',
      status: i < 8 ? 'OCCUPIED' : 'AVAILABLE',
      isActive: true,
    })),
    // Private Ward Beds
    ...Array.from({ length: 10 }, (_, i) => ({
      bedNumber: `PRIV-BED-${String(i + 1).padStart(2, '0')}`,
      wardId: '', // Will be updated after fetching ward
      bedType: 'Deluxe',
      status: i < 7 ? 'OCCUPIED' : 'AVAILABLE',
      isActive: true,
    })),
    // Semi-Private Ward Beds
    ...Array.from({ length: 16 }, (_, i) => ({
      bedNumber: `SEMI-BED-${String(i + 1).padStart(2, '0')}`,
      wardId: '', // Will be updated after fetching ward
      bedType: 'Standard',
      status: i < 10 ? 'OCCUPIED' : 'AVAILABLE',
      isActive: true,
    })),
    // Pediatric Ward Beds
    ...Array.from({ length: 12 }, (_, i) => ({
      bedNumber: `PED-BED-${String(i + 1).padStart(2, '0')}`,
      wardId: '', // Will be updated after fetching ward
      bedType: 'Standard',
      status: i < 5 ? 'OCCUPIED' : 'AVAILABLE',
      isActive: true,
    })),
  ];

  // Fetch wards to get IDs
  const icuWard = await prisma.ward.findUnique({ where: { wardNumber: 'WARD-ICU-01' } });
  const genMaleWard = await prisma.ward.findUnique({ where: { wardNumber: 'WARD-GEN-01' } });
  const genFemaleWard = await prisma.ward.findUnique({ where: { wardNumber: 'WARD-GEN-02' } });
  const privWard = await prisma.ward.findUnique({ where: { wardNumber: 'WARD-PRIV-01' } });
  const semiWard = await prisma.ward.findUnique({ where: { wardNumber: 'WARD-SEMI-01' } });
  const pedWard = await prisma.ward.findUnique({ where: { wardNumber: 'WARD-PED-01' } });

  // Update ward IDs
  beds.forEach((bed) => {
    if (bed.bedNumber.startsWith('ICU')) bed.wardId = icuWard?.id || '';
    else if (bed.bedNumber.startsWith('GEN-M')) bed.wardId = genMaleWard?.id || '';
    else if (bed.bedNumber.startsWith('GEN-F')) bed.wardId = genFemaleWard?.id || '';
    else if (bed.bedNumber.startsWith('PRIV')) bed.wardId = privWard?.id || '';
    else if (bed.bedNumber.startsWith('SEMI')) bed.wardId = semiWard?.id || '';
    else if (bed.bedNumber.startsWith('PED')) bed.wardId = pedWard?.id || '';
  });

  for (const bedData of beds) {
    if (bedData.wardId) {
      await prisma.bed.upsert({
        where: { bedNumber: bedData.bedNumber },
        update: {},
        create: bedData,
      });
    }
  }

  console.log(`✅ Seeded ${beds.length} beds`);
}
