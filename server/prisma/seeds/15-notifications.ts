import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedNotifications() {
  console.log('🌱 Seeding Notifications...');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const notifications = [
    {
      userId: 'user-patient-001',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah Johnson is scheduled for tomorrow at 10:00 AM',
      type: 'APPOINTMENT',
      isRead: false,
      linkText: 'View Appointment',
      linkUrl: '/dashboard/appointments',
    },
    {
      userId: 'user-patient-001',
      title: 'Lab Results Ready',
      message: 'Your ECG and blood test results are now available',
      type: 'LAB_RESULT',
      isRead: true,
      readAt: yesterday,
      linkText: 'View Results',
      linkUrl: '/dashboard/lab-tests',
    },
    {
      userId: 'user-doctor-001',
      title: 'New Appointment Booked',
      message: 'John Doe has booked an appointment with you for tomorrow at 14:00',
      type: 'APPOINTMENT',
      isRead: false,
      linkText: 'View Schedule',
      linkUrl: '/dashboard/appointments',
    },
    {
      userId: 'user-doctor-001',
      title: 'Patient Admitted',
      message: 'John Doe has been admitted to ICU - Bed 01',
      type: 'ADMISSION',
      isRead: true,
      readAt: yesterday,
      linkText: 'View Details',
      linkUrl: '/dashboard/ipd',
    },
    {
      userId: 'user-patient-002',
      title: 'Prescription Ready',
      message: 'Your prescription is ready for pickup at the pharmacy',
      type: 'PRESCRIPTION',
      isRead: false,
      linkText: 'View Prescription',
      linkUrl: '/dashboard/prescriptions',
    },
    {
      userId: 'user-patient-003',
      title: 'Invoice Generated',
      message: 'Your invoice #INV001 for $1,250 is now available',
      type: 'BILLING',
      isRead: false,
      linkText: 'View Invoice',
      linkUrl: '/dashboard/billing',
    },
    {
      userId: 'user-pharmacist-001',
      title: 'Low Stock Alert',
      message: 'Metformin stock is running low. Current quantity: 85 units',
      type: 'INVENTORY',
      isRead: false,
      linkText: 'View Inventory',
      linkUrl: '/dashboard/pharmacy',
    },
    {
      userId: 'user-lab-001',
      title: 'Urgent Test Ordered',
      message: 'Dr. Sarah Johnson has ordered urgent blood work for patient PAT001',
      type: 'LAB_TEST',
      isRead: false,
      linkText: 'View Test',
      linkUrl: '/dashboard/lab-tests',
    },
    {
      userId: 'user-receptionist-001',
      title: 'Appointment Cancelled',
      message: 'William Jones has cancelled appointment APT013',
      type: 'APPOINTMENT',
      isRead: true,
      readAt: twoDaysAgo,
      linkText: 'View Details',
      linkUrl: '/dashboard/appointments',
    },
    {
      userId: 'user-patient-005',
      title: 'Checkup Due',
      message: 'Your annual health checkup is due. Please schedule an appointment',
      type: 'REMINDER',
      isRead: false,
      linkText: 'Book Appointment',
      linkUrl: '/dashboard/appointments/book',
    },
  ];

  for (const notificationData of notifications) {
    await prisma.notification.create({
      data: notificationData,
    });
  }

  console.log(`✅ Seeded ${notifications.length} notifications`);
}
