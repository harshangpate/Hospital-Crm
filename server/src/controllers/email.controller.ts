import { Request, Response } from 'express';
import emailService from '../services/email.service';

// Test email endpoint
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    // Send test appointment confirmation email
    const success = await emailService.sendAppointmentConfirmation(email, {
      patientName: 'John Doe',
      doctorName: 'Sarah Johnson',
      appointmentNumber: 'APT-2025-TEST001',
      appointmentDate: 'Monday, October 28, 2025',
      appointmentTime: '10:00 AM',
      appointmentType: 'NEW CONSULTATION',
      doctorSpecialization: 'Cardiology',
      consultationFee: 250,
      hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
      hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center, Healthcare City',
    });

    if (success) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check server logs for details.',
      });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email',
    });
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (email: string, name: string, role: string): Promise<boolean> => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Welcome to Hospital CRM!</h1>
            <p>Your account has been successfully created</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Welcome to Hospital CRM! Your account has been created with the role of <strong>${role}</strong>.</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Getting Started</h3>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile information</li>
                <li>Explore the dashboard features</li>
                <li>Access relevant tools for your role</li>
                <li>Contact support if you need assistance</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                Go to Dashboard
              </a>
            </div>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>🔐 Security Tip:</strong> Keep your login credentials secure and change your password regularly.
            </div>
          </div>
          
          <div class="footer">
            <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: 'Welcome to Hospital CRM!',
      html,
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Reset your password</p>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">
                Reset Password
              </a>
            </div>
            
            <div class="card">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="margin: 10px 0 0 0; word-break: break-all; font-size: 12px; color: #3b82f6;">${resetLink}</p>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p>If you have any issues, contact us at ${process.env.EMAIL_USER}</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: 'Password Reset Request - Hospital CRM',
      html,
    });
  } catch (error) {
    console.error('Password reset email error:', error);
    return false;
  }
};

// Send user account status notification
export const sendUserStatusEmail = async (email: string, name: string, isActive: boolean): Promise<boolean> => {
  try {
    const status = isActive ? 'Activated' : 'Deactivated';
    const color = isActive ? '#10b981' : '#ef4444';
    const message = isActive 
      ? 'Your account has been activated. You can now log in and access all features.'
      : 'Your account has been deactivated. Please contact the administrator for more information.';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${color} 0%, ${color} 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isActive ? '✅' : '❌'} Account ${status}</h1>
            <p>Your account status has changed</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Account Status Update</h3>
              <p>${message}</p>
            </div>
            
            ${isActive ? `
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Login Now
              </a>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailService.sendEmail({
      to: email,
      subject: `Account ${status} - Hospital CRM`,
      html,
    });
  } catch (error) {
    console.error('User status email error:', error);
    return false;
  }
};

// Send bulk emails with template selection
export const sendBulkEmail = async (req: Request, res: Response) => {
  try {
    const { recipients, template, subject, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required',
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Template selection is required',
      });
    }

    // For custom template, require subject and message
    if (template === 'custom' && (!subject || !message)) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required for custom emails',
      });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Send emails to all recipients
    for (const email of recipients) {
      try {
        let success = false;

        switch (template) {
          case 'appointment-confirmation':
            success = await emailService.sendAppointmentConfirmation(email, {
              patientName: 'Patient',
              doctorName: 'Doctor',
              appointmentNumber: 'APT-BULK-001',
              appointmentDate: new Date().toLocaleDateString(),
              appointmentTime: '10:00 AM',
              appointmentType: 'CONSULTATION',
              doctorSpecialization: 'General',
              consultationFee: 0,
              hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
              hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center',
            });
            break;

          case 'appointment-reminder':
            success = await emailService.sendAppointmentReminder(email, {
              patientName: 'Patient',
              doctorName: 'Doctor',
              appointmentNumber: 'APT-BULK-001',
              appointmentDate: new Date().toLocaleDateString(),
              appointmentTime: '10:00 AM',
              appointmentType: 'CONSULTATION',
              doctorSpecialization: 'General',
              consultationFee: 0,
              hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
              hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center',
            });
            break;

          case 'appointment-cancellation':
            success = await emailService.sendAppointmentCancellation(email, {
              patientName: 'Patient',
              doctorName: 'Doctor',
              appointmentNumber: 'APT-BULK-001',
              appointmentDate: new Date().toLocaleDateString(),
              appointmentTime: '10:00 AM',
              appointmentType: 'CONSULTATION',
              doctorSpecialization: 'General',
              consultationFee: 0,
              reason: 'Administrative reason',
              hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
              hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center',
            });
            break;

          case 'appointment-rescheduled':
            success = await emailService.sendAppointmentRescheduled(email, {
              patientName: 'Patient',
              doctorName: 'Doctor',
              appointmentNumber: 'APT-BULK-001',
              appointmentDate: new Date().toLocaleDateString(),
              appointmentTime: '2:00 PM',
              appointmentType: 'CONSULTATION',
              doctorSpecialization: 'General',
              consultationFee: 0,
              hospitalName: process.env.HOSPITAL_NAME || 'Hospital CRM',
              hospitalAddress: process.env.HOSPITAL_ADDRESS || '123 Medical Center',
              reason: `Rescheduled from ${new Date().toLocaleDateString()} 10:00 AM`,
            });
            break;

          case 'welcome':
            success = await sendWelcomeEmail(email, 'User', 'USER');
            break;

          case 'password-reset':
            success = await sendPasswordResetEmail(email, 'reset-token-123');
            break;

          case 'account-status':
            success = await sendUserStatusEmail(email, 'User', true);
            break;

          case 'custom':
            success = await emailService.sendEmail({
              to: email,
              subject: subject || 'Notification',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>${process.env.HOSPITAL_NAME || 'Hospital CRM'}</h1>
                    </div>
                    <div class="content">
                      <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="footer">
                      <p>This is an automated email from ${process.env.HOSPITAL_NAME || 'Hospital CRM'}</p>
                      <p>Please do not reply to this email.</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });
            break;

          default:
            errors.push(`Unknown template: ${template}`);
            continue;
        }

        if (success) {
          successCount++;
        } else {
          failCount++;
          errors.push(`Failed to send to ${email}`);
        }
      } catch (error: any) {
        failCount++;
        errors.push(`Error sending to ${email}: ${error.message}`);
      }
    }

    return res.json({
      success: successCount > 0,
      message: `Sent ${successCount} email(s) successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      data: {
        total: recipients.length,
        success: successCount,
        failed: failCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Only show first 5 errors
      },
    });
  } catch (error: any) {
    console.error('Bulk email error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send bulk emails',
    });
  }
};
