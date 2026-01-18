import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAuditLogs() {
  console.log('🌱 Seeding Audit Logs...');

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const auditLogs = [
    {
      userId: 'user-superadmin-001',
      action: 'LOGIN',
      entity: 'User',
      entityId: 'user-superadmin-001',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      createdAt: now,
    },
    {
      userId: 'user-receptionist-001',
      action: 'CREATE',
      entity: 'Appointment',
      entityId: 'APT010',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      createdAt: oneHourAgo,
      newValues: JSON.stringify({
        patientId: 'patient-010',
        doctorId: 'doctor-005',
        appointmentDate: '2026-01-10',
        appointmentTime: '08:30',
      }),
    },
    {
      userId: 'user-doctor-001',
      action: 'UPDATE',
      entity: 'MedicalRecord',
      entityId: 'record-001',
      ipAddress: '192.168.1.110',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/16.0',
      createdAt: twoHoursAgo,
      oldValues: JSON.stringify({ diagnosis: 'Chest pain - under investigation' }),
      newValues: JSON.stringify({ diagnosis: 'Acute myocardial infarction' }),
    },
    {
      userId: 'user-pharmacist-001',
      action: 'UPDATE',
      entity: 'Prescription',
      entityId: 'prescription-001',
      ipAddress: '192.168.1.115',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
      createdAt: yesterday,
      oldValues: JSON.stringify({ status: 'ISSUED' }),
      newValues: JSON.stringify({ status: 'DISPENSED' }),
    },
    {
      userId: 'user-lab-001',
      action: 'UPDATE',
      entity: 'LabTest',
      entityId: 'lab-001',
      ipAddress: '192.168.1.120',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
      createdAt: yesterday,
      oldValues: JSON.stringify({ status: 'IN_PROGRESS' }),
      newValues: JSON.stringify({ status: 'COMPLETED', results: 'Normal sinus rhythm' }),
    },
    {
      userId: 'user-admin-001',
      action: 'CREATE',
      entity: 'User',
      entityId: 'user-patient-010',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      createdAt: yesterday,
      newValues: JSON.stringify({
        email: 'barbara.rodriguez@email.com',
        role: 'PATIENT',
        firstName: 'Barbara',
        lastName: 'Rodriguez',
      }),
    },
    {
      userId: 'user-receptionist-001',
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: 'APT013',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      createdAt: yesterday,
      oldValues: JSON.stringify({ status: 'SCHEDULED' }),
      newValues: JSON.stringify({ status: 'CANCELLED', cancellationReason: 'Patient had to travel' }),
    },
    {
      userId: 'user-doctor-002',
      action: 'CREATE',
      entity: 'Prescription',
      entityId: 'prescription-002',
      ipAddress: '192.168.1.112',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/16.0',
      createdAt: yesterday,
      newValues: JSON.stringify({
        patientId: 'patient-003',
        medications: ['Metformin 500mg'],
      }),
    },
  ];

  for (const logData of auditLogs) {
    await prisma.auditLog.create({
      data: logData,
    });
  }

  console.log(`✅ Seeded ${auditLogs.length} audit logs`);
}
