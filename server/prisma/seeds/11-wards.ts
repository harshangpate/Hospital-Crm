import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedWards() {
  console.log('🌱 Seeding Wards...');

  const wards = [
    {
      wardNumber: 'WARD-ICU-01',
      wardName: 'Intensive Care Unit',
      wardType: 'ICU',
      floor: 3,
      capacity: 10,
      occupiedBeds: 6,
      isActive: true,
      facilities: JSON.stringify(['Ventilators', 'Cardiac Monitors', 'Central Oxygen', 'Emergency Equipment']),
      chargesPerDay: 5000.00,
    },
    {
      wardNumber: 'WARD-GEN-01',
      wardName: 'General Ward - Male',
      wardType: 'General',
      floor: 1,
      capacity: 20,
      occupiedBeds: 12,
      isActive: true,
      facilities: JSON.stringify(['Basic Medical Equipment', 'Oxygen Supply', 'Nurse Station']),
      chargesPerDay: 1000.00,
    },
    {
      wardNumber: 'WARD-GEN-02',
      wardName: 'General Ward - Female',
      wardType: 'General',
      floor: 1,
      capacity: 20,
      occupiedBeds: 8,
      isActive: true,
      facilities: JSON.stringify(['Basic Medical Equipment', 'Oxygen Supply', 'Nurse Station']),
      chargesPerDay: 1000.00,
    },
    {
      wardNumber: 'WARD-PRIV-01',
      wardName: 'Private Ward',
      wardType: 'Private',
      floor: 2,
      capacity: 10,
      occupiedBeds: 7,
      isActive: true,
      facilities: JSON.stringify(['AC', 'Private Bathroom', 'TV', 'Refrigerator', 'Visitor Sofa']),
      chargesPerDay: 2500.00,
    },
    {
      wardNumber: 'WARD-SEMI-01',
      wardName: 'Semi-Private Ward',
      wardType: 'Semi-Private',
      floor: 2,
      capacity: 16,
      occupiedBeds: 10,
      isActive: true,
      facilities: JSON.stringify(['AC', 'Shared Bathroom', 'TV', 'Visitor Chair']),
      chargesPerDay: 1500.00,
    },
    {
      wardNumber: 'WARD-PED-01',
      wardName: 'Pediatric Ward',
      wardType: 'Pediatric',
      floor: 1,
      capacity: 12,
      occupiedBeds: 5,
      isActive: true,
      facilities: JSON.stringify(['Child-Friendly Environment', 'Play Area', 'Pediatric Equipment', 'Parent Stay Facility']),
      chargesPerDay: 1200.00,
    },
  ];

  for (const wardData of wards) {
    await prisma.ward.upsert({
      where: { wardNumber: wardData.wardNumber },
      update: {},
      create: wardData,
    });
  }

  console.log(`✅ Seeded ${wards.length} wards`);
}
