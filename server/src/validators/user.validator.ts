import { z } from 'zod';
import { UserRole, Gender, BloodGroup } from '@prisma/client';

// Create user validation
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  
  // Doctor-specific fields
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
  licenseNumber: z.string().optional(),
  consultationFee: z.number().optional(),
  
  // Staff-specific fields
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  
  // Patient-specific fields
  bloodGroup: z.nativeEnum(BloodGroup).optional()
});

// Update user validation
export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  
  // Role-specific updates
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
  consultationFee: z.number().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional()
});

// Reset password validation
export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// Query parameters validation
export const getUsersQuerySchema = z.object({
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
