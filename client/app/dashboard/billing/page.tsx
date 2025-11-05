'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import {
  IndianRupee,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  patient: {
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
}

interface BillingStats {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  partialInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  collectedAmount: number;
}

export default function BillingDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <BillingDashboard />
    </ProtectedRoute>
  );
}

function BillingDashboard() {
  const { token } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingCharges, setUpdatingCharges] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchInvoices();
  }, [statusFilter, currentPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchInvoices();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/billing/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
      });
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:5000/api/v1/billing?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setInvoices(result.data.invoices);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBedCharges = async () => {
    if (!confirm('This will update bed charges for all active admissions. Continue?')) {
      return;
    }

    try {
      setUpdatingCharges(true);
      const response = await fetch('http://localhost:5000/api/v1/billing/update-bed-charges', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchStats();
        fetchInvoices();
      } else {
        alert('Failed to update bed charges');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating bed charges');
    } finally {
      setUpdatingCharges(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800';
    if (status === 'PENDING') return 'bg-red-100 text-red-800';
    if (status === 'PARTIALLY_PAID') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PAID') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'PENDING') return <AlertCircle className="w-4 h-4" />;
    if (status === 'PARTIALLY_PAID') return <Clock className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Billing & Payments</h1>
              <p className="text-gray-600 mt-1">Manage invoices from all modules</p>
            </div>
            <button
              onClick={handleUpdateBedCharges}
              disabled={updatingCharges}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {updatingCharges ? 'Updating...' : 'Update Bed Charges'}
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-500 rounded-lg shadow p-6 text-white">
                <IndianRupee className="w-8 h-8 mb-2" />
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-500 rounded-lg shadow p-6 text-white">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <p className="text-sm opacity-90">Collected</p>
                <p className="text-2xl font-bold">{stats.collectedAmount.toLocaleString()}</p>
              </div>
              <div className="bg-red-500 rounded-lg shadow p-6 text-white">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-sm opacity-90">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <div className="bg-purple-500 rounded-lg shadow p-6 text-white">
                <FileText className="w-8 h-8 mb-2" />
                <p className="text-sm opacity-90">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.patient.user.firstName} {invoice.patient.user.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{invoice.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{invoice.paidAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{invoice.balanceAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.paymentStatus)}`}>
                        {getStatusIcon(invoice.paymentStatus)}
                        <span className="ml-1">{invoice.paymentStatus.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/billing/${invoice.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
