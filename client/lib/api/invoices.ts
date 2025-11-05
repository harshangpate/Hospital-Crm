import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface InvoiceItem {
  id?: string;
  itemType: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      dateOfBirth?: Date;
      gender?: string;
    };
  };
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'CANCELLED';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'CHEQUE' | 'INSURANCE';
  paymentDate?: Date;
  transactionId?: string;
  insuranceClaim: boolean;
  insuranceAmount?: number;
  insuranceApproved?: boolean;
  notes?: string;
  invoiceItems: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceData {
  patientId: string;
  invoiceItems: Omit<InvoiceItem, 'id'>[];
  dueDate?: string;
  tax?: number;
  discount?: number;
  insuranceClaim?: boolean;
  insuranceAmount?: number;
  notes?: string;
}

export interface UpdateInvoiceData {
  dueDate?: string;
  tax?: number;
  discount?: number;
  insuranceAmount?: number;
  insuranceApproved?: boolean;
  notes?: string;
  invoiceItems?: Omit<InvoiceItem, 'id'>[];
}

export interface ProcessPaymentData {
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'CHEQUE' | 'INSURANCE';
  transactionId?: string;
  notes?: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  patientId?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  partiallyPaidInvoices: number;
  totalRevenue: number;
  totalOutstanding: number;
}

// Create Invoice
export const createInvoice = async (data: CreateInvoiceData, token: string) => {
  const response = await axios.post(`${API_URL}/invoices`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get All Invoices with Filters
export const getInvoices = async (filters: InvoiceFilters, token: string) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.patientId) params.append('patientId', filters.patientId);
  if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);
  if (filters.search) params.append('search', filters.search);

  const response = await axios.get(`${API_URL}/invoices?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get Invoice by ID
export const getInvoiceById = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/invoices/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Update Invoice
export const updateInvoice = async (id: string, data: UpdateInvoiceData, token: string) => {
  const response = await axios.put(`${API_URL}/invoices/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Delete Invoice
export const deleteInvoice = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/invoices/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Process Payment
export const processPayment = async (id: string, data: ProcessPaymentData, token: string) => {
  const response = await axios.post(`${API_URL}/invoices/${id}/payment`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get Payment History
export const getPaymentHistory = async (patientId: string, token: string) => {
  const response = await axios.get(`${API_URL}/invoices/patient/${patientId}/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get Outstanding Balances
export const getOutstandingBalances = async (page: number, limit: number, token: string) => {
  const response = await axios.get(
    `${API_URL}/invoices/outstanding?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get Invoice Statistics
export const getInvoiceStats = async (fromDate?: string, toDate?: string, token?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);

  const response = await axios.get(`${API_URL}/invoices/stats?${params.toString()}`, {
    headers: token ? {
      Authorization: `Bearer ${token}`,
    } : {},
  });
  return response.data;
};

// Generate Invoice from Appointment
export const generateInvoiceFromAppointment = async (appointmentId: string, token: string) => {
  const response = await axios.post(
    `${API_URL}/invoices/generate/appointment/${appointmentId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
