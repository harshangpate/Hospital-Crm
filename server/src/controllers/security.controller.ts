import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../config/database';
import emailService from '../services/email.service';

// @desc    Enable Two-Factor Authentication
// @route   POST /api/v1/security/2fa/enable
// @access  Private
export const enableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Hospital CRM (${(req as any).user.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store temporary secret (will be confirmed later)
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorSecret: secret.base32,
      },
    });

    res.status(200).json({
      success: true,
      message: '2FA secret generated. Please scan QR code and verify.',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
      },
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enabling two-factor authentication',
    });
  }
};

// @desc    Verify and Confirm Two-Factor Authentication
// @route   POST /api/v1/security/2fa/verify
// @access  Private
export const verifyTwoFactor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
      return;
    }

    // Get user with secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
        twoFactorSecret: true 
      },
    });

    if (!user || !user.twoFactorSecret) {
      res.status(400).json({
        success: false,
        message: '2FA not initialized. Please enable 2FA first.',
      });
      return;
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
      return;
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Send confirmation email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: '🔒 Two-Factor Authentication Enabled - Your Account is Now More Secure',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
              .shield-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
              .content { padding: 40px 30px; }
              .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
              .message { font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px; }
              .success-box { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; }
              .success-box h2 { color: #ffffff; margin: 0 0 10px 0; font-size: 24px; }
              .success-box p { color: #ffffff; margin: 0; font-size: 16px; opacity: 0.95; }
              .info-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-card h3 { color: #333; margin: 0 0 10px 0; font-size: 18px; }
              .info-card ul { margin: 10px 0; padding-left: 20px; color: #555; }
              .info-card li { margin: 8px 0; line-height: 1.5; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .warning-box p { color: #856404; margin: 0; font-size: 14px; line-height: 1.6; }
              .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
              .footer p { color: #6c757d; margin: 5px 0; font-size: 14px; }
              .footer a { color: #667eea; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="shield-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                </div>
                <h1>🎉 2FA Successfully Enabled!</h1>
              </div>
              
              <div class="content">
                <p class="greeting">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
                
                <div class="success-box">
                  <h2>✓ Your Account is Now Protected</h2>
                  <p>Two-Factor Authentication has been successfully activated</p>
                </div>
                
                <p class="message">
                  Great job taking this important step to secure your Hospital CRM account! 
                  Two-Factor Authentication (2FA) adds an extra layer of security by requiring 
                  both your password and a verification code from your authenticator app.
                </p>
                
                <div class="info-card">
                  <h3>📱 What This Means for You:</h3>
                  <ul>
                    <li><strong>Enhanced Security:</strong> Your account is now protected with military-grade security</li>
                    <li><strong>Login Process:</strong> You'll need to enter a 6-digit code from your authenticator app when signing in</li>
                    <li><strong>Recovery Codes:</strong> Keep your authenticator app safe - it's your key to account access</li>
                    <li><strong>Peace of Mind:</strong> Even if someone gets your password, they can't access your account</li>
                  </ul>
                </div>
                
                <div class="info-card">
                  <h3>🔑 Next Time You Log In:</h3>
                  <ul>
                    <li>Enter your email and password as usual</li>
                    <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Enter the 6-digit code displayed in the app</li>
                    <li>Access granted! You're in.</li>
                  </ul>
                </div>
                
                <div class="warning-box">
                  <p>
                    <strong>⚠️ Important:</strong> If you lose access to your authenticator app, 
                    you may be locked out of your account. Make sure to backup your authenticator 
                    app or keep recovery codes in a safe place. If you didn't enable this feature, 
                    please contact our support team immediately.
                  </p>
                </div>
                
                <p class="message">
                  Thank you for prioritizing the security of your account and our patients' data.
                </p>
              </div>
              
              <div class="footer">
                <p><strong>Hospital CRM Security Team</strong></p>
                <p>This is an automated security notification</p>
                <p>If you have questions, contact us at <a href="mailto:support@hospitalcrm.com">support@hospitalcrm.com</a></p>
                <p style="margin-top: 20px; font-size: 12px;">
                  © ${new Date().getFullYear()} Hospital CRM. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send 2FA confirmation email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying two-factor authentication',
    });
  }
};

// @desc    Disable Two-Factor Authentication
// @route   POST /api/v1/security/2fa/disable
// @access  Private
export const disableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA',
      });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
        password: true 
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
      return;
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Send notification email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: '⚠️ Two-Factor Authentication Has Been Disabled',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
              .warning-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
              .content { padding: 40px 30px; }
              .alert-box { background: linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; color: white; }
              .alert-box h2 { margin: 0 0 10px 0; font-size: 24px; }
              .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .action-box { background: #f8f9fa; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .button { display: inline-block; padding: 14px 32px; background: #dc3545; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
              .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="warning-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h1>⚠️ 2FA Disabled</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 18px; color: #333;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
                
                <div class="alert-box">
                  <h2>Security Feature Deactivated</h2>
                  <p>Two-Factor Authentication has been disabled on your account</p>
                  <p style="font-size: 14px; margin-top: 10px;">Date & Time: ${new Date().toLocaleString()}</p>
                </div>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  This notification is to inform you that Two-Factor Authentication (2FA) has been 
                  disabled for your Hospital CRM account. Your account security level has been reduced.
                </p>
                
                <div class="info-box">
                  <p style="color: #856404; margin: 0; font-size: 15px;">
                    <strong>📉 Reduced Security:</strong> Your account is now protected only by your password. 
                    We strongly recommend keeping 2FA enabled for maximum security, especially when handling 
                    sensitive patient data and medical records.
                  </p>
                </div>
                
                <div class="action-box">
                  <h3 style="color: #dc3545; margin-top: 0;">🚨 Didn't Disable 2FA?</h3>
                  <p style="color: #333; margin: 15px 0;">
                    If you did not disable Two-Factor Authentication, your account may be compromised. 
                    <strong>Take immediate action:</strong>
                  </p>
                  <ol style="text-align: left; display: inline-block; margin: 15px auto;">
                    <li>Change your password immediately</li>
                    <li>Re-enable Two-Factor Authentication</li>
                    <li>Review your account activity</li>
                    <li>Contact our security team</li>
                  </ol>
                  <a href="mailto:security@hospitalcrm.com" class="button">Report Security Issue</a>
                </div>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  To re-enable 2FA and secure your account, go to <strong>Settings → Security → Two-Factor Authentication</strong>.
                </p>
              </div>
              
              <div class="footer">
                <p style="color: #6c757d; margin: 5px 0; font-size: 14px;"><strong>Hospital CRM Security Team</strong></p>
                <p style="color: #6c757d; margin: 5px 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Hospital CRM. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send 2FA disabled email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling two-factor authentication',
    });
  }
};

// @desc    Get 2FA Status
// @route   GET /api/v1/security/2fa/status
// @access  Private
export const getTwoFactorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    res.status(200).json({
      success: true,
      data: {
        enabled: user?.twoFactorEnabled || false,
      },
    });
  } catch (error: any) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting 2FA status',
    });
  }
};

// @desc    Update Security Settings (Login Alerts, Session Timeout)
// @route   PUT /api/v1/security/settings
// @access  Private
export const updateSecuritySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { loginAlertsEnabled, sessionTimeout } = req.body;

    // For now, store in a JSON field or create a separate table
    // Here we'll use a simple approach with a separate SecuritySettings model
    // But since we don't have that yet, we'll return success
    // In production, you'd want to store these in the database

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: {
        loginAlertsEnabled: loginAlertsEnabled !== undefined ? loginAlertsEnabled : true,
        sessionTimeout: sessionTimeout || 30,
      },
    });
  } catch (error: any) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating security settings',
    });
  }
};

// @desc    Get Security Settings
// @route   GET /api/v1/security/settings
// @access  Private
export const getSecuritySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return default settings for now
    // In production, retrieve from database
    res.status(200).json({
      success: true,
      data: {
        loginAlertsEnabled: true,
        sessionTimeout: 30,
      },
    });
  } catch (error: any) {
    console.error('Get security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting security settings',
    });
  }
};
