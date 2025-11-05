import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create Admin
  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hospital.com',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        phone: '1234567890',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log('✅ Created Admin user');
  } catch (error: any) {
    console.log('ℹ️  Admin already exists');
  }

  // Create Patient
  try {
    const patient = await prisma.user.create({
      data: {
        email: 'patient@test.com',
        username: 'patient',
        password: hashedPassword,
        role: 'PATIENT',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        isActive: true,
        isEmailVerified: true,
        patient: {
          create: {
            patientId: 'PT-2025-0001',
          },
        },
      },
    });
    console.log('✅ Created Patient user');
  } catch (error: any) {
    console.log('ℹ️  Patient already exists');
  }

  // Create Lab Technician
  try {
    const labTech = await prisma.user.create({
      data: {
        email: 'lab@hospital.com',
        username: 'lab',
        password: hashedPassword,
        role: 'LAB_TECHNICIAN',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '5559876543',
        isActive: true,
        isEmailVerified: true,
        staff: {
          create: {
            staffId: 'STAFF-2025-0001',
            department: 'Laboratory',
            designation: 'Lab Technician',
            joiningDate: new Date(),
          },
        },
      },
    });
    console.log('✅ Created Lab Technician user');
  } catch (error: any) {
    console.log('ℹ️  Lab Technician already exists');
  }

  // Create Pharmacist
  try {
    const pharmacist = await prisma.user.create({
      data: {
        email: 'pharmacist@hospital.com',
        username: 'pharmacist',
        password: hashedPassword,
        role: 'PHARMACIST',
        firstName: 'Emily',
        lastName: 'Brown',
        phone: '5551112222',
        isActive: true,
        isEmailVerified: true,
        staff: {
          create: {
            staffId: 'STAFF-2025-0002',
            department: 'Pharmacy',
            designation: 'Pharmacist',
            joiningDate: new Date(),
          },
        },
      },
    });
    console.log('✅ Created Pharmacist user');
  } catch (error: any) {
    console.log('ℹ️  Pharmacist already exists');
  }

  // Create Nurse
  try {
    const nurse = await prisma.user.create({
      data: {
        email: 'nurse@hospital.com',
        username: 'nurse',
        password: hashedPassword,
        role: 'NURSE',
        firstName: 'Lisa',
        lastName: 'Wilson',
        phone: '5553334444',
        isActive: true,
        isEmailVerified: true,
        staff: {
          create: {
            staffId: 'STAFF-2025-0003',
            department: 'Nursing',
            designation: 'Senior Nurse',
            joiningDate: new Date(),
          },
        },
      },
    });
    console.log('✅ Created Nurse user');
  } catch (error: any) {
    console.log('ℹ️  Nurse already exists');
  }

  // Create Receptionist
  try {
    const receptionist = await prisma.user.create({
      data: {
        email: 'receptionist@hospital.com',
        username: 'receptionist',
        password: hashedPassword,
        role: 'RECEPTIONIST',
        firstName: 'Anna',
        lastName: 'Davis',
        phone: '5555556666',
        isActive: true,
        isEmailVerified: true,
        staff: {
          create: {
            staffId: 'STAFF-2025-0004',
            department: 'Front Desk',
            designation: 'Receptionist',
            joiningDate: new Date(),
          },
        },
      },
    });
    console.log('✅ Created Receptionist user');
  } catch (error: any) {
    console.log('ℹ️  Receptionist already exists');
  }

  // Seed Doctors with different specializations
  const doctors = [
    {
      email: 'sarah.johnson@hospital.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      specialization: 'Cardiology',
      qualifications: 'MD, FACC',
      licenseNumber: 'DOC-2020-001',
    },
    {
      email: 'michael.chen@hospital.com',
      firstName: 'Michael',
      lastName: 'Chen',
      specialization: 'General Medicine',
      qualifications: 'MBBS, MD',
      licenseNumber: 'DOC-2019-045',
    },
  ];

  for (const doctorData of doctors) {
    try {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: doctorData.email,
          username: doctorData.email.split('@')[0],
          password: hashedPassword,
          role: 'DOCTOR',
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: `+1-555-${Math.floor(Math.random() * 9000 + 1000)}`,
          gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
          isActive: true,
          isEmailVerified: true,
        },
      });

      // Generate doctor ID
      const doctorCount = await prisma.doctor.count();
      const doctorId = `DOC-${new Date().getFullYear()}-${String(doctorCount + 1).padStart(4, '0')}`;

      // Create doctor record
      await prisma.doctor.create({
        data: {
          userId: user.id,
          doctorId: doctorId,
          specialization: doctorData.specialization,
          qualification: doctorData.qualifications,
          licenseNumber: doctorData.licenseNumber,
          experience: Math.floor(Math.random() * 15) + 5,
          consultationFee: Math.floor(Math.random() * 300) + 200,
        },
      });

      console.log(`✅ Created doctor: Dr. ${doctorData.firstName} ${doctorData.lastName} (${doctorData.specialization})`);
    } catch (error: any) {
      console.log(`ℹ️  Doctor ${doctorData.email} already exists`);
    }
  }

  // Seed medications and pharmacy inventory
  const medicationsData = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      brandName: 'Tylenol',
      manufacturer: 'MedPharm Inc.',
      medicationForm: 'TABLET',
      strength: '500mg',
      category: 'Analgesic',
      drugClass: 'Pain Reliever',
      unitPrice: 2.50,
      batchNumber: 'PARA-2025-001',
      expiryDate: new Date('2025-12-31'),
      quantity: 500,
      reorderLevel: 100,
      unitCost: 2.00,
      sellingPrice: 2.50,
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      manufacturer: 'BioPharma Ltd.',
      medicationForm: 'CAPSULE',
      strength: '250mg',
      category: 'Antibiotic',
      drugClass: 'Penicillin',
      unitPrice: 15.00,
      batchNumber: 'AMOX-2025-002',
      expiryDate: new Date('2025-11-15'),
      quantity: 50,
      reorderLevel: 80,
      unitCost: 12.00,
      sellingPrice: 15.00,
    },
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      manufacturer: 'HealthCare Co.',
      medicationForm: 'TABLET',
      strength: '400mg',
      category: 'Analgesic',
      drugClass: 'NSAID',
      unitPrice: 5.00,
      batchNumber: 'IBU-2025-003',
      expiryDate: new Date('2026-06-30'),
      quantity: 300,
      reorderLevel: 150,
      unitCost: 4.00,
      sellingPrice: 5.00,
    },
    {
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      brandName: 'Prilosec',
      manufacturer: 'GastroPharma',
      medicationForm: 'CAPSULE',
      strength: '20mg',
      category: 'Antacid',
      drugClass: 'Proton Pump Inhibitor',
      unitPrice: 8.50,
      batchNumber: 'OMEP-2024-004',
      expiryDate: new Date('2025-11-20'),
      quantity: 80,
      reorderLevel: 100,
      unitCost: 7.00,
      sellingPrice: 8.50,
    },
    {
      name: 'Metformin',
      genericName: 'Metformin',
      brandName: 'Glucophage',
      manufacturer: 'DiabetesCare Ltd.',
      medicationForm: 'TABLET',
      strength: '500mg',
      category: 'Antidiabetic',
      drugClass: 'Biguanide',
      unitPrice: 3.00,
      batchNumber: 'MET-2025-005',
      expiryDate: new Date('2026-03-15'),
      quantity: 200,
      reorderLevel: 120,
      unitCost: 2.50,
      sellingPrice: 3.00,
    },
    {
      name: 'Atorvastatin',
      genericName: 'Atorvastatin',
      brandName: 'Lipitor',
      manufacturer: 'CardioPharma',
      medicationForm: 'TABLET',
      strength: '10mg',
      category: 'Cardiovascular',
      drugClass: 'Statin',
      unitPrice: 12.00,
      batchNumber: 'ATOR-2025-006',
      expiryDate: new Date('2025-12-05'),
      quantity: 15,
      reorderLevel: 50,
      unitCost: 10.00,
      sellingPrice: 12.00,
    },
    {
      name: 'Cetirizine',
      genericName: 'Cetirizine',
      brandName: 'Zyrtec',
      manufacturer: 'AllergyMed Inc.',
      medicationForm: 'TABLET',
      strength: '10mg',
      category: 'Antihistamine',
      drugClass: 'Antihistamine',
      unitPrice: 4.50,
      batchNumber: 'CET-2025-007',
      expiryDate: new Date('2026-08-20'),
      quantity: 250,
      reorderLevel: 100,
      unitCost: 3.50,
      sellingPrice: 4.50,
    },
    {
      name: 'Azithromycin',
      genericName: 'Azithromycin',
      brandName: 'Zithromax',
      manufacturer: 'BioPharma Ltd.',
      medicationForm: 'TABLET',
      strength: '500mg',
      category: 'Antibiotic',
      drugClass: 'Macrolide',
      unitPrice: 25.00,
      batchNumber: 'AZI-2025-008',
      expiryDate: new Date('2025-11-30'),
      quantity: 40,
      reorderLevel: 60,
      unitCost: 20.00,
      sellingPrice: 25.00,
    },
  ];

  for (const medData of medicationsData) {
    try {
      // Create medication
      const medication = await prisma.medication.create({
        data: {
          name: medData.name,
          genericName: medData.genericName,
          brandName: medData.brandName,
          manufacturer: medData.manufacturer,
          medicationForm: medData.medicationForm as any,
          strength: medData.strength,
          category: medData.category,
          drugClass: medData.drugClass,
          unitPrice: medData.unitPrice,
        },
      });

      // Create inventory for medication
      await prisma.medicineInventory.create({
        data: {
          medicationId: medication.id,
          batchNumber: medData.batchNumber,
          expiryDate: medData.expiryDate,
          quantity: medData.quantity,
          reorderLevel: medData.reorderLevel,
          unitCost: medData.unitCost,
          sellingPrice: medData.sellingPrice,
          supplierName: medData.manufacturer,
        },
      });

      console.log(`✅ Added medication & inventory: ${medData.name}`);
    } catch (error: any) {
      console.log(`ℹ️  Medication ${medData.name} already exists`);
    }
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Test Users Created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: admin@hospital.com       | Role: ADMIN');
  console.log('Email: patient@test.com         | Role: PATIENT');
  console.log('Email: sarah.johnson@hospital.com | Role: DOCTOR');
  console.log('Email: lab@hospital.com         | Role: LAB_TECHNICIAN');
  console.log('Email: pharmacist@hospital.com  | Role: PHARMACIST');
  console.log('Email: nurse@hospital.com       | Role: NURSE');
  console.log('Email: receptionist@hospital.com| Role: RECEPTIONIST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Password for all: Password123!');
  console.log('\n📦 Pharmacy Inventory: 8 medicines added');
  
  // Seed Wards and Beds
  const wardsData = [
    {
      wardNumber: 'W-101',
      wardName: 'General Ward A',
      wardType: 'General',
      floor: 1,
      capacity: 10,
      chargesPerDay: 500,
      facilities: JSON.stringify(['24/7 Nursing', 'TV', 'WiFi']),
    },
    {
      wardNumber: 'W-201',
      wardName: 'ICU Ward',
      wardType: 'ICU',
      floor: 2,
      capacity: 6,
      chargesPerDay: 2000,
      facilities: JSON.stringify(['Ventilator', 'Cardiac Monitor', '24/7 Doctor']),
    },
    {
      wardNumber: 'W-301',
      wardName: 'Private Ward',
      wardType: 'Private',
      floor: 3,
      capacity: 8,
      chargesPerDay: 1500,
      facilities: JSON.stringify(['AC', 'TV', 'WiFi', 'Attached Bathroom', 'Refrigerator']),
    },
  ];

  for (const wardData of wardsData) {
    try {
      const ward = await prisma.ward.create({
        data: wardData,
      });

      // Create beds for this ward
      const bedTypes = ward.wardType === 'ICU' ? ['ICU'] : 
                      ward.wardType === 'Private' ? ['Deluxe', 'VIP'] : 
                      ['Standard'];
      
      for (let i = 1; i <= ward.capacity; i++) {
        const bedType = bedTypes[i % bedTypes.length];
        await prisma.bed.create({
          data: {
            bedNumber: `${ward.wardNumber}-B${String(i).padStart(2, '0')}`,
            wardId: ward.id,
            bedType,
            status: 'AVAILABLE',
          },
        });
      }

      console.log(`✅ Created ward: ${ward.wardName} with ${ward.capacity} beds`);
    } catch (error: any) {
      console.log(`ℹ️  Ward ${wardData.wardNumber} already exists`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
