import { PrismaClient, AllergySeverity } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAllergies() {
  console.log('🌱 Seeding Allergies...');

  const allergies = [
    {
      patientId: 'patient-001',
      allergen: 'Penicillin',
      allergyType: 'Medication',
      severity: AllergySeverity.SEVERE,
      reaction: 'Anaphylaxis, difficulty breathing, hives',
      diagnosedDate: new Date('2015-03-20'),
      notes: 'Patient developed severe reaction after receiving penicillin injection. Avoid all penicillin-based antibiotics.',
      isActive: true,
    },
    {
      patientId: 'patient-002',
      allergen: 'Shellfish',
      allergyType: 'Food',
      severity: AllergySeverity.MODERATE,
      reaction: 'Hives, swelling of lips and tongue, stomach cramps',
      diagnosedDate: new Date('2018-07-15'),
      notes: 'Allergic to shrimp, crab, and lobster. Carries EpiPen.',
      isActive: true,
    },
    {
      patientId: 'patient-002',
      allergen: 'Latex',
      allergyType: 'Environmental',
      severity: AllergySeverity.MILD,
      reaction: 'Skin rash, itching at contact site',
      diagnosedDate: new Date('2019-05-10'),
      notes: 'Use latex-free gloves during medical procedures.',
      isActive: true,
    },
    {
      patientId: 'patient-004',
      allergen: 'Dust Mites',
      allergyType: 'Environmental',
      severity: AllergySeverity.MODERATE,
      reaction: 'Sneezing, runny nose, itchy eyes, asthma symptoms',
      diagnosedDate: new Date('2010-02-28'),
      notes: 'Worse during spring and fall. Uses antihistamines regularly.',
      isActive: true,
    },
    {
      patientId: 'patient-004',
      allergen: 'Pollen',
      allergyType: 'Environmental',
      severity: AllergySeverity.MODERATE,
      reaction: 'Allergic rhinitis, watery eyes, sneezing',
      diagnosedDate: new Date('2010-04-12'),
      notes: 'Seasonal allergies. Worse in spring.',
      isActive: true,
    },
    {
      patientId: 'patient-005',
      allergen: 'Aspirin',
      allergyType: 'Medication',
      severity: AllergySeverity.SEVERE,
      reaction: 'Stomach bleeding, severe gastric pain',
      diagnosedDate: new Date('2016-11-03'),
      notes: 'Avoid NSAIDs. Use acetaminophen for pain relief.',
      isActive: true,
    },
    {
      patientId: 'patient-006',
      allergen: 'Codeine',
      allergyType: 'Medication',
      severity: AllergySeverity.MODERATE,
      reaction: 'Severe nausea, vomiting, dizziness',
      diagnosedDate: new Date('2020-08-17'),
      notes: 'Use alternative pain medications. Avoid all opioids containing codeine.',
      isActive: true,
    },
    {
      patientId: 'patient-007',
      allergen: 'Sulfa Drugs',
      allergyType: 'Medication',
      severity: AllergySeverity.MODERATE,
      reaction: 'Skin rash, fever, joint pain',
      diagnosedDate: new Date('2012-06-22'),
      notes: 'Avoid sulfonamide antibiotics. Use alternative antibiotics.',
      isActive: true,
    },
    {
      patientId: 'patient-009',
      allergen: 'Iodine Contrast',
      allergyType: 'Medication',
      severity: AllergySeverity.SEVERE,
      reaction: 'Severe hypersensitivity, anaphylaxis',
      diagnosedDate: new Date('2019-09-30'),
      notes: 'Premedicate with steroids and antihistamines before any contrast imaging. Consider alternative imaging modalities.',
      isActive: true,
    },
    {
      patientId: 'patient-008',
      allergen: 'Eggs',
      allergyType: 'Food',
      severity: AllergySeverity.MILD,
      reaction: 'Mild hives, stomach upset',
      diagnosedDate: new Date('2021-03-08'),
      notes: 'Can tolerate baked goods with eggs but not raw or lightly cooked eggs.',
      isActive: true,
    },
    {
      patientId: 'patient-003',
      allergen: 'Bee Stings',
      allergyType: 'Environmental',
      severity: AllergySeverity.LIFE_THREATENING,
      reaction: 'Anaphylaxis, severe swelling, difficulty breathing, drop in blood pressure',
      diagnosedDate: new Date('2014-07-19'),
      notes: 'Patient must carry EpiPen at all times. Consider venom immunotherapy.',
      isActive: true,
    },
    {
      patientId: 'patient-006',
      allergen: 'Cats',
      allergyType: 'Environmental',
      severity: AllergySeverity.MODERATE,
      reaction: 'Sneezing, itchy eyes, nasal congestion, asthma',
      diagnosedDate: new Date('2008-01-15'),
      notes: 'Avoid direct contact with cats. Keep pets out of bedroom.',
      isActive: true,
    },
  ];

  for (const allergyData of allergies) {
    await prisma.allergy.create({
      data: allergyData,
    });
  }

  console.log(`✅ Seeded ${allergies.length} allergies`);
}
