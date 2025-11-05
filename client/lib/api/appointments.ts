import apiClient from '../api-client';

export interface CreateAppointmentData {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  notes?: string;
  appointmentType: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECK_UP' | 'EMERGENCY';
}

export interface UpdateAppointmentStatusData {
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  doctorNotes?: string;
}

export interface RescheduleAppointmentData {
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
}

// Create appointment
export const createAppointment = async (data: CreateAppointmentData) => {
  const response = await apiClient.post('/appointments', data);
  return response.data;
};

// Get appointments
export const getAppointments = async (filters?: {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get('/appointments', { params: filters });
  return response.data;
};

// Get appointment by ID
export const getAppointmentById = async (id: string) => {
  const response = await apiClient.get(`/appointments/${id}`);
  return response.data;
};

// Update appointment status
export const updateAppointmentStatus = async (
  id: string,
  data: UpdateAppointmentStatusData
) => {
  const response = await apiClient.patch(`/appointments/${id}/status`, data);
  return response.data;
};

// Cancel appointment
export const cancelAppointment = async (id: string, reason: string) => {
  const response = await apiClient.post(`/appointments/${id}/cancel`, { reason });
  return response.data;
};

// Reschedule appointment
export const rescheduleAppointment = async (
  id: string,
  data: RescheduleAppointmentData
) => {
  const response = await apiClient.post(`/appointments/${id}/reschedule`, data);
  return response.data;
};

// Get appointment statistics
export const getAppointmentStats = async () => {
  const response = await apiClient.get('/appointments/stats');
  return response.data;
};

// Get doctors by specialty
export const getDoctorsBySpecialty = async (specialty?: string) => {
  const response = await apiClient.get('/doctors/by-specialty', {
    params: specialty ? { specialty } : {},
  });
  return response.data;
};

// Get available slots
export const getAvailableSlots = async (doctorId: string, date: string) => {
  const response = await apiClient.get('/doctors/available-slots', {
    params: { doctorId, date },
  });
  return response.data;
};

// Get specializations
export const getSpecializations = async () => {
  const response = await apiClient.get('/doctors/specializations');
  return response.data;
};
