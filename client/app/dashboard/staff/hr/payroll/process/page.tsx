'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, DollarSign, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface Staff {
  id: string;
  staffId: string;
  department: string;
  designation: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function ProcessPayrollPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [formData, setFormData] = useState({
    staffId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: '',
    allowances: '',
    deductions: '',
    overtimePay: '',
    bonus: '',
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchStaff();
    }
  }, [token]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      setStaffList(data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffId || !formData.basicSalary) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/v1/payroll/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: formData.staffId,
          month: formData.month,
          year: formData.year,
          basicSalary: parseFloat(formData.basicSalary),
          allowances: formData.allowances ? parseFloat(formData.allowances) : 0,
          deductions: formData.deductions ? parseFloat(formData.deductions) : 0,
          overtimePay: formData.overtimePay ? parseFloat(formData.overtimePay) : 0,
          bonus: formData.bonus ? parseFloat(formData.bonus) : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payroll');
      }

      toast.success('Payroll processed successfully');
      router.push('/dashboard/staff/hr/payroll');
    } catch (error: any) {
      console.error('Error processing payroll:', error);
      toast.error(error.message || 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const overtime = parseFloat(formData.overtimePay) || 0;
    const bonus = parseFloat(formData.bonus) || 0;

    const gross = basic + allowances + overtime + bonus;
    const net = gross - deductions;

    return { gross, net };
  };

  const { gross, net } = calculateNetSalary();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.push('/dashboard/staff/hr/payroll')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Payroll
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              Process Payroll
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Process monthly salary for staff members
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Staff Member <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Staff Member</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.staffId} - {s.user.firstName} {s.user.lastName} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {[2024, 2025, 2026].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Basic Salary (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                      placeholder="Enter basic salary"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Allowances (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.allowances}
                        onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deductions (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.deductions}
                        onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Overtime Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.overtimePay}
                        onChange={(e) => setFormData({ ...formData, overtimePay: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bonus (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.bonus}
                        onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {formData.basicSalary && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300">Gross Salary:</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">₹{gross.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300 font-bold">Net Salary:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">₹{net.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/staff/hr/payroll')}
                      className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-5 w-5" />
                          Process Payroll
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
