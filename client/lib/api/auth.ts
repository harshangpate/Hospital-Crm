import apiClient from '../api-client';

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Register new user
export const register = async (data: RegisterData) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

// Login user
export const login = async (data: LoginData) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

// Get current user
export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// Change password
export const changePassword = async (data: ChangePasswordData) => {
  const response = await apiClient.put('/auth/change-password', data);
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};
