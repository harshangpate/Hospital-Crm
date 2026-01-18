import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDoctors() {
  console.log('🌱 Seeding Doctors...');

  const doctors = [
    {
      id: 'doctor-001',
      userId: 'user-doctor-001',
      doctorId: 'DOC001',
      specialization: 'Cardiology',
      qualification: 'MD, FACC',
      experience: 15,
      licenseNumber: 'MED-NY-12345',
      consultationFee: 200.0,
      isAvailable: true,
      department: 'Cardiology',
      designation: 'Senior Cardiologist',
      biography: 'Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience in treating heart conditions. She specializes in interventional cardiology and preventive heart care.',
      languages: 'English, Spanish',
      awards: 'Best Cardiologist Award 2023, Excellence in Patient Care 2022',
    },
    {
      id: 'doctor-002',
      userId: 'user-doctor-002',
      doctorId: 'DOC002',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      experience: 20,
      licenseNumber: 'MED-NY-23456',
      consultationFee: 150.0,
      isAvailable: true,
      department: 'General Medicine',
      designation: 'Chief Physician',
      biography: 'Dr. Michael Chen has been practicing general medicine for two decades. He has extensive experience in diagnosing and treating a wide range of medical conditions.',
      languages: 'English, Mandarin, Cantonese',
      awards: 'Outstanding Physician Award 2021',
    },
    {
      id: 'doctor-003',
      userId: 'user-doctor-003',
      doctorId: 'DOC003',
      specialization: 'Dermatology',
      qualification: 'MD, Dermatology Board Certified',
      experience: 12,
      licenseNumber: 'MED-NY-34567',
      consultationFee: 180.0,
      isAvailable: true,
      department: 'Dermatology',
      designation: 'Senior Dermatologist',
      biography: 'Dr. Emily Brown specializes in medical and cosmetic dermatology. She is an expert in treating skin conditions and performing aesthetic procedures.',
      languages: 'English',
      awards: 'Top Dermatologist 2024',
    },
    {
      id: 'doctor-004',
      userId: 'user-doctor-004',
      doctorId: 'DOC004',
      specialization: 'Orthopedics',
      qualification: 'MD, MS (Ortho)',
      experience: 18,
      licenseNumber: 'MED-NY-45678',
      consultationFee: 220.0,
      isAvailable: true,
      department: 'Orthopedics',
      designation: 'Head of Orthopedics',
      biography: 'Dr. David Wilson is a skilled orthopedic surgeon specializing in joint replacement, sports injuries, and trauma care.',
      languages: 'English, French',
      awards: 'Excellence in Orthopedic Surgery 2023',
    },
    {
      id: 'doctor-005',
      userId: 'user-doctor-005',
      doctorId: 'DOC005',
      specialization: 'Pediatrics',
      qualification: 'MD, Board Certified Pediatrician',
      experience: 10,
      licenseNumber: 'MED-NY-56789',
      consultationFee: 160.0,
      isAvailable: true,
      department: 'Pediatrics',
      designation: 'Pediatric Specialist',
      biography: 'Dr. Jessica Martinez is passionate about child healthcare. She provides comprehensive care for infants, children, and adolescents.',
      languages: 'English, Spanish',
      awards: 'Best Pediatrician 2024',
    },
    {
      id: 'doctor-006',
      userId: 'user-doctor-006',
      doctorId: 'DOC006',
      specialization: 'Neurology',
      qualification: 'MD, DNB (Neurology)',
      experience: 22,
      licenseNumber: 'MED-NY-67890',
      consultationFee: 250.0,
      isAvailable: true,
      department: 'Neurology',
      designation: 'Chief Neurologist',
      biography: 'Dr. Robert Taylor is a renowned neurologist specializing in stroke, epilepsy, and movement disorders. He has published numerous research papers.',
      languages: 'English, German',
      awards: 'Neurology Excellence Award 2022, Research Excellence 2023',
    },
  ];

  for (const doctorData of doctors) {
    await prisma.doctor.upsert({
      where: { doctorId: doctorData.doctorId },
      update: {},
      create: doctorData,
    });
  }

  console.log(`✅ Seeded ${doctors.length} doctors`);
}
