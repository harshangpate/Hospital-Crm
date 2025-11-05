const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const getPrescriptions = async (params?: {
  patientId?: string;
  doctorId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  
  if (params?.patientId) queryParams.append('patientId', params.patientId);
  if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_URL}/prescriptions?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const getPrescriptionById = async (id: string) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/prescriptions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const getPatientPrescriptions = async (patientId: string) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/prescriptions/patient/${patientId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const getDoctorPrescriptions = async (doctorId: string) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/prescriptions/doctor/${doctorId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
