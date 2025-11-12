import apiClient from '../api-client';

// ==================== TYPES ====================

export interface CreateSurgeryData {
  patientId: string;
  primarySurgeonId: string;
  operationTheaterId: string;
  surgeryType: 'ELECTIVE' | 'EMERGENCY' | 'DAY_CARE';
  surgeryName: string;
  description?: string;
  diagnosis?: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  estimatedDuration: number;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  anesthesiaType?: 'GENERAL' | 'SPINAL' | 'EPIDURAL' | 'LOCAL' | 'REGIONAL' | 'SEDATION';
  bloodRequirement?: string;
  specialEquipment?: string;
  specialInstructions?: string;
  estimatedCost?: number;
  surgicalTeam?: Array<{
    userId?: string;
    role: string;
    name: string;
    specialization?: string;
    contactNumber?: string;
  }>;
}

export interface UpdateSurgeryData {
  surgeryName?: string;
  description?: string;
  diagnosis?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  anesthesiaType?: string;
  bloodRequirement?: string;
  specialEquipment?: string;
  specialInstructions?: string;
  estimatedCost?: number;
}

export interface UpdateSurgeryStatusData {
  status: 'SCHEDULED' | 'PRE_OP' | 'IN_PROGRESS' | 'POST_OP' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  remarks?: string;
}

// ==================== SURGERY API ====================

// Get all surgeries with filters
export const getAllSurgeries = async (filters?: {
  status?: string;
  surgeryType?: string;
  priority?: string;
  patientId?: string;
  surgeonId?: string;
  operationTheaterId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get('/surgeries', { params: filters });
  return response.data;
};

// Get surgery by ID
export const getSurgeryById = async (id: string) => {
  const response = await apiClient.get(`/surgeries/${id}`);
  return response.data;
};

// Create surgery
export const createSurgery = async (data: CreateSurgeryData) => {
  const response = await apiClient.post('/surgeries', data);
  return response.data;
};

// Update surgery
export const updateSurgery = async (id: string, data: UpdateSurgeryData) => {
  const response = await apiClient.patch(`/surgeries/${id}`, data);
  return response.data;
};

// Update surgery status
export const updateSurgeryStatus = async (id: string, data: UpdateSurgeryStatusData) => {
  const response = await apiClient.patch(`/surgeries/${id}/status`, data);
  return response.data;
};

// Delete surgery
export const deleteSurgery = async (id: string) => {
  const response = await apiClient.delete(`/surgeries/${id}`);
  return response.data;
};

// Get surgeon upcoming surgeries
export const getSurgeonUpcomingSurgeries = async (surgeonId: string, days: number = 7) => {
  const response = await apiClient.get(`/surgeries/surgeon/${surgeonId}/upcoming`, {
    params: { days },
  });
  return response.data;
};

// Get patient surgeries
export const getPatientSurgeries = async (patientId: string) => {
  const response = await apiClient.get(`/surgeries/patient/${patientId}`);
  return response.data;
};

// ==================== OPERATION THEATER API ====================

// Get all operation theaters
export const getAllOperationTheaters = async (filters?: {
  status?: string;
  type?: string;
  isActive?: boolean;
}) => {
  const response = await apiClient.get('/operation-theaters', { params: filters });
  return response.data;
};

// Get OT by ID
export const getOperationTheaterById = async (id: string) => {
  const response = await apiClient.get(`/operation-theaters/${id}`);
  return response.data;
};

// Create operation theater
export const createOperationTheater = async (data: any) => {
  const response = await apiClient.post('/operation-theaters', data);
  return response.data;
};

// Update operation theater
export const updateOperationTheater = async (id: string, data: any) => {
  const response = await apiClient.patch(`/operation-theaters/${id}`, data);
  return response.data;
};

// Update OT status
export const updateOTStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/operation-theaters/${id}/status`, { status });
  return response.data;
};

// Delete operation theater
export const deleteOperationTheater = async (id: string) => {
  const response = await apiClient.delete(`/operation-theaters/${id}`);
  return response.data;
};

// Get OT schedule
export const getOTSchedule = async (otId: string, startDate: string, endDate: string) => {
  const response = await apiClient.get('/operation-theaters/schedule', {
    params: { otId, startDate, endDate },
  });
  return response.data;
};

// Get OT availability
export const getOTAvailability = async (date: string, duration: number) => {
  const response = await apiClient.get('/operation-theaters/availability', {
    params: { date, duration },
  });
  return response.data;
};

// Get OT dashboard stats
export const getOTDashboardStats = async () => {
  const response = await apiClient.get('/operation-theaters/stats');
  return response.data;
};

// Add maintenance log
export const addMaintenanceLog = async (otId: string, data: any) => {
  const response = await apiClient.post(`/operation-theaters/${otId}/maintenance`, data);
  return response.data;
};

// ==================== SURGERY RECORDS API ====================

// Pre-op checklist
export const getPreOpChecklist = async (surgeryId: string) => {
  const response = await apiClient.get(`/surgery-records/pre-op/${surgeryId}`);
  return response.data;
};

export const updatePreOpChecklist = async (surgeryId: string, data: any) => {
  const response = await apiClient.put(`/surgery-records/pre-op/${surgeryId}`, data);
  return response.data;
};

export const deletePreOpChecklist = async (surgeryId: string) => {
  const response = await apiClient.delete(`/surgery-records/pre-op/${surgeryId}`);
  return response.data;
};

// Intra-op record
export const getIntraOpRecord = async (surgeryId: string) => {
  const response = await apiClient.get(`/surgery-records/intra-op/${surgeryId}`);
  return response.data;
};

export const updateIntraOpRecord = async (surgeryId: string, data: any) => {
  const response = await apiClient.put(`/surgery-records/intra-op/${surgeryId}`, data);
  return response.data;
};

// Post-op record
export const getPostOpRecord = async (surgeryId: string) => {
  const response = await apiClient.get(`/surgery-records/post-op/${surgeryId}`);
  return response.data;
};

export const updatePostOpRecord = async (surgeryId: string, data: any) => {
  const response = await apiClient.put(`/surgery-records/post-op/${surgeryId}`, data);
  return response.data;
};
