import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Emergency Registration
export const registerEmergencyVisit = (data: any) => {
  return api.post('/emergency/register', data);
};

// Triage
export const createTriageAssessment = (emergencyVisitId: string, data: any) => {
  return api.post(`/emergency/${emergencyVisitId}/triage`, data);
};

export const getTriageByVisit = (emergencyVisitId: string) => {
  return api.get(`/emergency/${emergencyVisitId}/triage`);
};

// Queue Management
export const getEmergencyQueue = (params?: any) => {
  return api.get('/emergency/queue', { params });
};

export const getEmergencyStatistics = () => {
  return api.get('/emergency/statistics');
};

// Visit Details
export const getEmergencyVisitById = (emergencyVisitId: string) => {
  return api.get(`/emergency/${emergencyVisitId}`);
};

export const updateVisitStatus = (emergencyVisitId: string, data: { status: string }) => {
  return api.patch(`/emergency/${emergencyVisitId}/status`, data);
};

// Doctor & Bed Assignment
export const assignDoctor = (emergencyVisitId: string, data: { doctorId: string }) => {
  return api.post(`/emergency/${emergencyVisitId}/assign-doctor`, data);
};

export const assignBed = (emergencyVisitId: string, data: { bedId: string }) => {
  return api.post(`/emergency/${emergencyVisitId}/assign-bed`, data);
};

// Doctor Assessment
export const updateDoctorAssessment = (emergencyVisitId: string, data: any) => {
  return api.patch(`/emergency/${emergencyVisitId}/assessment`, data);
};

// Vitals
export const recordEmergencyVitals = (emergencyVisitId: string, data: any) => {
  return api.post(`/emergency/${emergencyVisitId}/vitals`, data);
};

export const getVisitVitals = (emergencyVisitId: string) => {
  return api.get(`/emergency/${emergencyVisitId}/vitals`);
};

// Disposition
export const createDisposition = (emergencyVisitId: string, data: any) => {
  return api.post(`/emergency/${emergencyVisitId}/disposition`, data);
};

// Bed Management
export const getEmergencyBeds = (params?: any) => {
  return api.get('/emergency/beds/all', { params });
};
