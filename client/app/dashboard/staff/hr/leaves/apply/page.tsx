'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Calendar, FileText, Loader2, Upload } from 'lucide-react';
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

export default function ApplyLeavePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [formData, setFormData] = useState({
    staffId: '',
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
    documents: '',
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
      if (data.data && data.data.length > 0) {
        setStaffList(data.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffId || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (end < start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/v1/leaves/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to apply for leave');
      }

      toast.success('Leave application submitted successfully');
      router.push('/dashboard/staff/hr/leaves');
    } catch (error: any) {
      console.error('Error applying leave:', error);
      toast.error(error.message || 'Failed to apply for leave');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return days;
    }
    return 0;
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
                onClick={() => router.push('/dashboard/staff/hr/leaves')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Leave Management
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                <Calendar className="h-8 w-8 text-green-600" />
                Apply for Leave
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Submit a new leave application
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Staff Selection */}
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

                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="CASUAL">Casual Leave</option>
                      <option value="SICK">Sick Leave</option>
                      <option value="EARNED">Earned Leave</option>
                      <option value="MATERNITY">Maternity Leave</option>
                      <option value="PATERNITY">Paternity Leave</option>
                      <option value="UNPAID">Unpaid Leave</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Total Days */}
                  {formData.startDate && formData.endDate && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Total Days: <span className="font-bold">{calculateDays()} day{calculateDays() !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={4}
                      placeholder="Please provide a reason for your leave request..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  {/* Supporting Documents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supporting Documents (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Upload medical certificate or other supporting documents
                      </p>
                      <input
                        type="text"
                        value={formData.documents}
                        onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                        placeholder="Document URL (if any)"
                        className="w-full max-w-md mx-auto px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/staff/hr/leaves')}
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
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5" />
                          Submit Application
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
