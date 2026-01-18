'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  ArrowLeft,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  Plus,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface Payroll {
  id: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonus: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  paymentDate?: string;
  staff: {
    staffId: string;
    department: string;
    designation: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function PayrollPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PROCESSED' | 'PAID'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchPayrolls();
    }
  }, [token, selectedMonth, selectedYear, filterStatus]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });

      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`http://localhost:5000/api/v1/payroll?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payroll records');
      }

      const data = await response.json();
      setPayrolls(data.data || []);
    } catch (error: any) {
      console.error('Error fetching payrolls:', error);
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    if (!confirm('Mark this payroll as paid?')) return;

    try {
      setActionLoading(true);

      const response = await fetch(`http://localhost:5000/api/v1/payroll/${payrollId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark as paid');
      }

      toast.success('Payroll marked as paid');
      fetchPayrolls();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayrolls = payrolls.filter((payroll) => {
    const matchesSearch =
      payroll.staff.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payroll.staff.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payroll.staff.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payroll.staff.department.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const stats = {
    total: filteredPayrolls.length,
    processed: filteredPayrolls.filter((p) => p.status === 'PROCESSED').length,
    paid: filteredPayrolls.filter((p) => p.status === 'PAID').length,
    totalAmount: filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0),
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <button
                onClick={() => router.push('/dashboard/staff/hr')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to HR Portal
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                Payroll Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Process salaries, manage payroll, and track payments
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard/staff/hr/payroll/process')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Process Payroll
            </button>
          </motion.div>

          {/* Statistics Cards */}
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.total}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processed</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {stats.processed}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {stats.paid}
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      ₹{stats.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-600 opacity-80" />
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Filters */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('PROCESSED')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'PROCESSED'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Processed
                  </button>
                  <button
                    onClick={() => setFilterStatus('PAID')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'PAID'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Payroll Table */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                  </div>
                ) : filteredPayrolls.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No payroll records found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Staff Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Basic Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Net Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredPayrolls.map((payroll) => (
                        <motion.tr
                          key={payroll.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {payroll.staff.user.firstName[0]}{payroll.staff.user.lastName[0]}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {payroll.staff.user.firstName} {payroll.staff.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {payroll.staff.staffId} • {payroll.staff.department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {getMonthName(payroll.month)} {payroll.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ₹{payroll.basicSalary.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                            ₹{payroll.netSalary.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payroll.status)}`}>
                              {payroll.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payroll.status === 'PROCESSED' && (
                              <button
                                onClick={() => handleMarkAsPaid(payroll.id)}
                                disabled={actionLoading}
                                className="text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            {payroll.status === 'PAID' && (
                              <button
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
