import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './email.controller';

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Security: Force role to PATIENT for public registration
    // This prevents unauthorized role escalation
    validatedData.role = 'PATIENT';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        role: validatedData.role,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        gender: validatedData.gender,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create patient record (public registration is always for patients)
    const patientCount = await prisma.patient.count();
    const patientId = `PT-${new Date().getFullYear()}-${String(patientCount + 1).padStart(4, '0')}`;
    
    await prisma.patient.create({
      data: {
        userId: user.id,
        patientId: patientId,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        patient: true,
        doctor: true,
        staff: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(validatedData.password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate temporary token (short-lived, only for 2FA verification)
      const tempToken = generateToken(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        '5m' // 5 minutes expiry
      );

      res.status(200).json({
        success: true,
        message: '2FA required',
        requires2FA: true,
        tempToken,
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Send login alert email in background (don't wait for it)
    setImmediate(async () => {
      try {
        const emailService = require('../services/email.service').default;
        await emailService.sendEmail({
          to: user.email,
          subject: '🔔 New Login to Your Hospital CRM Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
              .icon { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
              .content { padding: 40px 30px; }
              .login-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; color: white; margin: 30px 0; }
              .login-card h2 { margin: 0 0 20px 0; font-size: 22px; }
              .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { font-weight: 600; width: 140px; opacity: 0.9; }
              .detail-value { flex: 1; }
              .success-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px; margin-top: 15px; }
              .info-box { background: #e7f3ff; border-left: 4px solid #2196f3; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; }
              .button-secondary { background: #6c757d; }
              .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h1>🔔 New Login Detected</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                  Hello <strong>${user.firstName} ${user.lastName}</strong>,
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  We detected a new login to your Hospital CRM account. Here are the details:
                </p>
                
                <div class="login-card">
                  <h2>📊 Login Details</h2>
                  <div class="detail-row">
                    <span class="detail-label">⏰ Time</span>
                    <span class="detail-value">${new Date().toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">📧 Email</span>
                    <span class="detail-value">${user.email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">👤 User Role</span>
                    <span class="detail-value">${user.role}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🔐 Authentication</span>
                    <span class="detail-value">Password Only</span>
                  </div>
                  <div class="success-badge">
                    ✓ Login Successful
                  </div>
                </div>
                
                <div class="info-box">
                  <p style="color: #0c5460; margin: 0; font-size: 15px;">
                    <strong>✅ Was this you?</strong> If you just logged in, you can safely ignore this email. 
                    This is just a routine security notification to keep you informed about account activity.
                  </p>
                </div>
                
                <div class="warning-box">
                  <p style="color: #856404; margin: 0 0 15px 0; font-size: 15px;">
                    <strong>⚠️ Didn't log in?</strong> If you didn't perform this login, your account may be compromised. 
                    Take immediate action to secure your account:
                  </p>
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="http://localhost:3000/change-password" class="button">Change Password Now</a>
                    <a href="mailto:security@hospitalcrm.com" class="button button-secondary">Report Security Issue</a>
                  </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">🛡️ Enhance Your Security</h3>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 14px;">
                    Add an extra layer of protection to your account by enabling Two-Factor Authentication (2FA). 
                    With 2FA, even if someone gets your password, they won't be able to access your account.
                  </p>
                  <a href="http://localhost:3000/dashboard/settings" style="color: #667eea; text-decoration: none; font-weight: 600;">
                    Enable 2FA in Settings →
                  </a>
                </div>
              </div>
              
              <div class="footer">
                <p style="color: #333; margin: 5px 0; font-size: 14px; font-weight: 600;">Hospital CRM Security Team</p>
                <p style="color: #6c757d; margin: 5px 0; font-size: 13px;">
                  This is an automated security notification
                </p>
                <p style="color: #6c757d; margin: 15px 0 5px 0; font-size: 12px;">
                  If you have questions, contact us at 
                  <a href="mailto:support@hospitalcrm.com" style="color: #667eea; text-decoration: none;">support@hospitalcrm.com</a>
                </p>
                <p style="color: #999; margin: 20px 0 0 0; font-size: 11px;">
                  © ${new Date().getFullYear()} Hospital CRM. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      } catch (emailError) {
        console.error('Failed to send login alert email:', emailError);
        // Don't fail the login if email fails
      }
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        alternatePhone: true,
        profileImage: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        patient: true,
        doctor: true,
        staff: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(validatedData.currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response): Promise<void> => {
  // In a JWT-based auth, logout is handled on the client side by removing the token
  // But we can log this action
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(400).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    // Generate reset token (random 32 bytes hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed token and expiry to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Create reset URL (send unhashed token to user)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email.',
    });
  } catch (error: any) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message,
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error: any) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// @desc    Verify 2FA and complete login
// @route   POST /api/v1/auth/verify-2fa
// @access  Public (requires tempToken)
export const verify2FALogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, twoFactorCode } = req.body;

    if (!token || !twoFactorCode) {
      res.status(400).json({
        success: false,
        message: 'Temporary token and 2FA code are required',
      });
      return;
    }

    // Verify temp token
    const jwt = require('jsonwebtoken');
    const speakeasy = require('speakeasy');
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired temporary token',
      });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patient: true,
        doctor: true,
        staff: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      res.status(400).json({
        success: false,
        message: '2FA is not enabled for this account',
      });
      return;
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2,
    });

    if (!verified) {
      res.status(401).json({
        success: false,
        message: 'Invalid 2FA code',
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Send login alert email
    try {
      const emailService = require('../services/email.service').default;
      await emailService.sendEmail({
        to: user.email,
        subject: '🔔 New Login to Your Hospital CRM Account (2FA Verified)',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
              .icon { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
              .content { padding: 40px 30px; }
              .login-card { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 12px; padding: 25px; color: white; margin: 30px 0; }
              .login-card h2 { margin: 0 0 20px 0; font-size: 22px; }
              .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { font-weight: 600; width: 140px; opacity: 0.9; }
              .detail-value { flex: 1; }
              .security-badge { display: inline-block; background: rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 15px; font-weight: 600; }
              .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .button { display: inline-block; padding: 14px 32px; background: #dc3545; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; }
              .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                </div>
                <h1>🔒 Secure Login Detected</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                  Hello <strong>${user.firstName} ${user.lastName}</strong>,
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                  We detected a new secure login to your Hospital CRM account with 2FA verification:
                </p>
                
                <div class="login-card">
                  <h2>🔐 Secure Login Details</h2>
                  <div class="detail-row">
                    <span class="detail-label">⏰ Time</span>
                    <span class="detail-value">${new Date().toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">📧 Email</span>
                    <span class="detail-value">${user.email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">👤 User Role</span>
                    <span class="detail-value">${user.role}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🔐 Authentication</span>
                    <span class="detail-value">Password + 2FA Code</span>
                  </div>
                  <div class="security-badge">
                    ✓ Two-Factor Authentication Verified
                  </div>
                </div>
                
                <div class="success-box">
                  <p style="color: #155724; margin: 0; font-size: 15px;">
                    <strong>🛡️ Extra Secure Login!</strong> This login was verified with Two-Factor Authentication, 
                    providing maximum security for your account. Your account and patient data remain protected 
                    with military-grade security.
                  </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h3 style="margin: 0 0 10px 0; color: #28a745; font-size: 20px;">✓ You're Protected</h3>
                  <p style="color: #555; margin: 0; font-size: 14px;">
                    With 2FA enabled, your account has the highest level of security. 
                    Even if someone knows your password, they can't access your account without the authenticator code.
                  </p>
                </div>
                
                <div class="warning-box">
                  <p style="color: #856404; margin: 0 0 15px 0; font-size: 15px;">
                    <strong>⚠️ Didn't log in?</strong> If you didn't perform this login, someone may have accessed 
                    your authenticator app. Take immediate action:
                  </p>
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="http://localhost:3000/change-password" class="button">Change Password Now</a>
                    <a href="mailto:security@hospitalcrm.com" class="button" style="background: #6c757d;">Report Security Issue</a>
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                  This is an automated security notification to keep you informed about your account activity.
                </p>
              </div>
              
              <div class="footer">
                <p style="color: #333; margin: 5px 0; font-size: 14px; font-weight: 600;">Hospital CRM Security Team</p>
                <p style="color: #6c757d; margin: 5px 0; font-size: 13px;">
                  Protecting your data with industry-leading security
                </p>
                <p style="color: #6c757d; margin: 15px 0 5px 0; font-size: 12px;">
                  Questions? Contact us at 
                  <a href="mailto:support@hospitalcrm.com" style="color: #11998e; text-decoration: none;">support@hospitalcrm.com</a>
                </p>
                <p style="color: #999; margin: 20px 0 0 0; font-size: 11px;">
                  © ${new Date().getFullYear()} Hospital CRM. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send login alert email:', emailError);
      // Don't fail the login if email fails
    }

    // Generate full token
    const fullToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password, twoFactorSecret, ...userWithoutSensitiveData } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutSensitiveData,
        token: fullToken,
      },
    });
  } catch (error: any) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA',
      error: error.message,
    });
  }
};
