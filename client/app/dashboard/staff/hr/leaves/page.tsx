'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  FileText,
  User
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Card3D from '@/components/ui/Card3D';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface LeaveRequest {
  id: string;
  staffId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectionReason?: string;
  staff: {
    staffId: string;
    department: string;
    designation: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface LeaveStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function LeavesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchLeaves();
    }
  }, [token, filterStatus]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      // Fetch leave requests
      const response = await fetch(`http://localhost:5000/api/v1/leaves${filterStatus !== 'ALL' ? `?status=${filterStatus}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();
      setLeaves(data.data || []);

      // Calculate stats
      const allLeaves = data.data || [];
      setStats({
        totalRequests: allLeaves.length,
        pending: allLeaves.filter((l: LeaveRequest) => l.status === 'PENDING').length,
        approved: allLeaves.filter((l: LeaveRequest) => l.status === 'APPROVED').length,
        rejected: allLeaves.filter((l: LeaveRequest) => l.status === 'REJECTED').length,
      });

    } catch (error: any) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    if (!confirm('Approve this leave request?')) return;

    try {
      setActionLoading(true);

      const response = await fetch(`http://localhost:5000/api/v1/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve leave');
      }

      toast.success('Leave request approved');
      fetchLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error('Failed to approve leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (leaveId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setActionLoading(true);

      const response = await fetch(`http://localhost:5000/api/v1/leaves/${leaveId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject leave');
      }

      toast.success('Leave request rejected');
      fetchLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error('Failed to reject leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = 
      leave.staff.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.staff.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.staff.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.staff.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'CASUAL':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'SICK':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'EARNED':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'MATERNITY':
      case 'PATERNITY':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
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
                <Calendar className="h-8 w-8 text-green-600" />
                Leave Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage leave applications, approvals, and leave balance tracking
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => router.push('/dashboard/staff/hr/leaves/balance')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Leave Balance
              </button>
              <button
                onClick={() => router.push('/dashboard/staff/hr/leaves/apply')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Apply Leave
              </button>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.totalRequests}
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-blue-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                        {stats.pending}
                      </p>
                    </div>
                    <Clock className="h-10 w-10 text-yellow-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {stats.approved}
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {stats.rejected}
                      </p>
                    </div>
                    <XCircle className="h-10 w-10 text-red-600 opacity-80" />
                  </div>
                </div>
              </Card3D>
            </div>
          </ScrollReveal>

          {/* Filters and Search */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
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
                    onClick={() => setFilterStatus('PENDING')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'PENDING'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilterStatus('APPROVED')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'APPROVED'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setFilterStatus('REJECTED')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'REJECTED'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Leave Requests Table */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                  </div>
                ) : filteredLeaves.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No leave requests found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Staff Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Leave Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Applied On
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
                      {filteredLeaves.map((leave) => (
                        <motion.tr
                          key={leave.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {leave.staff.user.firstName[0]}{leave.staff.user.lastName[0]}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {leave.staff.user.firstName} {leave.staff.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {leave.staff.staffId} • {leave.staff.department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                              {leave.leaveType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(leave.startDate).toLocaleDateString('en-GB')} - {new Date(leave.endDate).toLocaleDateString('en-GB')}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {leave.reason}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(leave.appliedOn).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                              {leave.status === 'APPROVED' && <CheckCircle className="h-3 w-3" />}
                              {leave.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                              {leave.status === 'PENDING' && <Clock className="h-3 w-3" />}
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {leave.status === 'PENDING' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(leave.id)}
                                  disabled={actionLoading}
                                  className="text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedLeave(leave)}
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
