import { PrismaClient, AppointmentStatus, AppointmentType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAppointments() {
  console.log('🌱 Seeding Appointments...');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const appointments = [
    // Completed Appointments
    {
      appointmentNumber: 'APT001',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      appointmentDate: twoWeeksAgo,
      appointmentTime: '10:00',
      duration: 30,
      type: AppointmentType.NEW_CONSULTATION,
      status: AppointmentStatus.COMPLETED,
      reason: 'Chest pain and irregular heartbeat',
      symptoms: 'Chest discomfort, palpitations, shortness of breath',
      notes: 'Patient experiencing intermittent chest pain for 3 days',
      tokenNumber: 1,
      bookedBy: 'user-patient-001',
      completedAt: new Date(twoWeeksAgo.getTime() + 2 * 60 * 60 * 1000),
      doctorNotes: 'ECG shows irregular rhythm. Recommended echocardiogram and Holter monitoring.',
    },
    {
      appointmentNumber: 'APT002',
      patientId: 'patient-002',
      doctorId: 'doctor-005',
      appointmentDate: lastWeek,
      appointmentTime: '09:00',
      duration: 30,
      type: AppointmentType.ROUTINE_CHECKUP,
      status: AppointmentStatus.COMPLETED,
      reason: 'Regular pediatric checkup',
      symptoms: 'None - routine visit',
      notes: 'Annual health checkup for child',
      tokenNumber: 1,
      bookedBy: 'user-receptionist-001',
      completedAt: new Date(lastWeek.getTime() + 1.5 * 60 * 60 * 1000),
      doctorNotes: 'Child is healthy. Growth and development normal. Vaccinations up to date.',
    },
    {
      appointmentNumber: 'APT003',
      patientId: 'patient-003',
      doctorId: 'doctor-002',
      appointmentDate: lastWeek,
      appointmentTime: '11:00',
      duration: 30,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.COMPLETED,
      reason: 'Diabetes follow-up',
      symptoms: 'Increased thirst, frequent urination',
      notes: 'Follow-up for Type 2 Diabetes management',
      tokenNumber: 5,
      bookedBy: 'user-patient-003',
      completedAt: new Date(lastWeek.getTime() + 2 * 60 * 60 * 1000),
      doctorNotes: 'Blood sugar levels slightly elevated. Adjusted medication dosage. Diet counseling provided.',
    },
    {
      appointmentNumber: 'APT004',
      patientId: 'patient-004',
      doctorId: 'doctor-003',
      appointmentDate: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      appointmentTime: '14:00',
      duration: 30,
      type: AppointmentType.NEW_CONSULTATION,
      status: AppointmentStatus.COMPLETED,
      reason: 'Skin rash and itching',
      symptoms: 'Red rash on arms and legs, severe itching',
      notes: 'Allergic reaction suspected',
      tokenNumber: 8,
      bookedBy: 'user-patient-004',
      completedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      doctorNotes: 'Contact dermatitis diagnosed. Prescribed topical corticosteroid and antihistamine.',
    },

    // Today's Appointments
    {
      appointmentNumber: 'APT005',
      patientId: 'patient-005',
      doctorId: 'doctor-002',
      appointmentDate: now,
      appointmentTime: '10:00',
      duration: 30,
      type: AppointmentType.ROUTINE_CHECKUP,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Annual physical examination',
      symptoms: 'None - routine checkup',
      notes: 'Routine health assessment',
      tokenNumber: 3,
      bookedBy: 'user-receptionist-001',
    },
    {
      appointmentNumber: 'APT006',
      patientId: 'patient-006',
      doctorId: 'doctor-006',
      appointmentDate: now,
      appointmentTime: '11:30',
      duration: 45,
      type: AppointmentType.NEW_CONSULTATION,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Severe headaches',
      symptoms: 'Recurring headaches, sensitivity to light, nausea',
      notes: 'Patient experiencing migraines for the past month',
      tokenNumber: 6,
      bookedBy: 'user-patient-006',
    },
    {
      appointmentNumber: 'APT007',
      patientId: 'patient-007',
      doctorId: 'doctor-001',
      appointmentDate: now,
      appointmentTime: '14:00',
      duration: 30,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.SCHEDULED,
      reason: 'Post-procedure follow-up',
      symptoms: 'Mild chest discomfort',
      notes: 'Follow-up after cardiac catheterization',
      tokenNumber: 10,
      bookedBy: 'user-patient-007',
    },

    // Tomorrow's Appointments
    {
      appointmentNumber: 'APT008',
      patientId: 'patient-008',
      doctorId: 'doctor-003',
      appointmentDate: tomorrow,
      appointmentTime: '10:30',
      duration: 30,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Acne treatment follow-up',
      symptoms: 'Acne on face',
      notes: 'Second visit for acne treatment',
      tokenNumber: 4,
      bookedBy: 'user-patient-008',
    },
    {
      appointmentNumber: 'APT009',
      patientId: 'patient-009',
      doctorId: 'doctor-004',
      appointmentDate: tomorrow,
      appointmentTime: '09:30',
      duration: 30,
      type: AppointmentType.NEW_CONSULTATION,
      status: AppointmentStatus.SCHEDULED,
      reason: 'Knee pain',
      symptoms: 'Pain in right knee, difficulty walking',
      notes: 'Patient injured knee while jogging',
      tokenNumber: 2,
      bookedBy: 'user-receptionist-002',
    },
    {
      appointmentNumber: 'APT010',
      patientId: 'patient-010',
      doctorId: 'doctor-005',
      appointmentDate: tomorrow,
      appointmentTime: '08:30',
      duration: 30,
      type: AppointmentType.ROUTINE_CHECKUP,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Vaccination',
      symptoms: 'None',
      notes: 'HPV vaccine second dose',
      tokenNumber: 1,
      bookedBy: 'user-receptionist-001',
    },

    // Future Appointments
    {
      appointmentNumber: 'APT011',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      appointmentDate: nextWeek,
      appointmentTime: '10:00',
      duration: 30,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.SCHEDULED,
      reason: 'Cardiology follow-up',
      symptoms: 'None',
      notes: 'Follow-up to review test results',
      tokenNumber: 3,
      bookedBy: 'user-patient-001',
    },
    {
      appointmentNumber: 'APT012',
      patientId: 'patient-002',
      doctorId: 'doctor-002',
      appointmentDate: nextWeek,
      appointmentTime: '14:00',
      duration: 30,
      type: AppointmentType.ROUTINE_CHECKUP,
      status: AppointmentStatus.SCHEDULED,
      reason: 'General health checkup',
      symptoms: 'None',
      notes: 'Routine examination',
      tokenNumber: 8,
      bookedBy: 'user-patient-002',
    },

    // Cancelled Appointment
    {
      appointmentNumber: 'APT013',
      patientId: 'patient-005',
      doctorId: 'doctor-004',
      appointmentDate: yesterday,
      appointmentTime: '15:00',
      duration: 30,
      type: AppointmentType.NEW_CONSULTATION,
      status: AppointmentStatus.CANCELLED,
      reason: 'Back pain',
      symptoms: 'Lower back pain',
      notes: 'Patient requested cancellation',
      tokenNumber: 12,
      bookedBy: 'user-patient-005',
      cancelledAt: yesterday,
      cancellationReason: 'Patient had to travel out of town',
    },

    // No Show
    {
      appointmentNumber: 'APT014',
      patientId: 'patient-006',
      doctorId: 'doctor-002',
      appointmentDate: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
      appointmentTime: '11:00',
      duration: 30,
      type: AppointmentType.ROUTINE_CHECKUP,
      status: AppointmentStatus.NO_SHOW,
      reason: 'Flu symptoms',
      symptoms: 'Fever, cough, body aches',
      notes: 'Patient did not show up',
      tokenNumber: 6,
      bookedBy: 'user-receptionist-001',
    },
  ];

  for (const appointmentData of appointments) {
    await prisma.appointment.upsert({
      where: { appointmentNumber: appointmentData.appointmentNumber },
      update: {},
      create: appointmentData,
    });
  }

  console.log(`✅ Seeded ${appointments.length} appointments`);
}
