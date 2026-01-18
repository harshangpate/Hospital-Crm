'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  ArrowLeft,
  Clock,
  Users,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
}

interface Staff {
  id: string;
  staffId: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ShiftAssignment {
  id: string;
  staffId: string;
  shiftId: string;
  date: string;
  staff: Staff;
  shift: Shift;
}

export default function ShiftsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newShift, setNewShift] = useState({
    name: '',
    startTime: '',
    endTime: '',
  });
  const [assignData, setAssignData] = useState({
    staffId: '',
    shiftId: '',
    date: '',
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [shiftsRes, staffRes, assignRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/shifts', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/v1/staff', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/v1/shifts/assignments', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [shiftsData, staffData, assignData] = await Promise.all([
        shiftsRes.json(),
        staffRes.json(),
        assignRes.json(),
      ]);

      setShifts(shiftsData.data || []);
      setStaffList(staffData.data || []);
      setAssignments(assignData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/v1/shifts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShift),
      });

      if (!response.ok) throw new Error('Failed to create shift');

      toast.success('Shift created successfully');
      setShowCreateModal(false);
      setNewShift({ name: '', startTime: '', endTime: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create shift');
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/v1/shifts/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignData),
      });

      if (!response.ok) throw new Error('Failed to assign shift');

      toast.success('Shift assigned successfully');
      setShowAssignModal(false);
      setAssignData({ staffId: '', shiftId: '', date: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign shift');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                <Clock className="h-8 w-8 text-green-600" />
                Shift Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create shifts, assign staff, and manage work schedules
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                Assign Shift
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Shift
              </button>
            </div>
          </motion.div>

          {/* Shifts List */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Available Shifts</h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {shift.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            shift.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {shift.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>Start: {shift.startTime}</p>
                        <p>End: {shift.endTime}</p>
                        <p>Duration: {shift.duration}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Recent Assignments */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Assignments</h2>
              {assignments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No assignments yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Staff
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Shift
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {assignments.slice(0, 10).map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {assignment.staff.user.firstName} {assignment.staff.user.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {assignment.shift.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(assignment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {assignment.shift.startTime} - {assignment.shift.endTime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Create Shift Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Shift</h2>
                <form onSubmit={handleCreateShift} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift Name
                    </label>
                    <input
                      type="text"
                      value={newShift.name}
                      onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Shift Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assign Shift</h2>
                <form onSubmit={handleAssignShift} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Staff Member
                    </label>
                    <select
                      value={assignData.staffId}
                      onChange={(e) => setAssignData({ ...assignData, staffId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Staff</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.staffId} - {s.user.firstName} {s.user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift
                    </label>
                    <select
                      value={assignData.shiftId}
                      onChange={(e) => setAssignData({ ...assignData, shiftId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Shift</option>
                      {shifts.filter(s => s.isActive).map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={assignData.date}
                      onChange={(e) => setAssignData({ ...assignData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
