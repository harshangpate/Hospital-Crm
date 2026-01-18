import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSettings() {
  console.log('🌱 Seeding Settings...');

  const settings = [
    {
      key: 'hospital_name',
      value: 'City General Hospital',
      description: 'Name of the hospital',
    },
    {
      key: 'hospital_address',
      value: '123 Medical Center Drive, Healthcare City, HC 12345',
      description: 'Hospital address',
    },
    {
      key: 'hospital_phone',
      value: '+1-555-HOSPITAL',
      description: 'Main hospital contact number',
    },
    {
      key: 'hospital_email',
      value: 'info@citygeneralhospital.com',
      description: 'Hospital email address',
    },
    {
      key: 'appointment_slot_duration',
      value: '30',
      description: 'Default appointment slot duration in minutes',
    },
    {
      key: 'working_hours_start',
      value: '08:00',
      description: 'Hospital working hours start time',
    },
    {
      key: 'working_hours_end',
      value: '20:00',
      description: 'Hospital working hours end time',
    },
    {
      key: 'emergency_contact',
      value: '+1-555-EMERGENCY',
      description: 'Emergency contact number',
    },
    {
      key: 'currency',
      value: 'USD',
      description: 'Default currency code',
    },
    {
      key: 'tax_rate',
      value: '8',
      description: 'Default tax rate percentage',
    },
    {
      key: 'lab_report_turnaround',
      value: '24',
      description: 'Standard lab report turnaround time in hours',
    },
    {
      key: 'enable_sms_notifications',
      value: 'true',
      description: 'Enable SMS notifications',
    },
    {
      key: 'enable_email_notifications',
      value: 'true',
      description: 'Enable email notifications',
    },
    {
      key: 'appointment_reminder_hours',
      value: '24',
      description: 'Hours before appointment to send reminder',
    },
    {
      key: 'max_appointments_per_day',
      value: '50',
      description: 'Maximum appointments per doctor per day',
    },
  ];

  for (const settingData of settings) {
    await prisma.setting.upsert({
      where: { key: settingData.key },
      update: { value: settingData.value },
      create: settingData,
    });
  }

  console.log(`✅ Seeded ${settings.length} settings`);
}
