import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper functions
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

async function main() {
  console.log('🌱 Starting COMPREHENSIVE database seed...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This will populate your entire hospital system!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // ============================================================
  // SECTION 1: ADMIN & SUPER ADMIN
  // ============================================================
  console.log('📋 SECTION 1: Creating Admin Users...\n');

  let superAdmin, admin;
  try {
    superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@hospital.com',
        username: 'superadmin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1-555-0001',
        gender: 'MALE',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log('✅ Created Super Admin');
  } catch (error) {
    console.log('ℹ️  Super Admin already exists');
    superAdmin = await prisma.user.findUnique({ where: { email: 'superadmin@hospital.com' } });
  }

  try {
    admin = await prisma.user.create({
      data: {
        email: 'admin@hospital.com',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'Manager',
        phone: '+1-555-0002',
        gender: 'FEMALE',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log('✅ Created Admin');
  } catch (error) {
    console.log('ℹ️  Admin already exists');
    admin = await prisma.user.findUnique({ where: { email: 'admin@hospital.com' } });
  }

  // ============================================================
  // SECTION 2: DOCTORS (15 doctors with different specializations)
  // ============================================================
  console.log('\n👨‍⚕️ SECTION 2: Creating Doctors...\n');

  const doctorsData = [
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@hospital.com', specialization: 'Cardiology', qualification: 'MD, FACC', experience: 15, fee: 500 },
    { firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@hospital.com', specialization: 'General Medicine', qualification: 'MBBS, MD', experience: 10, fee: 300 },
    { firstName: 'David', lastName: 'Rodriguez', email: 'david.rodriguez@hospital.com', specialization: 'Orthopedics', qualification: 'MS Ortho, FRCS', experience: 12, fee: 450 },
    { firstName: 'Jennifer', lastName: 'Williams', email: 'jennifer.williams@hospital.com', specialization: 'Pediatrics', qualification: 'MD Pediatrics', experience: 8, fee: 350 },
    { firstName: 'Robert', lastName: 'Brown', email: 'robert.brown@hospital.com', specialization: 'Neurology', qualification: 'DM Neurology', experience: 18, fee: 600 },
    { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@hospital.com', specialization: 'Dermatology', qualification: 'MD Dermatology', experience: 7, fee: 400 },
    { firstName: 'James', lastName: 'Miller', email: 'james.miller@hospital.com', specialization: 'ENT', qualification: 'MS ENT', experience: 10, fee: 350 },
    { firstName: 'Patricia', lastName: 'Garcia', email: 'patricia.garcia@hospital.com', specialization: 'Gynecology', qualification: 'MD OB-GYN', experience: 14, fee: 450 },
    { firstName: 'Christopher', lastName: 'Martinez', email: 'christopher.martinez@hospital.com', specialization: 'General Surgery', qualification: 'MS General Surgery', experience: 16, fee: 550 },
    { firstName: 'Linda', lastName: 'Anderson', email: 'linda.anderson@hospital.com', specialization: 'Ophthalmology', qualification: 'MS Ophthalmology', experience: 11, fee: 400 },
    { firstName: 'Daniel', lastName: 'Thomas', email: 'daniel.thomas@hospital.com', specialization: 'Urology', qualification: 'MCh Urology', experience: 13, fee: 500 },
    { firstName: 'Barbara', lastName: 'Jackson', email: 'barbara.jackson@hospital.com', specialization: 'Psychiatry', qualification: 'MD Psychiatry', experience: 9, fee: 350 },
    { firstName: 'Matthew', lastName: 'White', email: 'matthew.white@hospital.com', specialization: 'Radiology', qualification: 'MD Radiology', experience: 10, fee: 300 },
    { firstName: 'Susan', lastName: 'Harris', email: 'susan.harris@hospital.com', specialization: 'Anesthesiology', qualification: 'MD Anesthesia', experience: 12, fee: 400 },
    { firstName: 'Joseph', lastName: 'Martin', email: 'joseph.martin@hospital.com', specialization: 'Pulmonology', qualification: 'DM Pulmonology', experience: 11, fee: 450 },
  ];

  const createdDoctors: any[] = [];
  for (let i = 0; i < doctorsData.length; i++) {
    const doc = doctorsData[i];
    try {
      const user = await prisma.user.create({
        data: {
          email: doc.email,
          username: doc.email.split('@')[0],
          password: hashedPassword,
          role: 'DOCTOR',
          firstName: doc.firstName,
          lastName: doc.lastName,
          phone: `+1-555-${1000 + i}`,
          gender: randomItem(['MALE', 'FEMALE']),
          isActive: true,
          isEmailVerified: true,
        },
      });

      const doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          doctorId: `DOC-2025-${String(i + 1).padStart(4, '0')}`,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experience: doc.experience,
          licenseNumber: `LIC-${2020 + i}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          consultationFee: doc.fee,
          isAvailable: true,
          department: doc.specialization,
        },
      });

      createdDoctors.push({ user, doctor });
      console.log(`✅ Created Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization})`);
    } catch (error) {
      console.log(`ℹ️  Dr. ${doc.email} already exists`);
      const existingUser = await prisma.user.findUnique({ where: { email: doc.email }, include: { doctor: true } });
      if (existingUser && existingUser.doctor) {
        createdDoctors.push({ user: existingUser, doctor: existingUser.doctor });
      }
    }
  }

  // ============================================================
  // SECTION 3: STAFF (Nurses, Lab Techs, Pharmacists, Receptionists)
  // ============================================================
  console.log('\n👥 SECTION 3: Creating Staff Members...\n');

  const staffData = [
    { email: 'nurse1@hospital.com', firstName: 'Lisa', lastName: 'Wilson', role: 'NURSE', dept: 'Nursing', designation: 'Senior Nurse' },
    { email: 'nurse2@hospital.com', firstName: 'Maria', lastName: 'Lopez', role: 'NURSE', dept: 'ICU', designation: 'ICU Nurse' },
    { email: 'nurse3@hospital.com', firstName: 'Karen', lastName: 'Taylor', role: 'NURSE', dept: 'Emergency', designation: 'ER Nurse' },
    { email: 'lab1@hospital.com', firstName: 'Mike', lastName: 'Johnson', role: 'LAB_TECHNICIAN', dept: 'Laboratory', designation: 'Senior Lab Technician' },
    { email: 'lab2@hospital.com', firstName: 'Tom', lastName: 'Moore', role: 'LAB_TECHNICIAN', dept: 'Laboratory', designation: 'Lab Technician' },
    { email: 'pharmacist1@hospital.com', firstName: 'Emily', lastName: 'Brown', role: 'PHARMACIST', dept: 'Pharmacy', designation: 'Chief Pharmacist' },
    { email: 'pharmacist2@hospital.com', firstName: 'John', lastName: 'Lee', role: 'PHARMACIST', dept: 'Pharmacy', designation: 'Pharmacist' },
    { email: 'receptionist1@hospital.com', firstName: 'Anna', lastName: 'Davis', role: 'RECEPTIONIST', dept: 'Front Desk', designation: 'Senior Receptionist' },
    { email: 'receptionist2@hospital.com', firstName: 'Jessica', lastName: 'Wilson', role: 'RECEPTIONIST', dept: 'Front Desk', designation: 'Receptionist' },
  ];

  const createdStaff: any[] = [];
  for (let i = 0; i < staffData.length; i++) {
    const staff = staffData[i];
    try {
      const user = await prisma.user.create({
        data: {
          email: staff.email,
          username: staff.email.split('@')[0],
          password: hashedPassword,
          role: staff.role as any,
          firstName: staff.firstName,
          lastName: staff.lastName,
          phone: `+1-555-${2000 + i}`,
          gender: randomItem(['MALE', 'FEMALE']),
          isActive: true,
          isEmailVerified: true,
          staff: {
            create: {
              staffId: `STAFF-2025-${String(i + 1).padStart(4, '0')}`,
              department: staff.dept,
              designation: staff.designation,
              joiningDate: randomDate(new Date('2020-01-01'), new Date('2024-01-01')),
            },
          },
        },
      });

      createdStaff.push(user);
      console.log(`✅ Created ${staff.role}: ${staff.firstName} ${staff.lastName}`);
    } catch (error) {
      console.log(`ℹ️  ${staff.email} already exists`);
      const existingUser = await prisma.user.findUnique({ where: { email: staff.email } });
      if (existingUser) createdStaff.push(existingUser);
    }
  }

  // ============================================================
  // SECTION 4: PATIENTS (30 patients with varied demographics)
  // ============================================================
  console.log('\n🏥 SECTION 4: Creating Patients...\n');

  const firstNames = ['John', 'Jane', 'Robert', 'Mary', 'William', 'Patricia', 'James', 'Jennifer', 'Michael', 'Linda', 
                      'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
                      'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                     'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const createdPatients: any[] = [];
  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
    
    try {
      const user = await prisma.user.create({
        data: {
          email,
          username: `${firstName.toLowerCase()}${i}`,
          password: hashedPassword,
          role: 'PATIENT',
          firstName,
          lastName,
          phone: `+1-555-${3000 + i}`,
          gender: randomItem(['MALE', 'FEMALE']),
          dateOfBirth: randomDate(new Date('1950-01-01'), new Date('2010-01-01')),
          address: `${100 + i} Main St`,
          city: randomItem(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
          state: randomItem(['NY', 'CA', 'IL', 'TX', 'AZ']),
          country: 'USA',
          pincode: `${10000 + i}`,
          isActive: true,
          isEmailVerified: true,
          patient: {
            create: {
              patientId: `PT-2025-${String(i + 1).padStart(4, '0')}`,
              bloodGroup: randomItem(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']),
              emergencyContactPhone: `+1-555-${4000 + i}`,
              emergencyContactName: `Emergency Contact ${i}`,
              emergencyContactRelation: randomItem(['Spouse', 'Parent', 'Sibling', 'Friend']),
            },
          },
        },
      });

      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      createdPatients.push({ user, patient });
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1} patients...`);
      }
    } catch (error) {
      console.log(`ℹ️  Patient ${email} already exists`);
    }
  }
  console.log(`✅ Total patients created: ${createdPatients.length}`);

  // ============================================================
  // SECTION 5: MEDICATIONS & PHARMACY INVENTORY
  // ============================================================
  console.log('\n💊 SECTION 5: Creating Medications & Inventory...\n');

  const medicationsData = [
    { name: 'Paracetamol', generic: 'Acetaminophen', brand: 'Tylenol', form: 'TABLET', strength: '500mg', category: 'Analgesic', price: 2.50, qty: 500, reorder: 100 },
    { name: 'Ibuprofen', generic: 'Ibuprofen', brand: 'Advil', form: 'TABLET', strength: '400mg', category: 'Analgesic', price: 5.00, qty: 300, reorder: 150 },
    { name: 'Amoxicillin', generic: 'Amoxicillin', brand: 'Amoxil', form: 'CAPSULE', strength: '250mg', category: 'Antibiotic', price: 15.00, qty: 200, reorder: 80 },
    { name: 'Azithromycin', generic: 'Azithromycin', brand: 'Zithromax', form: 'TABLET', strength: '500mg', category: 'Antibiotic', price: 25.00, qty: 150, reorder: 60 },
    { name: 'Ciprofloxacin', generic: 'Ciprofloxacin', brand: 'Cipro', form: 'TABLET', strength: '500mg', category: 'Antibiotic', price: 20.00, qty: 100, reorder: 50 },
    { name: 'Omeprazole', generic: 'Omeprazole', brand: 'Prilosec', form: 'CAPSULE', strength: '20mg', category: 'Antacid', price: 8.50, qty: 250, reorder: 100 },
    { name: 'Metformin', generic: 'Metformin', brand: 'Glucophage', form: 'TABLET', strength: '500mg', category: 'Antidiabetic', price: 3.00, qty: 400, reorder: 120 },
    { name: 'Atorvastatin', generic: 'Atorvastatin', brand: 'Lipitor', form: 'TABLET', strength: '10mg', category: 'Cardiovascular', price: 12.00, qty: 180, reorder: 50 },
    { name: 'Losartan', generic: 'Losartan', brand: 'Cozaar', form: 'TABLET', strength: '50mg', category: 'Antihypertensive', price: 10.00, qty: 200, reorder: 80 },
    { name: 'Amlodipine', generic: 'Amlodipine', brand: 'Norvasc', form: 'TABLET', strength: '5mg', category: 'Antihypertensive', price: 8.00, qty: 220, reorder: 100 },
    { name: 'Cetirizine', generic: 'Cetirizine', brand: 'Zyrtec', form: 'TABLET', strength: '10mg', category: 'Antihistamine', price: 4.50, qty: 300, reorder: 100 },
    { name: 'Montelukast', generic: 'Montelukast', brand: 'Singulair', form: 'TABLET', strength: '10mg', category: 'Asthma', price: 15.00, qty: 150, reorder: 60 },
    { name: 'Salbutamol', generic: 'Albuterol', brand: 'Ventolin', form: 'INHALER', strength: '100mcg', category: 'Bronchodilator', price: 30.00, qty: 80, reorder: 30 },
    { name: 'Prednisolone', generic: 'Prednisolone', brand: 'Orapred', form: 'TABLET', strength: '5mg', category: 'Corticosteroid', price: 6.00, qty: 200, reorder: 80 },
    { name: 'Diclofenac', generic: 'Diclofenac', brand: 'Voltaren', form: 'TABLET', strength: '50mg', category: 'NSAID', price: 7.00, qty: 250, reorder: 100 },
  ];

  const createdMedications: any[] = [];
  for (const med of medicationsData) {
    try {
      const medication = await prisma.medication.create({
        data: {
          name: med.name,
          genericName: med.generic,
          brandName: med.brand,
          manufacturer: `${med.brand} Pharmaceuticals`,
          medicationForm: med.form as any,
          strength: med.strength,
          category: med.category,
          drugClass: med.category,
          unitPrice: med.price,
        },
      });

      await prisma.medicineInventory.create({
        data: {
          medicationId: medication.id,
          batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
          expiryDate: randomDate(new Date('2025-06-01'), new Date('2026-12-31')),
          quantity: med.qty,
          reorderLevel: med.reorder,
          unitCost: med.price * 0.7,
          sellingPrice: med.price,
          supplierName: `${med.brand} Supplier`,
        },
      });

      createdMedications.push(medication);
      console.log(`✅ Added ${med.name} (Stock: ${med.qty})`);
    } catch (error) {
      console.log(`ℹ️  ${med.name} already exists`);
      const existing = await prisma.medication.findFirst({ where: { name: med.name } });
      if (existing) createdMedications.push(existing);
    }
  }

  // ============================================================
  // SECTION 6: WARDS & BEDS
  // ============================================================
  console.log('\n🏨 SECTION 6: Creating Wards & Beds...\n');

  const wardsData = [
    { wardNumber: 'W-101', wardName: 'General Ward A', wardType: 'General', floor: 1, capacity: 12, charges: 500 },
    { wardNumber: 'W-102', wardName: 'General Ward B', wardType: 'General', floor: 1, capacity: 12, charges: 500 },
    { wardNumber: 'W-201', wardName: 'ICU Ward', wardType: 'ICU', floor: 2, capacity: 8, charges: 2000 },
    { wardNumber: 'W-202', wardName: 'CCU Ward', wardType: 'ICU', floor: 2, capacity: 6, charges: 2500 },
    { wardNumber: 'W-301', wardName: 'Private Ward A', wardType: 'Private', floor: 3, capacity: 10, charges: 1500 },
    { wardNumber: 'W-302', wardName: 'Private Ward B', wardType: 'Private', floor: 3, capacity: 10, charges: 1500 },
    { wardNumber: 'W-401', wardName: 'VIP Ward', wardType: 'Semi-Private', floor: 4, capacity: 6, charges: 3000 },
  ];

  const createdBeds: any[] = [];
  for (const wardData of wardsData) {
    try {
      const ward = await prisma.ward.create({
        data: {
          wardNumber: wardData.wardNumber,
          wardName: wardData.wardName,
          wardType: wardData.wardType,
          floor: wardData.floor,
          capacity: wardData.capacity,
          chargesPerDay: wardData.charges,
          facilities: JSON.stringify(wardData.wardType === 'ICU' ? 
            ['Ventilator', 'Cardiac Monitor', '24/7 Doctor'] : 
            wardData.wardType === 'Private' ? 
            ['AC', 'TV', 'WiFi', 'Attached Bathroom'] : 
            ['24/7 Nursing', 'TV', 'WiFi']),
        },
      });

      for (let i = 1; i <= ward.capacity; i++) {
        const bed = await prisma.bed.create({
          data: {
            bedNumber: `${ward.wardNumber}-B${String(i).padStart(2, '0')}`,
            wardId: ward.id,
            bedType: wardData.wardType === 'ICU' ? 'ICU' : 
                    wardData.wardType === 'Private' ? randomItem(['Deluxe', 'VIP']) : 
                    'Standard',
            status: 'AVAILABLE',
          },
        });
        createdBeds.push(bed);
      }

      console.log(`✅ Created ${ward.wardName} with ${ward.capacity} beds`);
    } catch (error) {
      console.log(`ℹ️  Ward ${wardData.wardNumber} already exists`);
      const existingWard = await prisma.ward.findFirst({ where: { wardNumber: wardData.wardNumber } });
      if (existingWard) {
        const beds = await prisma.bed.findMany({ where: { wardId: existingWard.id } });
        createdBeds.push(...beds);
      }
    }
  }

  // ============================================================
  // SECTION 7: LAB TEST CATALOG
  // ============================================================
  console.log('\n🔬 SECTION 7: Creating Lab Test Catalog...\n');

  const labTestsData = [
    { code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', price: 300, duration: 4, fields: ['Hemoglobin', 'WBC', 'RBC', 'Platelets', 'MCV', 'MCH', 'MCHC'] },
    { code: 'LFT', name: 'Liver Function Test', category: 'Biochemistry', price: 500, duration: 6, fields: ['Bilirubin', 'SGOT', 'SGPT', 'ALP', 'Total Protein', 'Albumin'] },
    { code: 'KFT', name: 'Kidney Function Test', category: 'Biochemistry', price: 450, duration: 6, fields: ['Creatinine', 'BUN', 'Uric Acid', 'Sodium', 'Potassium'] },
    { code: 'LIPID', name: 'Lipid Profile', category: 'Biochemistry', price: 600, duration: 8, fields: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'VLDL'] },
    { code: 'HBA1C', name: 'HbA1c (Diabetes)', category: 'Biochemistry', price: 400, duration: 6, fields: ['HbA1c'] },
    { code: 'TSH', name: 'Thyroid Profile', category: 'Endocrinology', price: 500, duration: 12, fields: ['TSH', 'T3', 'T4', 'Free T3', 'Free T4'] },
    { code: 'URINE', name: 'Urine Routine', category: 'Pathology', price: 200, duration: 2, fields: ['Color', 'pH', 'Protein', 'Glucose', 'RBC', 'WBC', 'Bacteria'] },
    { code: 'DENGUE', name: 'Dengue NS1 Antigen', category: 'Serology', price: 800, duration: 4, fields: ['NS1 Antigen', 'IgM', 'IgG'] },
    { code: 'COVID', name: 'COVID-19 RT-PCR', category: 'Molecular', price: 1200, duration: 24, fields: ['SARS-CoV-2'] },
    { code: 'VITAMIN', name: 'Vitamin D', category: 'Biochemistry', price: 1500, duration: 24, fields: ['25-OH Vitamin D'] },
  ];

  const createdTestCatalog: any[] = [];
  for (const test of labTestsData) {
    try {
      const catalog = await prisma.testCatalog.create({
        data: {
          testCode: test.code,
          testName: test.name,
          testCategory: test.category,
          price: test.price,
          sampleType: randomItem(['Blood', 'Urine', 'Serum']),
          turnAroundTime: `${test.duration} minutes`,
          normalRange: JSON.stringify({}),
        },
      });
      createdTestCatalog.push(catalog);
      console.log(`✅ Added ${test.name} (${test.code})`);
    } catch (error) {
      console.log(`ℹ️  ${test.name} already exists`);
      const existing = await prisma.testCatalog.findFirst({ where: { testCode: test.code } });
      if (existing) createdTestCatalog.push(existing);
    }
  }

  // ============================================================
  // SECTION 8: RADIOLOGY IMAGING CATALOG
  // ============================================================
  console.log('\n📷 SECTION 8: Creating Radiology Catalog...\n');

  const radiologyTestsData = [
    { code: 'XRAY-CHEST', name: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', price: 500, duration: 30 },
    { code: 'XRAY-ABD', name: 'Abdomen X-Ray', modality: 'X-Ray', bodyPart: 'Abdomen', price: 600, duration: 30 },
    { code: 'CT-HEAD', name: 'CT Scan Brain', modality: 'CT', bodyPart: 'Head', price: 3500, duration: 60 },
    { code: 'CT-ABD', name: 'CT Scan Abdomen', modality: 'CT', bodyPart: 'Abdomen', price: 4000, duration: 60 },
    { code: 'MRI-BRAIN', name: 'MRI Brain', modality: 'MRI', bodyPart: 'Brain', price: 6000, duration: 90 },
    { code: 'MRI-SPINE', name: 'MRI Spine', modality: 'MRI', bodyPart: 'Spine', price: 6500, duration: 90 },
    { code: 'USG-ABD', name: 'Ultrasound Abdomen', modality: 'Ultrasound', bodyPart: 'Abdomen', price: 1200, duration: 30 },
    { code: 'USG-PELVIS', name: 'Ultrasound Pelvis', modality: 'Ultrasound', bodyPart: 'Pelvis', price: 1500, duration: 30 },
    { code: 'ECHO', name: 'Echocardiography', modality: 'Ultrasound', bodyPart: 'Heart', price: 2500, duration: 45 },
    { code: 'MAMMOGRAM', name: 'Mammography', modality: 'X-Ray', bodyPart: 'Breast', price: 2000, duration: 45 },
  ];

  const createdRadiologyCatalog: any[] = [];
  for (const test of radiologyTestsData) {
    try {
      const catalog = await prisma.imagingCatalog.create({
        data: {
          testCode: test.code,
          testName: test.name,
          modality: test.modality,
          bodyPart: test.bodyPart,
          studyType: 'DIAGNOSTIC',
          basePrice: test.price,
          estimatedDuration: test.duration,
          preparation: test.modality === 'MRI' ? 'Remove all metal objects' : test.modality === 'CT' ? 'Fast for 4 hours' : 'No special preparation',
        },
      });
      createdRadiologyCatalog.push(catalog);
      console.log(`✅ Added ${test.name} (${test.code})`);
    } catch (error) {
      console.log(`ℹ️  ${test.name} already exists`);
      const existing = await prisma.imagingCatalog.findFirst({ where: { testCode: test.code } });
      if (existing) createdRadiologyCatalog.push(existing);
    }
  }

  // ============================================================
  // SECTION 9: OPERATION THEATERS
  // ============================================================
  console.log('\n🏥 SECTION 9: Creating Operation Theaters...\n');

  const otData = [
    { otNumber: 'OT-1', otName: 'Main OT 1', otType: 'MAJOR', floor: 2, equipment: ['Anesthesia Machine', 'Ventilator', 'Monitor', 'OT Table', 'Lights'] },
    { otNumber: 'OT-2', otName: 'Main OT 2', otType: 'MAJOR', floor: 2, equipment: ['Anesthesia Machine', 'Ventilator', 'Monitor', 'OT Table', 'Lights', 'C-Arm'] },
    { otNumber: 'OT-3', otName: 'Minor OT 1', otType: 'MINOR', floor: 1, equipment: ['Monitor', 'OT Table', 'Lights'] },
    { otNumber: 'OT-4', otName: 'Emergency OT', otType: 'EMERGENCY', floor: 1, equipment: ['Anesthesia Machine', 'Ventilator', 'Monitor', 'OT Table', 'Lights', 'Defibrillator'] },
  ];

  const createdOTs: any[] = [];
  for (const ot of otData) {
    try {
      const operationTheater = await prisma.operationTheater.create({
        data: {
          otNumber: ot.otNumber,
          name: ot.otName,
          type: ot.otType as any,
          floor: ot.floor,
          status: 'AVAILABLE',
          equipment: ot.equipment,
        },
      });
      createdOTs.push(operationTheater);
      console.log(`✅ Created ${ot.otName}`);
    } catch (error) {
      console.log(`ℹ️  ${ot.otName} already exists`);
      const existing = await prisma.operationTheater.findFirst({ where: { otNumber: ot.otNumber } });
      if (existing) createdOTs.push(existing);
    }
  }

  // ============================================================
  // SECTION 10: APPOINTMENTS (50+ appointments with varied statuses)
  // ============================================================
  console.log('\n📅 SECTION 10: Creating Appointments...\n');

  const appointmentStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const appointmentTypes = ['NEW', 'FOLLOW_UP', 'EMERGENCY'];
  
  for (let i = 0; i < 50; i++) {
    if (createdPatients.length === 0 || createdDoctors.length === 0) break;
    
    const patient = randomItem(createdPatients);
    const doctor = randomItem(createdDoctors);
    const appointmentDate = randomDate(new Date('2024-11-01'), new Date('2025-12-31'));
    const status = randomItem(appointmentStatuses);
    
    try {
      await prisma.appointment.create({
        data: {
          appointmentNumber: `APT-2025-${String(i + 1).padStart(5, '0')}`,
          patientId: patient.patient.id,
          doctorId: doctor.doctor.id,
          bookedBy: patient.user.id,
          appointmentDate: appointmentDate,
          appointmentTime: `${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${randomItem(['00', '30'])}`,
          type: randomItem(appointmentTypes) as any,
          status: status as any,
          reason: randomItem([
            'Fever and cough',
            'Chest pain',
            'Headache',
            'Abdominal pain',
            'Back pain',
            'Skin rash',
            'Routine checkup',
            'Follow-up consultation'
          ]),
          notes: status === 'COMPLETED' ? 'Consultation completed successfully' : null,
        },
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1} appointments...`);
      }
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 11: MEDICAL RECORDS with DIAGNOSES
  // ============================================================
  console.log('\n📋 SECTION 11: Creating Medical Records...\n');

  const diagnoses = [
    'Hypertension (HTN)',
    'Type 2 Diabetes Mellitus',
    'Upper Respiratory Tract Infection (URTI)',
    'Gastroesophageal Reflux Disease (GERD)',
    'Osteoarthritis',
    'Migraine',
    'Allergic Rhinitis',
    'Asthma',
    'Depression',
    'Chronic Back Pain'
  ];

  for (let i = 0; i < 20; i++) {
    if (createdPatients.length === 0 || createdDoctors.length === 0) break;
    
    const patient = randomItem(createdPatients);
    const doctor = randomItem(createdDoctors);
    
    try {
      const medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId: patient.patient.id,
          doctorId: doctor.doctor.id,
          recordType: randomItem(['OPD', 'IPD', 'EMERGENCY']) as any,
          chiefComplaint: randomItem([
            'Fever for 3 days',
            'Chest discomfort',
            'Persistent cough',
            'Joint pain',
            'Difficulty breathing',
            'Stomach upset'
          ]),
          presentIllness: 'Detailed history of present illness',
          examination: JSON.stringify({
            generalAppearance: 'Well nourished',
            vitals: {
              bloodPressure: `${120 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 30)}`,
              pulse: 72 + Math.floor(Math.random() * 28),
              temperature: 97 + Math.random() * 2,
              respiratoryRate: 14 + Math.floor(Math.random() * 8),
            }
          }),
          treatment: 'Prescribed medications and advised follow-up',
          diagnosis: randomItem(diagnoses),
        },
      });

      // Add diagnosis
      await prisma.diagnosis.create({
        data: {
          medicalRecordId: medicalRecord.id,
          icdCode: `ICD-${Math.floor(Math.random() * 100)}`,
          diagnosisName: randomItem(diagnoses),
          diagnosisType: randomItem(['PRIMARY', 'SECONDARY']) as any,
          status: 'ACTIVE',
          severity: randomItem(['MILD', 'MODERATE', 'SEVERE']) as any,
          notes: 'Clinical diagnosis based on examination',
        },
      });

      if ((i + 1) % 5 === 0) {
        console.log(`✅ Created ${i + 1} medical records...`);
      }
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 12: PRESCRIPTIONS with ITEMS
  // ============================================================
  console.log('\n💊 SECTION 12: Creating Prescriptions...\n');

  const completedAppointments = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    take: 15,
    include: { patient: true, doctor: true }
  });

  for (const appointment of completedAppointments) {
    try {
      const prescription = await prisma.prescription.create({
        data: {
          prescriptionNumber: `RX-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          diagnosis: 'Clinical diagnosis',
          notes: 'Take medications as prescribed',
          status: randomItem(['ISSUED', 'DISPENSED']) as any,
        },
      });

      // Add 2-4 prescription items
      const numItems = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numItems; i++) {
        if (createdMedications.length === 0) break;
        
        const medication = randomItem(createdMedications);
        await prisma.prescriptionItem.create({
          data: {
            prescriptionId: prescription.id,
            medicationId: medication.id,
            dosage: randomItem(['1', '2', '½']),
            frequency: randomItem(['Once daily', 'Twice daily', 'Thrice daily', 'Every 8 hours']),
            duration: `${randomItem(['3', '5', '7', '10', '14'])} days`,
            route: randomItem(['ORAL', 'INJECTION', 'TOPICAL']),
            instructions: randomItem(['Before meals', 'After meals', 'At bedtime', 'As needed']),
            quantity: 10 + Math.floor(Math.random() * 20),
          },
        });
      }

      console.log(`✅ Created prescription ${prescription.prescriptionNumber}`);
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 13: LAB TESTS with RESULTS
  // ============================================================
  console.log('\n🔬 SECTION 13: Creating Lab Tests...\n');

  for (let i = 0; i < 25; i++) {
    if (createdPatients.length === 0 || createdDoctors.length === 0 || createdTestCatalog.length === 0) break;
    
    const patient = randomItem(createdPatients);
    const doctor = randomItem(createdDoctors);
    const catalog = randomItem(createdTestCatalog);
    const status = randomItem(['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED']);
    
    try {
      const labTest = await prisma.labTest.create({
        data: {
          testNumber: `LAB-2025-${String(i + 1).padStart(5, '0')}`,
          patientId: patient.patient.id,
          doctorId: doctor.doctor.id,
          testCatalogId: catalog.id,
          testName: catalog.testName,
          testCategory: catalog.testCategory,
          orderedDate: randomDate(new Date('2024-11-01'), new Date()),
          status: status as any,
          cost: catalog.price,
          isPaid: status === 'COMPLETED' || status === 'PENDING_APPROVAL' ? randomBool(0.7) : false,
          sampleType: catalog.sampleType,
          collectionDate: status !== 'ORDERED' ? new Date() : null,
          resultDate: status === 'COMPLETED' || status === 'PENDING_APPROVAL' ? new Date() : null,
          results: status === 'COMPLETED' || status === 'PENDING_APPROVAL' ? JSON.stringify({
            values: { 'Test Parameter': 'Normal' }
          }) : null,
          interpretation: status === 'PENDING_APPROVAL' || status === 'COMPLETED' ? 'All parameters within normal limits' : null,
        },
      });

      if ((i + 1) % 5 === 0) {
        console.log(`✅ Created ${i + 1} lab tests...`);
      }
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 13B: CREATE LAB TEST INVOICES
  // ============================================================
  console.log('\n💰 Creating Lab Test Invoices...\n');
  
  // Get completed lab tests to create invoices
  const completedLabTests = await prisma.labTest.findMany({
    where: {
      status: {
        in: ['COMPLETED', 'PENDING_APPROVAL']
      },
      cost: {
        not: null
      }
    },
    include: {
      patient: true
    },
    take: 15
  });

  for (const test of completedLabTests) {
    try {
      // Check if invoice already exists for this lab test
      const existingInvoiceItem = await prisma.invoiceItem.findFirst({
        where: {
          itemName: test.testName,
          description: {
            contains: test.testNumber
          }
        }
      });

      if (existingInvoiceItem) continue;

      const invoiceNumber = `LAB-INV-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
      const subtotal = test.cost || 0;
      const tax = subtotal * 0.05;
      const total = subtotal + tax;
      const isPaid = randomBool(0.6);

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId: test.patientId,
          invoiceDate: test.resultDate || test.orderedDate,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          subtotal,
          tax,
          discount: 0,
          totalAmount: total,
          paidAmount: isPaid ? total : 0,
          balanceAmount: isPaid ? 0 : total,
          paymentStatus: isPaid ? 'PAID' : 'PENDING',
          paymentMethod: isPaid ? randomItem(['CASH', 'CARD', 'UPI']) as any : null,
          notes: `Lab test invoice - ${test.testName}`,
          invoiceItems: {
            create: {
              itemType: 'LAB_TEST',
              itemName: test.testName,
              description: `${test.testCategory} - Test #${test.testNumber}`,
              quantity: 1,
              unitPrice: subtotal,
              totalPrice: subtotal,
            }
          }
        }
      });

      // Update lab test paid status
      if (isPaid) {
        await prisma.labTest.update({
          where: { id: test.id },
          data: { isPaid: true }
        });
      }
    } catch (error) {
      // Skip if duplicate
    }
  }
  console.log(`✅ Created ${completedLabTests.length} lab test invoices`);

  // ============================================================
  // SECTION 14: RADIOLOGY TESTS
  // ============================================================
  console.log('\n📷 SECTION 14: Creating Radiology Tests...\n');

  for (let i = 0; i < 20; i++) {
    if (createdPatients.length === 0 || createdDoctors.length === 0 || createdRadiologyCatalog.length === 0) break;
    
    const patient = randomItem(createdPatients);
    const doctor = randomItem(createdDoctors);
    const catalog = randomItem(createdRadiologyCatalog);
    const status = randomItem(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'REPORTED']);
    
    try {
      await prisma.radiologyTest.create({
        data: {
          testNumber: `RAD-2025-${String(i + 1).padStart(5, '0')}`,
          patientId: patient.patient.id,
          orderingDoctorId: doctor.doctor.id,
          imagingCatalogId: catalog.id,
          modality: catalog.modality,
          bodyPart: catalog.bodyPart,
          studyDescription: catalog.testName,
          clinicalIndication: 'Clinical indication for imaging',
          scheduledDate: randomDate(new Date('2024-11-01'), new Date('2025-12-31')),
          status: status as any,
          findings: status === 'REPORTED' ? 'No significant abnormality detected' : null,
          impression: status === 'REPORTED' ? 'Normal study' : null,
          reportedDate: status === 'REPORTED' ? new Date() : null,
        },
      });

      if ((i + 1) % 5 === 0) {
        console.log(`✅ Created ${i + 1} radiology tests...`);
      }
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 15: IPD ADMISSIONS
  // ============================================================
  console.log('\n🏥 SECTION 15: Creating IPD Admissions...\n');

  for (let i = 0; i < 10; i++) {
    if (createdPatients.length === 0 || createdDoctors.length === 0 || createdBeds.length === 0) break;
    
    const patient = randomItem(createdPatients);
    const doctor = randomItem(createdDoctors);
    const bed = randomItem(createdBeds.filter((b: any) => b.status === 'AVAILABLE'));
    if (!bed) continue;
    
    const admissionDate = randomDate(new Date('2024-11-01'), new Date());
    const isDischarged = randomBool(0.6);
    
    try {
      await prisma.admission.create({
        data: {
          admissionNumber: `ADM-2025-${String(i + 1).padStart(5, '0')}`,
          patientId: patient.patient.id,
          attendingDoctorId: doctor.doctor.id,
          bedId: bed.id,
          admissionDate: admissionDate,
          admissionType: randomItem(['EMERGENCY', 'PLANNED', 'TRANSFER']) as any,
          reasonForAdmission: 'Medical condition requiring hospitalization',
          primaryDiagnosis: randomItem([
            'Pneumonia',
            'Appendicitis',
            'Myocardial Infarction',
            'Stroke',
            'Post-operative care',
            'Severe infection'
          ]),
          status: isDischarged ? 'DISCHARGED' : 'ADMITTED',
          dischargeDate: isDischarged ? randomDate(admissionDate, new Date()) : null,
          dischargeSummary: isDischarged ? 'Patient discharged in stable condition' : null,
        },
      });

      // Update bed status
      if (!isDischarged) {
        await prisma.bed.update({
          where: { id: bed.id },
          data: { status: 'OCCUPIED' }
        });
      }

      console.log(`✅ Created admission #${i + 1}`);
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 16: INVOICES & PAYMENTS
  // ============================================================
  console.log('\n💰 SECTION 16: Creating Invoices...\n');

  const completedAppts = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    take: 20,
    include: { patient: true, doctor: true }
  });

  for (let i = 0; i < completedAppts.length; i++) {
    const appointment = completedAppts[i];
    
    try {
      const subtotal = appointment.doctor.consultationFee + Math.floor(Math.random() * 500);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      const isPaid = randomBool(0.7);
      
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2025-${String(i + 1).padStart(5, '0')}`,
          patientId: appointment.patientId,
          invoiceDate: appointment.appointmentDate,
          dueDate: new Date(appointment.appointmentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          subtotal: subtotal,
          tax: tax,
          discount: 0,
          totalAmount: total,
          paidAmount: isPaid ? total : Math.floor(total * 0.5),
          balanceAmount: isPaid ? 0 : Math.floor(total * 0.5),
          paymentStatus: isPaid ? 'PAID' : randomItem(['PENDING', 'PARTIALLY_PAID']) as any,
          paymentMethod: isPaid ? randomItem(['CASH', 'CARD', 'UPI', 'INSURANCE']) as any : null,
          notes: 'Invoice for medical services',
          invoiceItems: {
            create: [
              {
                itemType: 'CONSULTATION',
                itemName: 'Consultation Fee',
                description: 'Doctor consultation',
                quantity: 1,
                unitPrice: appointment.doctor.consultationFee,
                totalPrice: appointment.doctor.consultationFee,
              },
              {
                itemType: 'LAB_TEST',
                itemName: 'Laboratory Tests',
                description: 'Lab investigations',
                quantity: 1,
                unitPrice: Math.floor(Math.random() * 500),
                totalPrice: Math.floor(Math.random() * 500),
              }
            ]
          }
        },
      });

      if ((i + 1) % 5 === 0) {
        console.log(`✅ Created ${i + 1} invoices...`);
      }
    } catch (error) {
      // Skip if duplicate
    }
  }

  // ============================================================
  // SECTION 17: NOTIFICATIONS
  // ============================================================
  console.log('\n🔔 SECTION 17: Creating Notifications...\n');

  const notificationTypes = ['APPOINTMENT_REMINDER', 'LAB_RESULT_READY', 'PRESCRIPTION_READY', 'PAYMENT_DUE', 'SYSTEM_ANNOUNCEMENT'];
  const allUsers = await prisma.user.findMany({ take: 20 });

  for (let i = 0; i < 30; i++) {
    if (allUsers.length === 0) break;
    
    const user = randomItem(allUsers);
    const type = randomItem(notificationTypes);
    
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: type as any,
          title: `${type.replace(/_/g, ' ')}`,
          message: `You have a new ${type.toLowerCase().replace(/_/g, ' ')}`,
          isRead: randomBool(0.3),
        },
      });
    } catch (error) {
      // Skip if duplicate
    }
  }
  console.log('✅ Created 30 notifications');

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 COMPREHENSIVE SEED COMPLETED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 DATABASE SUMMARY:\n');
  
  const counts = {
    users: await prisma.user.count(),
    doctors: await prisma.doctor.count(),
    patients: await prisma.patient.count(),
    staff: await prisma.staff.count(),
    appointments: await prisma.appointment.count(),
    medicalRecords: await prisma.medicalRecord.count(),
    prescriptions: await prisma.prescription.count(),
    medications: await prisma.medication.count(),
    inventory: await prisma.medicineInventory.count(),
    labTests: await prisma.labTest.count(),
    radiologyTests: await prisma.radiologyTest.count(),
    wards: await prisma.ward.count(),
    beds: await prisma.bed.count(),
    admissions: await prisma.admission.count(),
    invoices: await prisma.invoice.count(),
    operationTheaters: await prisma.operationTheater.count(),
    notifications: await prisma.notification.count(),
  };

  console.log(`👥 Total Users:           ${counts.users}`);
  console.log(`👨‍⚕️ Doctors:               ${counts.doctors}`);
  console.log(`🏥 Patients:              ${counts.patients}`);
  console.log(`👷 Staff:                 ${counts.staff}`);
  console.log(`📅 Appointments:          ${counts.appointments}`);
  console.log(`📋 Medical Records:       ${counts.medicalRecords}`);
  console.log(`💊 Prescriptions:         ${counts.prescriptions}`);
  console.log(`💉 Medications:           ${counts.medications}`);
  console.log(`📦 Inventory Items:       ${counts.inventory}`);
  console.log(`🔬 Lab Tests:             ${counts.labTests}`);
  console.log(`📷 Radiology Tests:       ${counts.radiologyTests}`);
  console.log(`🏨 Wards:                 ${counts.wards}`);
  console.log(`🛏️  Beds:                  ${counts.beds}`);
  console.log(`🏥 IPD Admissions:        ${counts.admissions}`);
  console.log(`💰 Invoices:              ${counts.invoices}`);
  console.log(`🏥 Operation Theaters:    ${counts.operationTheaters}`);
  console.log(`🔔 Notifications:         ${counts.notifications}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 LOGIN CREDENTIALS:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: superadmin@hospital.com | Role: SUPER_ADMIN');
  console.log('Email: admin@hospital.com      | Role: ADMIN');
  console.log('Email: sarah.johnson@hospital.com | Role: DOCTOR');
  console.log('Email: nurse1@hospital.com     | Role: NURSE');
  console.log('Email: lab1@hospital.com       | Role: LAB_TECHNICIAN');
  console.log('Email: pharmacist1@hospital.com| Role: PHARMACIST');
  console.log('Email: receptionist1@hospital.com | Role: RECEPTIONIST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Password for all users: Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✨ Your hospital system is now fully populated!');
  console.log('📹 Ready for recording!\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
