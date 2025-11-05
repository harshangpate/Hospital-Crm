import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enum for MedicationForm (from schema)
enum MedicationForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SYRUP = 'SYRUP',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  OINTMENT = 'OINTMENT',
  DROPS = 'DROPS',
  INHALER = 'INHALER',
  PATCH = 'PATCH',
  POWDER = 'POWDER',
  SUPPOSITORY = 'SUPPOSITORY',
}

const medications = [
  // Pain Relief & Anti-inflammatory
  {
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brandName: 'Tylenol',
    medicationForm: MedicationForm.TABLET,
    strength: '500mg',
    category: 'Analgesic',
    drugClass: 'Non-opioid analgesic',
    manufacturer: 'Generic',
    unitPrice: 2.50,
    requiresPrescription: false,
    isAvailable: true,
  },
  {
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    medicationForm: MedicationForm.TABLET,
    strength: '400mg',
    category: 'NSAID',
    drugClass: 'Non-steroidal anti-inflammatory',
    manufacturer: 'Generic',
    unitPrice: 3.00,
    requiresPrescription: false,
    isAvailable: true,
  },
  {
    name: 'Aspirin 75mg',
    genericName: 'Acetylsalicylic Acid',
    brandName: 'Aspirin',
    medicationForm: MedicationForm.TABLET,
    strength: '75mg',
    category: 'Antiplatelet',
    drugClass: 'Salicylate',
    manufacturer: 'Bayer',
    unitPrice: 1.50,
    requiresPrescription: false,
    isAvailable: true,
  },
  {
    name: 'Diclofenac 50mg',
    genericName: 'Diclofenac Sodium',
    brandName: 'Voltaren',
    medicationForm: MedicationForm.TABLET,
    strength: '50mg',
    category: 'NSAID',
    drugClass: 'Non-steroidal anti-inflammatory',
    manufacturer: 'Novartis',
    unitPrice: 4.50,
    requiresPrescription: true,
  },

  // Antibiotics
  {
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    medicationForm: MedicationForm.CAPSULE,
    strength: '500mg',
    category: 'Antibiotic',
    drugClass: 'Penicillin',
    manufacturer: 'GSK',
    unitPrice: 8.00,
    requiresPrescription: true,
  },
  {
    name: 'Azithromycin 500mg',
    genericName: 'Azithromycin',
    brandName: 'Zithromax',
    medicationForm: MedicationForm.TABLET,
    strength: '500mg',
    category: 'Antibiotic',
    drugClass: 'Macrolide',
    manufacturer: 'Pfizer',
    unitPrice: 12.00,
    requiresPrescription: true,
  },
  {
    name: 'Ciprofloxacin 500mg',
    genericName: 'Ciprofloxacin',
    brandName: 'Cipro',
    medicationForm: MedicationForm.TABLET,
    strength: '500mg',
    category: 'Antibiotic',
    drugClass: 'Fluoroquinolone',
    manufacturer: 'Bayer',
    unitPrice: 10.00,
    requiresPrescription: true,
  },
  {
    name: 'Doxycycline 100mg',
    genericName: 'Doxycycline',
    brandName: 'Vibramycin',
    medicationForm: MedicationForm.CAPSULE,
    strength: '100mg',
    category: 'Antibiotic',
    drugClass: 'Tetracycline',
    manufacturer: 'Generic',
    unitPrice: 6.00,
    requiresPrescription: true,
  },
  {
    name: 'Metronidazole 400mg',
    genericName: 'Metronidazole',
    brandName: 'Flagyl',
    medicationForm: MedicationForm.TABLET,
    strength: '400mg',
    category: 'Antibiotic',
    drugClass: 'Nitroimidazole',
    manufacturer: 'Sanofi',
    unitPrice: 5.50,
    requiresPrescription: true,
  },

  // Cardiovascular
  {
    name: 'Atenolol 50mg',
    genericName: 'Atenolol',
    brandName: 'Tenormin',
    medicationForm: MedicationForm.TABLET,
    strength: '50mg',
    category: 'Cardiovascular',
    drugClass: 'Beta-blocker',
    manufacturer: 'AstraZeneca',
    unitPrice: 7.00,
    requiresPrescription: true,
  },
  {
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine',
    brandName: 'Norvasc',
    medicationForm: MedicationForm.TABLET,
    strength: '5mg',
    category: 'Cardiovascular',
    drugClass: 'Calcium channel blocker',
    manufacturer: 'Pfizer',
    unitPrice: 6.50,
    requiresPrescription: true,
  },
  {
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin',
    brandName: 'Lipitor',
    medicationForm: MedicationForm.TABLET,
    strength: '20mg',
    category: 'Cardiovascular',
    drugClass: 'Statin',
    manufacturer: 'Pfizer',
    unitPrice: 9.00,
    requiresPrescription: true,
  },
  {
    name: 'Clopidogrel 75mg',
    genericName: 'Clopidogrel',
    brandName: 'Plavix',
    medicationForm: MedicationForm.TABLET,
    strength: '75mg',
    category: 'Antiplatelet',
    drugClass: 'Platelet inhibitor',
    manufacturer: 'Sanofi',
    unitPrice: 11.00,
    requiresPrescription: true,
  },
  {
    name: 'Losartan 50mg',
    genericName: 'Losartan',
    brandName: 'Cozaar',
    medicationForm: MedicationForm.TABLET,
    strength: '50mg',
    category: 'Cardiovascular',
    drugClass: 'ARB',
    manufacturer: 'Merck',
    unitPrice: 8.50,
    requiresPrescription: true,
  },
  {
    name: 'Warfarin 5mg',
    genericName: 'Warfarin',
    brandName: 'Coumadin',
    medicationForm: MedicationForm.TABLET,
    strength: '5mg',
    category: 'Anticoagulant',
    drugClass: 'Vitamin K antagonist',
    manufacturer: 'Bristol-Myers Squibb',
    unitPrice: 4.00,
    requiresPrescription: true,
  },

  // Diabetes
  {
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    brandName: 'Glucophage',
    medicationForm: MedicationForm.TABLET,
    strength: '500mg',
    category: 'Antidiabetic',
    drugClass: 'Biguanide',
    manufacturer: 'Bristol-Myers Squibb',
    unitPrice: 5.00,
    requiresPrescription: true,
  },
  {
    name: 'Glimepiride 2mg',
    genericName: 'Glimepiride',
    brandName: 'Amaryl',
    medicationForm: MedicationForm.TABLET,
    strength: '2mg',
    category: 'Antidiabetic',
    drugClass: 'Sulfonylurea',
    manufacturer: 'Sanofi',
    unitPrice: 7.50,
    requiresPrescription: true,
  },
  {
    name: 'Insulin Glargine 100IU/ml',
    genericName: 'Insulin Glargine',
    brandName: 'Lantus',
    medicationForm: MedicationForm.INJECTION,
    strength: '100IU/ml',
    category: 'Antidiabetic',
    drugClass: 'Long-acting insulin',
    manufacturer: 'Sanofi',
    unitPrice: 45.00,
    requiresPrescription: true,
  },

  // Respiratory
  {
    name: 'Salbutamol Inhaler',
    genericName: 'Salbutamol',
    brandName: 'Ventolin',
    medicationForm: MedicationForm.INHALER,
    strength: '100mcg/dose',
    category: 'Bronchodilator',
    drugClass: 'Beta-2 agonist',
    manufacturer: 'GSK',
    unitPrice: 15.00,
    requiresPrescription: true,
  },
  {
    name: 'Montelukast 10mg',
    genericName: 'Montelukast',
    brandName: 'Singulair',
    medicationForm: MedicationForm.TABLET,
    strength: '10mg',
    category: 'Anti-asthmatic',
    drugClass: 'Leukotriene receptor antagonist',
    manufacturer: 'Merck',
    unitPrice: 8.00,
    requiresPrescription: true,
  },
  {
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine',
    brandName: 'Zyrtec',
    medicationForm: MedicationForm.TABLET,
    strength: '10mg',
    category: 'Antihistamine',
    drugClass: 'H1 receptor antagonist',
    manufacturer: 'UCB',
    unitPrice: 3.50,
    requiresPrescription: false,
  },
  {
    name: 'Prednisolone 5mg',
    genericName: 'Prednisolone',
    brandName: 'Prelone',
    medicationForm: MedicationForm.TABLET,
    strength: '5mg',
    category: 'Corticosteroid',
    drugClass: 'Glucocorticoid',
    manufacturer: 'Generic',
    unitPrice: 4.00,
    requiresPrescription: true,
  },

  // Gastrointestinal
  {
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    medicationForm: MedicationForm.CAPSULE,
    strength: '20mg',
    category: 'Proton pump inhibitor',
    drugClass: 'PPI',
    manufacturer: 'AstraZeneca',
    unitPrice: 6.00,
    requiresPrescription: true,
  },
  {
    name: 'Pantoprazole 40mg',
    genericName: 'Pantoprazole',
    brandName: 'Protonix',
    medicationForm: MedicationForm.TABLET,
    strength: '40mg',
    category: 'Proton pump inhibitor',
    drugClass: 'PPI',
    manufacturer: 'Pfizer',
    unitPrice: 7.00,
    requiresPrescription: true,
  },
  {
    name: 'Ondansetron 4mg',
    genericName: 'Ondansetron',
    brandName: 'Zofran',
    medicationForm: MedicationForm.TABLET,
    strength: '4mg',
    category: 'Antiemetic',
    drugClass: '5-HT3 receptor antagonist',
    manufacturer: 'GSK',
    unitPrice: 5.50,
    requiresPrescription: true,
  },
  {
    name: 'Loperamide 2mg',
    genericName: 'Loperamide',
    brandName: 'Imodium',
    medicationForm: MedicationForm.CAPSULE,
    strength: '2mg',
    category: 'Antidiarrheal',
    drugClass: 'Opioid receptor agonist',
    manufacturer: 'Johnson & Johnson',
    unitPrice: 4.50,
    requiresPrescription: false,
  },

  // Neurological & Psychiatric
  {
    name: 'Gabapentin 300mg',
    genericName: 'Gabapentin',
    brandName: 'Neurontin',
    medicationForm: MedicationForm.CAPSULE,
    strength: '300mg',
    category: 'Anticonvulsant',
    drugClass: 'GABA analogue',
    manufacturer: 'Pfizer',
    unitPrice: 9.00,
    requiresPrescription: true,
  },
  {
    name: 'Sertraline 50mg',
    genericName: 'Sertraline',
    brandName: 'Zoloft',
    medicationForm: MedicationForm.TABLET,
    strength: '50mg',
    category: 'Antidepressant',
    drugClass: 'SSRI',
    manufacturer: 'Pfizer',
    unitPrice: 10.00,
    requiresPrescription: true,
  },
  {
    name: 'Alprazolam 0.5mg',
    genericName: 'Alprazolam',
    brandName: 'Xanax',
    medicationForm: MedicationForm.TABLET,
    strength: '0.5mg',
    category: 'Anxiolytic',
    drugClass: 'Benzodiazepine',
    manufacturer: 'Pfizer',
    unitPrice: 8.50,
    requiresPrescription: true,
  },

  // Additional Common Medications
  {
    name: 'Levothyroxine 100mcg',
    genericName: 'Levothyroxine',
    brandName: 'Synthroid',
    medicationForm: MedicationForm.TABLET,
    strength: '100mcg',
    category: 'Thyroid hormone',
    drugClass: 'Thyroid supplement',
    manufacturer: 'AbbVie',
    unitPrice: 6.50,
    requiresPrescription: true,
  },
  {
    name: 'Vitamin D3 1000IU',
    genericName: 'Cholecalciferol',
    brandName: 'Vigantol',
    medicationForm: MedicationForm.TABLET,
    strength: '1000IU',
    category: 'Vitamin supplement',
    drugClass: 'Vitamin',
    manufacturer: 'Generic',
    unitPrice: 2.00,
    requiresPrescription: false,
  },
  {
    name: 'Folic Acid 5mg',
    genericName: 'Folic Acid',
    brandName: 'Folvite',
    medicationForm: MedicationForm.TABLET,
    strength: '5mg',
    category: 'Vitamin supplement',
    drugClass: 'Vitamin B9',
    manufacturer: 'Generic',
    unitPrice: 1.50,
    requiresPrescription: false,
  },
  {
    name: 'Calcium Carbonate 500mg',
    genericName: 'Calcium Carbonate',
    brandName: 'Caltrate',
    medicationForm: MedicationForm.TABLET,
    strength: '500mg',
    category: 'Mineral supplement',
    drugClass: 'Calcium supplement',
    manufacturer: 'Pfizer',
    unitPrice: 3.00,
    requiresPrescription: false,
  },
  {
    name: 'Ranitidine 150mg',
    genericName: 'Ranitidine',
    brandName: 'Zantac',
    medicationForm: MedicationForm.TABLET,
    strength: '150mg',
    category: 'H2 blocker',
    drugClass: 'H2 receptor antagonist',
    manufacturer: 'GSK',
    unitPrice: 4.50,
    requiresPrescription: true,
  },
];

async function seedMedications() {
  console.log('🔄 Starting medication seeding...');

  try {
    // Clear existing medications if needed
    const existingCount = await prisma.medication.count();
    console.log(`📊 Existing medications: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Medications already exist. Skipping seed to avoid duplicates.');
      console.log('💡 To reseed, manually delete medications from database first.');
      return;
    }

    // Create medications
    console.log('📝 Creating medications...');
    const createdMedications = [];

    for (const med of medications) {
      const created = await prisma.medication.create({
        data: med,
      });
      createdMedications.push(created);
      console.log(`✅ Created: ${created.name}`);
    }

    console.log(`\n🎉 Successfully created ${createdMedications.length} medications!`);

    // Now create drug interactions
    console.log('\n🔄 Creating drug interactions...');

    const interactions = [
      // SEVERE interactions
      {
        medication1: 'Warfarin 5mg',
        medication2: 'Aspirin 75mg',
        severity: 'SEVERE',
        description:
          'Increased risk of bleeding. Both medications affect blood clotting. Combined use significantly increases hemorrhage risk.',
        recommendations:
          'Avoid concurrent use if possible. If necessary, use lowest effective doses and monitor INR closely.',
      },
      {
        medication1: 'Metformin 500mg',
        medication2: 'Insulin Glargine 100IU/ml',
        severity: 'MODERATE',
        description:
          'Increased risk of hypoglycemia. Both medications lower blood glucose levels.',
        recommendations:
          'Monitor blood glucose levels frequently. Adjust doses as needed. Patient education on hypoglycemia symptoms.',
      },
      {
        medication1: 'Warfarin 5mg',
        medication2: 'Ciprofloxacin 500mg',
        severity: 'SEVERE',
        description:
          'Ciprofloxacin may enhance the anticoagulant effect of warfarin, increasing bleeding risk.',
        recommendations:
          'Monitor INR closely during and after ciprofloxacin therapy. Consider warfarin dose adjustment.',
      },
      {
        medication1: 'Alprazolam 0.5mg',
        medication2: 'Sertraline 50mg',
        severity: 'MODERATE',
        description:
          'Sertraline may increase alprazolam levels, enhancing sedative effects and risk of CNS depression.',
        recommendations:
          'Monitor for increased sedation. Consider alprazolam dose reduction. Warn patient about drowsiness.',
      },

      // MODERATE interactions
      {
        medication1: 'Aspirin 75mg',
        medication2: 'Ibuprofen 400mg',
        severity: 'MODERATE',
        description:
          'Both are NSAIDs. Combined use increases risk of gastrointestinal bleeding and ulceration.',
        recommendations:
          'Avoid concurrent use if possible. If needed, use protective agents like PPIs. Monitor for GI symptoms.',
      },
      {
        medication1: 'Atenolol 50mg',
        medication2: 'Insulin Glargine 100IU/ml',
        severity: 'MODERATE',
        description:
          'Beta-blockers may mask symptoms of hypoglycemia and impair recovery from hypoglycemic episodes.',
        recommendations:
          'Monitor blood glucose closely. Educate patient on hypoglycemia symptoms that may not be masked.',
      },
      {
        medication1: 'Amlodipine 5mg',
        medication2: 'Atorvastatin 20mg',
        severity: 'MODERATE',
        description:
          'Amlodipine may increase atorvastatin levels, potentially increasing risk of myopathy.',
        recommendations:
          'Monitor for muscle pain or weakness. Consider lower atorvastatin dose. Check CK if symptoms occur.',
      },
      {
        medication1: 'Metformin 500mg',
        medication2: 'Prednisolone 5mg',
        severity: 'MODERATE',
        description:
          'Corticosteroids may increase blood glucose levels, reducing metformin effectiveness.',
        recommendations:
          'Monitor blood glucose closely. May need to increase metformin dose during steroid therapy.',
      },
      {
        medication1: 'Levothyroxine 100mcg',
        medication2: 'Omeprazole 20mg',
        severity: 'MODERATE',
        description:
          'PPIs may reduce absorption of levothyroxine, decreasing its effectiveness.',
        recommendations:
          'Separate administration by at least 4 hours. Monitor TSH levels more frequently.',
      },
      {
        medication1: 'Azithromycin 500mg',
        medication2: 'Ondansetron 4mg',
        severity: 'MODERATE',
        description:
          'Both medications can prolong QT interval, increasing risk of cardiac arrhythmias.',
        recommendations:
          'Use with caution in patients with cardiac risk factors. Consider ECG monitoring.',
      },

      // MILD interactions
      {
        medication1: 'Paracetamol 500mg',
        medication2: 'Warfarin 5mg',
        severity: 'MILD',
        description:
          'Regular paracetamol use (>2g/day) may slightly enhance warfarin anticoagulant effect.',
        recommendations:
          'Monitor INR if paracetamol used regularly. Occasional use unlikely to cause issues.',
      },
      {
        medication1: 'Cetirizine 10mg',
        medication2: 'Alprazolam 0.5mg',
        severity: 'MILD',
        description: 'Both medications may cause drowsiness. Combined use may enhance sedation.',
        recommendations: 'Warn patient about potential increased drowsiness. Avoid driving initially.',
      },
      {
        medication1: 'Losartan 50mg',
        medication2: 'Ibuprofen 400mg',
        severity: 'MODERATE',
        description:
          'NSAIDs may reduce the antihypertensive effect of ARBs and increase risk of kidney problems.',
        recommendations:
          'Monitor blood pressure and renal function. Use lowest effective NSAID dose for shortest duration.',
      },
      {
        medication1: 'Calcium Carbonate 500mg',
        medication2: 'Levothyroxine 100mcg',
        severity: 'MODERATE',
        description: 'Calcium may reduce absorption of levothyroxine.',
        recommendations:
          'Separate administration by at least 4 hours. Take levothyroxine on empty stomach.',
      },
      {
        medication1: 'Ciprofloxacin 500mg',
        medication2: 'Calcium Carbonate 500mg',
        severity: 'MODERATE',
        description: 'Calcium significantly reduces ciprofloxacin absorption.',
        recommendations:
          'Separate administration by at least 2 hours. Take ciprofloxacin 2 hours before or 6 hours after calcium.',
      },
      {
        medication1: 'Metronidazole 400mg',
        medication2: 'Warfarin 5mg',
        severity: 'SEVERE',
        description:
          'Metronidazole significantly enhances warfarin anticoagulant effect, greatly increasing bleeding risk.',
        recommendations: 'Monitor INR very closely. Warfarin dose reduction usually necessary.',
      },
      {
        medication1: 'Doxycycline 100mg',
        medication2: 'Calcium Carbonate 500mg',
        severity: 'MODERATE',
        description: 'Calcium reduces doxycycline absorption.',
        recommendations: 'Separate administration by at least 2 hours.',
      },
      {
        medication1: 'Gabapentin 300mg',
        medication2: 'Alprazolam 0.5mg',
        severity: 'MODERATE',
        description: 'Both medications cause CNS depression. Combined use enhances sedative effects.',
        recommendations:
          'Monitor for excessive sedation. May need dose adjustment. Warn about driving and operating machinery.',
      },
      {
        medication1: 'Clopidogrel 75mg',
        medication2: 'Omeprazole 20mg',
        severity: 'MODERATE',
        description:
          'Omeprazole may reduce the antiplatelet effect of clopidogrel by inhibiting its activation.',
        recommendations:
          'Consider alternative PPI (pantoprazole preferred). If omeprazole necessary, separate administration by 12+ hours.',
      },
      {
        medication1: 'Amoxicillin 500mg',
        medication2: 'Metronidazole 400mg',
        severity: 'MILD',
        description: 'Sometimes used together therapeutically (H. pylori treatment). Generally safe.',
        recommendations: 'No specific precautions needed. Common therapeutic combination.',
      },
    ];

    let interactionCount = 0;

    for (const interaction of interactions) {
      // Find medication IDs
      const med1 = createdMedications.find((m) => m.name === interaction.medication1);
      const med2 = createdMedications.find((m) => m.name === interaction.medication2);

      if (med1 && med2) {
        await prisma.drugInteraction.create({
          data: {
            medicationId: med1.id,
            interactsWithId: med2.id,
            severityLevel: interaction.severity,
            interactionType: 'Drug-Drug Interaction',
            description: interaction.description,
            recommendation: interaction.recommendations,
          },
        });
        interactionCount++;
        console.log(`✅ Created interaction: ${med1.name} ↔ ${med2.name} (${interaction.severity})`);
      }
    }

    console.log(`\n🎉 Successfully created ${interactionCount} drug interactions!`);

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Medications: ${createdMedications.length}`);
    console.log(`   ✅ Drug Interactions: ${interactionCount}`);
    console.log(`   📋 Categories: Pain Relief, Antibiotics, Cardiovascular, Diabetes, Respiratory, GI, Neurological`);
    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedMedications()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
