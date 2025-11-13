import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { sendWelcomeEmail, sendUserStatusEmail } from './email.controller';

// Get all users with filters
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      role,
      status,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (role && role !== 'ALL') {
      where.role = role as UserRole;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get users with related data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc'
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
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
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          patient: {
            select: {
              id: true,
              patientId: true,
              bloodGroup: true,
              registrationDate: true
            }
          },
          doctor: {
            select: {
              id: true,
              doctorId: true,
              specialization: true,
              qualification: true,
              experience: true,
              licenseNumber: true,
              consultationFee: true,
              department: true,
              designation: true
            }
          },
          staff: {
            select: {
              staffId: true,
              department: true,
              designation: true,
              joiningDate: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
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
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        patient: true,
        doctor: true,
        staff: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Get current user's profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // Changed from userId to id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
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
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        patient: true,
        doctor: true,
        staff: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update current user's profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // Changed from userId to id
    const {
      firstName,
      lastName,
      phone,
      alternatePhone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      pincode,
      profileImage
    } = req.body;

    // Build update data object (only include provided fields)
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (alternatePhone !== undefined) updateData.alternatePhone = alternatePhone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
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
        updatedAt: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Create new user (Admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      // Role-specific fields
      specialization,
      qualification,
      experience,
      licenseNumber,
      consultationFee,
      department,
      designation,
      joiningDate,
      bloodGroup
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate role-specific ID
    let roleSpecificData: any = {};
    
    if (role === 'DOCTOR') {
      const doctorCount = await prisma.doctor.count();
      const doctorId = `DR-${new Date().getFullYear()}-${String(doctorCount + 1).padStart(4, '0')}`;
      
      roleSpecificData.doctor = {
        create: {
          doctorId,
          specialization: specialization || 'General Medicine',
          qualification: qualification || 'MBBS',
          experience: experience || 0,
          licenseNumber: licenseNumber || `LIC-${Date.now()}`,
          consultationFee: consultationFee || 500,
          department: department || 'General',
          designation: designation || 'Doctor'
        }
      };
    } else if (role === 'PATIENT') {
      const patientCount = await prisma.patient.count();
      const patientId = `PT-${new Date().getFullYear()}-${String(patientCount + 1).padStart(4, '0')}`;
      
      roleSpecificData.patient = {
        create: {
          patientId,
          bloodGroup: bloodGroup || null
        }
      };
    } else if (['NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'ACCOUNTANT'].includes(role)) {
      const staffCount = await prisma.staff.count();
      const staffId = `ST-${new Date().getFullYear()}-${String(staffCount + 1).padStart(4, '0')}`;
      
      roleSpecificData.staff = {
        create: {
          staffId,
          department: department || 'General',
          designation: designation || role,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date()
        }
      };
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as UserRole,
        firstName,
        lastName,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        ...roleSpecificData
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        patient: true,
        doctor: true,
        staff: true
      }
    });

    // Send welcome email (non-blocking)
    const fullName = `${firstName} ${lastName}`;
    sendWelcomeEmail(email, fullName, role)
      .catch((err: any) => console.error('Failed to send welcome email:', err));

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      alternatePhone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      // Role-specific updates
      specialization,
      qualification,
      experience,
      consultationFee,
      department,
      designation,
      bloodGroup
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { doctor: true, patient: true, staff: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user basic info
    const updateData: any = {
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      phone: phone || existingUser.phone,
      alternatePhone: alternatePhone || existingUser.alternatePhone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth,
      gender: gender || existingUser.gender,
      address: address || existingUser.address,
      city: city || existingUser.city,
      state: state || existingUser.state,
      pincode: pincode || existingUser.pincode
    };

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Update role-specific data
    if (existingUser.role === 'DOCTOR' && existingUser.doctor) {
      await prisma.doctor.update({
        where: { userId: id },
        data: {
          specialization: specialization || existingUser.doctor.specialization,
          qualification: qualification || existingUser.doctor.qualification,
          experience: experience || existingUser.doctor.experience,
          consultationFee: consultationFee || existingUser.doctor.consultationFee,
          department: department || existingUser.doctor.department,
          designation: designation || existingUser.doctor.designation
        }
      });
    } else if (existingUser.role === 'PATIENT' && existingUser.patient) {
      await prisma.patient.update({
        where: { userId: id },
        data: {
          bloodGroup: bloodGroup || existingUser.patient.bloodGroup
        }
      });
    } else if (existingUser.staff) {
      await prisma.staff.update({
        where: { userId: id },
        data: {
          department: department || existingUser.staff.department,
          designation: designation || existingUser.staff.designation
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    // Send status change email (non-blocking)
    const fullName = `${updatedUser.firstName} ${updatedUser.lastName}`;
    sendUserStatusEmail(updatedUser.email, fullName, updatedUser.isActive)
      .catch((err: any) => console.error('Failed to send status change email:', err));

    return res.status(200).json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Delete user (soft delete by deactivating)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalDoctors,
      totalPatients,
      totalStaff,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.user.count({
        where: {
          role: {
            in: ['NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'ACCOUNTANT']
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalDoctors,
        totalPatients,
        totalStaff,
        recentUsers
      }
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};
