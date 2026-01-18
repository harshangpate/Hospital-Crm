import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAdmissions() {
  console.log('🌱 Seeding Admissions...');

  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysLater = new Date(now);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const fiveDaysAgoDate = new Date(now);
  fiveDaysAgoDate.setDate(fiveDaysAgoDate.getDate() - 5);

  // Fetch some beds
  const icuBed1 = await prisma.bed.findUnique({ where: { bedNumber: 'ICU-BED-01' } });
  const genMaleBed1 = await prisma.bed.findUnique({ where: { bedNumber: 'GEN-M-BED-01' } });
  const genFemaleBed1 = await prisma.bed.findUnique({ where: { bedNumber: 'GEN-F-BED-01' } });
  const privBed1 = await prisma.bed.findUnique({ where: { bedNumber: 'PRIV-BED-01' } });
  const semiBed1 = await prisma.bed.findUnique({ where: { bedNumber: 'SEMI-BED-01' } });
  const pedBed1 = await prisma.bed.findUnique({ where: { bedNumber: 'PED-BED-01' } });

  const admissions = [
    {
      admissionNumber: 'ADM001',
      patientId: 'patient-001',
      bedId: icuBed1?.id,
      admissionDate: oneWeekAgo,
      admissionType: 'Emergency',
      attendingDoctorId: 'user-doctor-001',
      reasonForAdmission: 'Acute myocardial infarction',
      primaryDiagnosis: 'STEMI - Anterior wall myocardial infarction',
      status: 'ADMITTED',
      estimatedDischarge: tomorrow,
      relativeName: 'Mary Doe',
      relativePhone: '+1-555-8101',
      advancePayment: 10000.00,
    },
    {
      admissionNumber: 'ADM002',
      patientId: 'patient-003',
      bedId: genMaleBed1?.id,
      admissionDate: fiveDaysAgo,
      admissionType: 'Planned',
      attendingDoctorId: 'user-doctor-002',
      reasonForAdmission: 'Uncontrolled diabetes, diabetic ketoacidosis',
      primaryDiagnosis: 'Diabetic ketoacidosis with Type 2 Diabetes',
      status: 'ADMITTED',
      estimatedDischarge: twoDaysAgo,
      relativeName: 'Sarah Brown',
      relativePhone: '+1-555-8103',
      advancePayment: 5000.00,
    },
    {
      admissionNumber: 'ADM003',
      patientId: 'patient-009',
      bedId: privBed1?.id,
      admissionDate: twoDaysAgo,
      admissionType: 'Planned',
      attendingDoctorId: 'user-doctor-004',
      reasonForAdmission: 'Knee replacement surgery',
      primaryDiagnosis: 'Severe osteoarthritis of right knee',
      status: 'ADMITTED',
      estimatedDischarge: threeDaysLater,
      relativeName: 'Maria Garcia',
      relativePhone: '+1-555-8109',
      advancePayment: 15000.00,
    },
    {
      admissionNumber: 'ADM004',
      patientId: 'patient-002',
      bedId: genFemaleBed1?.id,
      admissionDate: twoWeeksAgo,
      dischargeDate: oneWeekAgo,
      admissionType: 'Emergency',
      attendingDoctorId: 'user-doctor-005',
      reasonForAdmission: 'Severe asthma exacerbation',
      primaryDiagnosis: 'Acute severe asthma exacerbation',
      status: 'DISCHARGED',
      relativeName: 'Tom Smith',
      relativePhone: '+1-555-8102',
      advancePayment: 3000.00,
      dischargeSummary: 'Patient admitted with severe asthma attack. Treated with bronchodilators, systemic steroids, and oxygen therapy. Symptoms improved significantly. Discharged in stable condition with inhaled medications and oral prednisone taper.',
      dischargeInstructions: 'Continue medications as prescribed. Follow up with pulmonologist in 1 week. Avoid triggers. Seek immediate medical attention if symptoms worsen.',
    },
    {
      admissionNumber: 'ADM005',
      patientId: 'patient-010',
      bedId: pedBed1?.id,
      admissionDate: tenDaysAgo,
      dischargeDate: fiveDaysAgoDate,
      admissionType: 'Emergency',
      attendingDoctorId: 'user-doctor-005',
      reasonForAdmission: 'High fever with dehydration',
      primaryDiagnosis: 'Viral fever with moderate dehydration',
      status: 'DISCHARGED',
      relativeName: 'Jose Rodriguez',
      relativePhone: '+1-555-8110',
      advancePayment: 2000.00,
      dischargeSummary: 'Young patient admitted with high-grade fever and dehydration. Rehydrated with IV fluids. Fever controlled with antipyretics. Blood tests showed viral infection. Improved and discharged.',
      dischargeInstructions: 'Oral rehydration, adequate fluids, paracetamol for fever. Follow up if fever persists beyond 3 days.',
    },
  ];

  for (const admissionData of admissions) {
    await prisma.admission.upsert({
      where: { admissionNumber: admissionData.admissionNumber },
      update: {},
      create: admissionData,
    });
  }

  console.log(`✅ Seeded ${admissions.length} admissions`);
}
