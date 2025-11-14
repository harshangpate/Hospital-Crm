import apiClient from '../api-client';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  firstName: string;
  lastName: string;
  phone?: string;
  alternatePhone?: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  patient?: any;
  doctor?: any;
  staff?: any;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Role-specific fields
  specialization?: string;
  qualification?: string;
  experience?: number;
  licenseNumber?: string;
  consultationFee?: number;
  department?: string;
  designation?: string;
  joiningDate?: string;
  bloodGroup?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Role-specific
  specialization?: string;
  qualification?: string;
  experience?: number;
  consultationFee?: number;
  department?: string;
  designation?: string;
  bloodGroup?: string;
}

export interface UsersQuery {
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Get all users with filters
export const getAllUsers = async (query?: UsersQuery) => {
  try {
    const params = new URLSearchParams();
    
    if (query?.role) params.append('role', query.role);
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiClient.get(`/users?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch users'
    };
  }
};

// Get user by ID
export const getUserById = async (id: string) => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch user'
    };
  }
};

// Create new user
export const createUser = async (userData: CreateUserData) => {
  try {
    const response = await apiClient.post('/users', userData);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create user'
    };
  }
};

// Update user
export const updateUser = async (id: string, userData: UpdateUserData) => {
  try {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update user'
    };
  }
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (id: string) => {
  try {
    const response = await apiClient.patch(`/users/${id}/status`);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update user status'
    };
  }
};

// Delete user
export const deleteUser = async (id: string) => {
  try {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete user'
    };
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    // Call the backend stats endpoint instead of calculating client-side
    const response = await apiClient.get('/users/stats');
    return response.data;
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch user statistics',
      data: null
    };
  }
};

// Reset user password
export const resetUserPassword = async (id: string, newPassword: string) => {
  try {
    const response = await apiClient.patch(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to reset password'
    };
  }
};
