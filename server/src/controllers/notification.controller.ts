import { Request, Response } from 'express';
import prisma from '../config/database';
import emailService from '../services/email.service';

// Get user notification preferences
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPreferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Default preferences if not set
    const defaultPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      prescriptionAlerts: true,
      labResultAlerts: true,
      billingAlerts: true,
      lowStockAlerts: true,
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences },
    });

    res.json({ success: true, message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};

// Get user notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// Send notification (internal helper function)
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  linkText?: string,
  linkUrl?: string
) => {
  try {
    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkText,
        linkUrl,
      },
    });

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        notificationPreferences: true,
      },
    });

    if (!user) return;

    const preferences = user.notificationPreferences as any || {};

    // Send email notification if enabled
    if (preferences.emailNotifications !== false) {
      const shouldSendEmail = 
        (type === 'APPOINTMENT' && preferences.appointmentReminders !== false) ||
        (type === 'PRESCRIPTION' && preferences.prescriptionAlerts !== false) ||
        (type === 'LAB_RESULT' && preferences.labResultAlerts !== false) ||
        (type === 'BILLING' && preferences.billingAlerts !== false) ||
        (type === 'INVENTORY' && preferences.lowStockAlerts !== false) ||
        type === 'GENERAL';

      if (shouldSendEmail) {
        await sendEmailNotification(user.email, user.firstName, title, message, linkText, linkUrl);
      }
    }

    // TODO: Send SMS notification if enabled and phone number exists
    // if (preferences.smsNotifications && user.phone) {
    //   await sendSMSNotification(user.phone, message);
    // }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to send email notification
const sendEmailNotification = async (
  email: string,
  firstName: string,
  title: string,
  message: string,
  linkText?: string,
  linkUrl?: string
) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            margin: 0;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .greeting {
            font-size: 18px;
            color: #111827;
            margin-bottom: 20px;
          }
          .message-box {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .message-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 10px 0;
          }
          .message-text {
            color: #4b5563;
            margin: 0;
            line-height: 1.6;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔔</div>
            <h1 class="title">Hospital CRM Notification</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${firstName},</p>
            
            <div class="message-box">
              <h2 class="message-title">${title}</h2>
              <p class="message-text">${message}</p>
            </div>
            
            ${linkUrl && linkText ? `
              <div class="button-container">
                <a href="${linkUrl}" class="button">${linkText}</a>
              </div>
            ` : ''}
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automated notification from Hospital CRM. Please log in to your account to view more details.
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              <strong>Hospital CRM</strong><br>
              Healthcare Management System
            </p>
            <p class="footer-text">
              Questions? <a href="mailto:support@hospitalcrm.com" class="footer-link">Contact Support</a>
            </p>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
              You're receiving this email because you have notifications enabled in your account settings.<br>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings" class="footer-link">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to: email,
      subject: title,
      html: html,
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

// TODO: SMS Service Integration (Twilio example)
// Uncomment and configure when you have Twilio credentials
/*
import twilio from 'twilio';

const sendSMSNotification = async (phone: string, message: string) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
};
*/
