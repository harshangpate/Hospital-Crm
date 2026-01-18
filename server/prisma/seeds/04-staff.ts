import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedStaff() {
  console.log('🌱 Seeding Staff...');

  const staff = [
    // Nurses
    {
      id: 'staff-nurse-001',
      userId: 'user-nurse-001',
      staffId: 'NURSE001',
      department: 'General Ward',
      designation: 'Staff Nurse',
      joiningDate: new Date('2020-03-15'),
    },
    {
      id: 'staff-nurse-002',
      userId: 'user-nurse-002',
      staffId: 'NURSE002',
      department: 'ICU',
      designation: 'Critical Care Nurse',
      joiningDate: new Date('2019-08-20'),
    },
    // Receptionists
    {
      id: 'staff-receptionist-001',
      userId: 'user-receptionist-001',
      staffId: 'REC001',
      department: 'Front Desk',
      designation: 'Senior Receptionist',
      joiningDate: new Date('2021-01-10'),
    },
    {
      id: 'staff-receptionist-002',
      userId: 'user-receptionist-002',
      staffId: 'REC002',
      department: 'Appointment Desk',
      designation: 'Receptionist',
      joiningDate: new Date('2022-06-15'),
    },
    // Pharmacists
    {
      id: 'staff-pharmacist-001',
      userId: 'user-pharmacist-001',
      staffId: 'PHAR001',
      department: 'Pharmacy',
      designation: 'Chief Pharmacist',
      joiningDate: new Date('2018-04-01'),
    },
    {
      id: 'staff-pharmacist-002',
      userId: 'user-pharmacist-002',
      staffId: 'PHAR002',
      department: 'Pharmacy',
      designation: 'Staff Pharmacist',
      joiningDate: new Date('2020-09-12'),
    },
    // Lab Technicians
    {
      id: 'staff-lab-001',
      userId: 'user-lab-001',
      staffId: 'LAB001',
      department: 'Laboratory',
      designation: 'Senior Lab Technician',
      joiningDate: new Date('2019-02-25'),
    },
    {
      id: 'staff-lab-002',
      userId: 'user-lab-002',
      staffId: 'LAB002',
      department: 'Laboratory',
      designation: 'Lab Technician',
      joiningDate: new Date('2021-11-08'),
    },
    // Radiologist
    {
      id: 'staff-radiologist-001',
      userId: 'user-radiologist-001',
      staffId: 'RAD001',
      department: 'Radiology',
      designation: 'Consultant Radiologist',
      joiningDate: new Date('2017-07-01'),
    },
    // Accountant
    {
      id: 'staff-accountant-001',
      userId: 'user-accountant-001',
      staffId: 'ACC001',
      department: 'Finance',
      designation: 'Senior Accountant',
      joiningDate: new Date('2018-11-20'),
    },
  ];

  for (const staffData of staff) {
    await prisma.staff.upsert({
      where: { staffId: staffData.staffId },
      update: {},
      create: staffData,
    });
  }

  console.log(`✅ Seeded ${staff.length} staff members`);
}
