import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMedicalHistory() {
  console.log('🌱 Seeding Medical History...');

  const medicalHistory = [
    {
      patientId: 'patient-001',
      condition: 'Hypertension',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2018-05-15'),
      treatmentDetails: 'Lisinopril 10mg daily, lifestyle modifications, low-sodium diet',
      notes: 'Blood pressure well controlled with medication. Regular monitoring required.',
      isResolved: false,
    },
    {
      patientId: 'patient-001',
      condition: 'Appendectomy',
      conditionType: 'Surgical',
      diagnosisDate: new Date('2010-08-22'),
      treatmentDetails: 'Emergency appendectomy performed',
      notes: 'Uncomplicated recovery. No post-operative complications.',
      isResolved: true,
    },
    {
      patientId: 'patient-002',
      condition: 'Asthma',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2015-03-10'),
      treatmentDetails: 'Albuterol inhaler as needed, daily inhaled corticosteroid',
      notes: 'Mild persistent asthma. Triggers include exercise, cold air, and allergies.',
      isResolved: false,
    },
    {
      patientId: 'patient-003',
      condition: 'Type 2 Diabetes Mellitus',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2019-11-20'),
      treatmentDetails: 'Metformin 500mg twice daily, diet control, regular exercise',
      notes: 'HbA1c last measured at 6.8%. Good glycemic control.',
      isResolved: false,
    },
    {
      patientId: 'patient-003',
      condition: 'Pneumonia',
      conditionType: 'Acute',
      diagnosisDate: new Date('2023-01-15'),
      treatmentDetails: 'Hospitalized for 5 days, IV antibiotics, oxygen therapy',
      notes: 'Community-acquired pneumonia. Fully recovered.',
      isResolved: true,
    },
    {
      patientId: 'patient-005',
      condition: 'Hypercholesterolemia',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2020-07-30'),
      treatmentDetails: 'Atorvastatin 20mg daily, low-fat diet',
      notes: 'Total cholesterol reduced from 280 to 190 mg/dL with treatment.',
      isResolved: false,
    },
    {
      patientId: 'patient-006',
      condition: 'Chronic Migraine',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2017-04-18'),
      treatmentDetails: 'Sumatriptan 50mg for acute attacks, preventive therapy with topiramate',
      notes: 'Frequency reduced from 15 to 5 attacks per month with preventive treatment.',
      isResolved: false,
    },
    {
      patientId: 'patient-007',
      condition: 'Coronary Artery Disease',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2015-06-10'),
      treatmentDetails: 'Cardiac catheterization with stent placement in 2015. Aspirin, Metoprolol, Lisinopril',
      notes: 'Patient had angioplasty with drug-eluting stent. Regular follow-up required.',
      isResolved: false,
    },
    {
      patientId: 'patient-007',
      condition: 'Myocardial Infarction',
      conditionType: 'Acute',
      diagnosisDate: new Date('2015-06-05'),
      treatmentDetails: 'Emergency PCI, dual antiplatelet therapy, cardiac rehabilitation',
      notes: 'STEMI of anterior wall. Successful revascularization. Good recovery.',
      isResolved: true,
    },
    {
      patientId: 'patient-008',
      condition: 'Hypothyroidism',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2019-02-14'),
      treatmentDetails: 'Levothyroxine 75mcg daily',
      notes: 'TSH levels normalized with treatment. Annual monitoring.',
      isResolved: false,
    },
    {
      patientId: 'patient-009',
      condition: 'Obstructive Sleep Apnea',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2021-08-22'),
      treatmentDetails: 'CPAP therapy every night, weight loss recommended',
      notes: 'AHI of 32 on sleep study. Improved daytime sleepiness with CPAP.',
      isResolved: false,
    },
    {
      patientId: 'patient-009',
      condition: 'Obesity',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2018-03-15'),
      treatmentDetails: 'Dietary counseling, exercise program, bariatric surgery consultation',
      notes: 'BMI 35. Enrolled in weight management program.',
      isResolved: false,
    },
    {
      patientId: 'patient-007',
      condition: 'Essential Hypertension',
      conditionType: 'Chronic',
      diagnosisDate: new Date('2012-09-20'),
      treatmentDetails: 'Lisinopril 20mg, Hydrochlorothiazide 12.5mg daily',
      notes: 'Blood pressure well controlled at 120/75 mmHg.',
      isResolved: false,
    },
    {
      patientId: 'patient-005',
      condition: 'Fractured Left Radius',
      conditionType: 'Acute',
      diagnosisDate: new Date('2022-11-10'),
      treatmentDetails: 'Closed reduction and casting for 6 weeks',
      notes: 'Colles fracture from fall. Healed without complications.',
      isResolved: true,
    },
    {
      patientId: 'patient-010',
      condition: 'Tonsillectomy',
      conditionType: 'Surgical',
      diagnosisDate: new Date('2018-06-05'),
      treatmentDetails: 'Tonsillectomy and adenoidectomy',
      notes: 'Recurrent tonsillitis. Uncomplicated post-operative course.',
      isResolved: true,
    },
  ];

  for (const historyData of medicalHistory) {
    await prisma.medicalHistory.create({
      data: historyData,
    });
  }

  console.log(`✅ Seeded ${medicalHistory.length} medical history records`);
}
