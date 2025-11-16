import apiClient from '../api-client';

export interface Equipment {
  id: string;
  name: string;
  equipmentCode: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  location?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastCalibration?: string;
  nextCalibration?: string;
  maintenanceDue?: string;
  usageCount: number;
  isPortable: boolean;
  remarks?: string;
  operationTheaterId?: string;
  operationTheater?: {
    id: string;
    name: string;
    otNumber: string;
  };
  maintenanceLogs?: MaintenanceLog[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  maintenanceType: string;
  description: string;
  performedBy: string;
  performedAt: string;
  nextMaintenanceAt?: string;
  cost?: number;
  vendor?: string;
  remarks?: string;
  createdAt: string;
}

export interface EquipmentFilters {
  status?: string;
  type?: string;
  operationTheaterId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateEquipmentData {
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  operationTheaterId?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status?: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  location?: string;
  isPortable?: boolean;
  remarks?: string;
}

export interface UpdateEquipmentData {
  name?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  operationTheaterId?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status?: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  location?: string;
  maintenanceDue?: string;
  isPortable?: boolean;
  remarks?: string;
}

export interface ScheduleMaintenanceData {
  maintenanceType: string;
  description?: string;
  performedBy: string;
  performedAt?: string;
  nextMaintenanceAt?: string;
  cost?: number;
  vendor?: string;
  remarks?: string;
}

// Get all equipment with filters
export const getAllEquipment = async (filters?: EquipmentFilters) => {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.operationTheaterId) params.append('operationTheaterId', filters.operationTheaterId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/equipment?${params.toString()}`);
  return response.data;
};

// Get equipment by ID
export const getEquipmentById = async (id: string) => {
  const response = await apiClient.get(`/equipment/${id}`);
  return response.data;
};

// Create equipment
export const createEquipment = async (data: CreateEquipmentData) => {
  const response = await apiClient.post('/equipment', data);
  return response.data;
};

// Update equipment
export const updateEquipment = async (id: string, data: UpdateEquipmentData) => {
  const response = await apiClient.patch(`/equipment/${id}`, data);
  return response.data;
};

// Delete equipment
export const deleteEquipment = async (id: string) => {
  const response = await apiClient.delete(`/equipment/${id}`);
  return response.data;
};

// Schedule maintenance
export const scheduleMaintenance = async (id: string, data: ScheduleMaintenanceData) => {
  const response = await apiClient.post(`/equipment/${id}/maintenance`, data);
  return response.data;
};

// Increment usage count
export const incrementUsage = async (id: string) => {
  const response = await apiClient.post(`/equipment/${id}/usage`);
  return response.data;
};
