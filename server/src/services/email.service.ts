import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface AppointmentEmailData {
  patientName: string;
  doctorName: string;
  appointmentNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  doctorSpecialization: string;
  consultationFee: number;
  hospitalName: string;
  hospitalAddress: string;
  reason?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter with environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send generic email
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Hospital CRM'}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Appointment Confirmation Email
  async sendAppointmentConfirmation(email: string, data: AppointmentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Appointment Confirmed!</h1>
            <p>Your appointment has been successfully scheduled</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.patientName}</strong>,</p>
            
            <p>Your appointment has been confirmed. Here are the details:</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Appointment Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Appointment Number:</span>
                <span class="detail-value"><strong>${data.appointmentNumber}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${data.appointmentType}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Consultation Fee:</span>
                <span class="detail-value"><strong>$${data.consultationFee}</strong></span>
              </div>
            </div>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Doctor Information</h3>
              
              <div class="detail-row">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">Dr. ${data.doctorName}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Specialization:</span>
                <span class="detail-value">${data.doctorSpecialization}</span>
              </div>
            </div>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Hospital Location</h3>
              <p style="margin: 0;"><strong>${data.hospitalName}</strong></p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">${data.hospitalAddress}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/appointments" class="button">
                View Appointment
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>⏰ Important:</strong> Please arrive 15 minutes before your scheduled time.
            </div>
          </div>
          
          <div class="footer">
            <p>If you need to reschedule or cancel, please log in to your account.</p>
            <p style="margin: 10px 0;">Questions? Contact us at ${process.env.EMAIL_USER}</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Appointment Confirmed - ${data.appointmentNumber}`,
      html,
    });
  }

  // Appointment Reminder Email (24 hours before)
  async sendAppointmentReminder(email: string, data: AppointmentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Appointment Reminder</h1>
            <p>Your appointment is tomorrow!</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.patientName}</strong>,</p>
            
            <p>This is a friendly reminder about your upcoming appointment:</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Tomorrow's Appointment</h3>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value"><strong>${data.appointmentDate}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value"><strong>${data.appointmentTime}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">Dr. ${data.doctorName}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${data.hospitalName}</span>
              </div>
            </div>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>📋 Please bring:</strong>
              <ul style="margin: 10px 0;">
                <li>Valid ID proof</li>
                <li>Previous medical records (if any)</li>
                <li>Insurance card</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/appointments" class="button">
                View Appointment
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Need to reschedule? Log in to your account to make changes.</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated reminder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Reminder: Appointment Tomorrow - ${data.appointmentNumber}`,
      html,
    });
  }

  // Appointment Cancellation Email
  async sendAppointmentCancellation(email: string, data: AppointmentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Cancelled</h1>
            <p>Your appointment has been cancelled</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.patientName}</strong>,</p>
            
            <p>Your appointment has been cancelled as per your request.</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">Cancelled Appointment</h3>
              
              <div class="detail-row">
                <span class="detail-label">Appointment Number:</span>
                <span class="detail-value">${data.appointmentNumber}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">Dr. ${data.doctorName}</span>
              </div>
            </div>
            
            ${data.reason ? `
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>Reason:</strong>
              <p style="margin: 10px 0 0 0;">${data.reason}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/appointments/book" class="button">
                Book New Appointment
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>We hope to see you again soon. Feel free to book a new appointment anytime.</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Appointment Cancelled - ${data.appointmentNumber}`,
      html,
    });
  }

  // Appointment Rescheduled Email
  async sendAppointmentRescheduled(email: string, data: AppointmentEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Appointment Rescheduled</h1>
            <p>Your appointment has been moved to a new time</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.patientName}</strong>,</p>
            
            <p>Your appointment has been successfully rescheduled.</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #111827;">New Appointment Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Appointment Number:</span>
                <span class="detail-value">${data.appointmentNumber}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">New Date:</span>
                <span class="detail-value"><strong>${data.appointmentDate}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">New Time:</span>
                <span class="detail-value"><strong>${data.appointmentTime}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Doctor:</span>
                <span class="detail-value">Dr. ${data.doctorName}</span>
              </div>
              
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${data.appointmentType}</span>
              </div>
            </div>
            
            ${data.reason ? `
            <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>Reason for Rescheduling:</strong>
              <p style="margin: 10px 0 0 0;">${data.reason}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/appointments" class="button">
                View Appointment
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>⏰ Reminder:</strong> Please arrive 15 minutes before your new scheduled time.
            </div>
          </div>
          
          <div class="footer">
            <p>If this change doesn't work for you, please contact us.</p>
            <p style="color: #9ca3af; font-size: 12px;">This is an automated email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Appointment Rescheduled - ${data.appointmentNumber}`,
      html,
    });
  }
}

export default new EmailService();
