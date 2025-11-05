'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Plus,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import StatCardComponent from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface RadiologyTest {
  id: string;
  testNumber: string;
  modality: string;
  bodyPart: string;
  studyDescription: string;
  status: string;
  urgencyLevel: string;
  orderedDate: string;
  scheduledDate: string | null;
  isCritical: boolean;
  patient: {
    id: string;
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      gender: string;
      dateOfBirth: string;
    };
  };
}

interface Stats {
  totalTests: number;
  orderedTests: number;
  scheduledTests: number;
  inProgressTests: number;
  pendingReportTests: number;
  pendingApprovalTests: number;
  completedTests: number;
  todayTests: number;
  criticalTests: number;
}

export default function RadiologyDashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'].includes(user.role)) {
      router.push('/dashboard');
    }
    fetchStats();
    fetchRadiologyTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, modalityFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRadiologyTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (modalityFilter) params.append('modality', modalityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setRadiologyTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching radiology tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTestStatus = async (testId: string, newStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/${testId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchRadiologyTests();
        fetchStats();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: { [key: string]: string } = {
      'ORDERED': 'SCHEDULED',
      'SCHEDULED': 'IN_PROGRESS',
      'IN_PROGRESS': 'PERFORMED',
      'PERFORMED': 'PENDING_REPORT',
    };
    return statusFlow[currentStatus] || null;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'ORDERED': 'bg-yellow-100 text-yellow-800',
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'PERFORMED': 'bg-indigo-100 text-indigo-800',
      'PENDING_REPORT': 'bg-orange-100 text-orange-800',
      'PENDING_APPROVAL': 'bg-pink-100 text-pink-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: { [key: string]: string } = {
      'ROUTINE': 'bg-gray-100 text-gray-700',
      'URGENT': 'bg-orange-100 text-orange-700',
      'EMERGENCY': 'bg-red-100 text-red-700',
      'STAT': 'bg-red-600 text-white',
    };

    return (
      <span className={`px-2 py-1 text-xs font-bold rounded ${styles[urgency] || 'bg-gray-100 text-gray-800'}`}>
        {urgency}
      </span>
    );
  };

  const filteredTests = radiologyTests.filter(test => {
    const searchLower = searchTerm.toLowerCase();
    return (
      test.testNumber.toLowerCase().includes(searchLower) ||
      test.studyDescription.toLowerCase().includes(searchLower) ||
      test.modality.toLowerCase().includes(searchLower) ||
      test.bodyPart.toLowerCase().includes(searchLower) ||
      test.patient.patientId.toLowerCase().includes(searchLower) ||
      `${test.patient.user.firstName} ${test.patient.user.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  if (loading && radiologyTests.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white overflow-hidden mb-8"
          >
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold mb-2"
                  >
                    Radiology Portal 🔬
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-blue-100 text-lg"
                  >
                    Manage imaging tests, reports, and radiology workflows
                  </motion.p>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/dashboard/radiology/order"
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  Order Imaging Test
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <StatCardComponent
                icon={<Activity className="w-6 h-6" />}
                title="Total Tests"
                value={stats.totalTests.toString()}
                gradient="from-gray-500 to-slate-600"
                delay={0.1}
              />
              <StatCardComponent
                icon={<Clock className="w-6 h-6" />}
                title="Ordered"
                value={stats.orderedTests.toString()}
                gradient="from-yellow-500 to-orange-600"
                delay={0.15}
              />
              <StatCardComponent
                icon={<FileText className="w-6 h-6" />}
                title="Pending Report"
                value={stats.pendingReportTests.toString()}
                gradient="from-orange-500 to-red-600"
                delay={0.2}
              />
              <StatCardComponent
                icon={<AlertCircle className="w-6 h-6" />}
                title="Pending Approval"
                value={stats.pendingApprovalTests.toString()}
                gradient="from-pink-500 to-rose-600"
                delay={0.25}
              />
              <StatCardComponent
                icon={<CheckCircle2 className="w-6 h-6" />}
                title="Completed"
                value={stats.completedTests.toString()}
                gradient="from-green-500 to-emerald-600"
                delay={0.3}
              />
              <StatCardComponent
                icon={<Calendar className="w-6 h-6" />}
                title="Today's Tests"
                value={stats.todayTests.toString()}
                gradient="from-blue-500 to-cyan-600"
                delay={0.35}
              />
            </div>
          )}

          {/* Filters and Search */}
          <AnimatedCard delay={0.4} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search tests, patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="ORDERED">Ordered</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PERFORMED">Performed</option>
                <option value="PENDING_REPORT">Pending Report</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Modalities</option>
                <option value="X-RAY">X-Ray</option>
                <option value="CT">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="ULTRASOUND">Ultrasound</option>
                <option value="MAMMOGRAPHY">Mammography</option>
                <option value="PET_SCAN">PET Scan</option>
              </select>

              <button
                onClick={fetchRadiologyTests}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <Filter className="h-5 w-5" />
                Apply Filters
              </button>
            </div>
          </AnimatedCard>

          {/* Tests Table */}
          <AnimatedCard delay={0.5}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modality / Study
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Body Part
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No radiology tests found
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {test.testNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {test.patient.user.firstName} {test.patient.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {test.patient.patientId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {test.modality}
                          </div>
                          <div className="text-sm text-gray-500">
                            {test.studyDescription}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.bodyPart}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(test.status)}
                            {test.isCritical && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getUrgencyBadge(test.urgencyLevel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(test.orderedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/radiology/${test.id}`}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              View
                            </Link>
                            {getNextStatus(test.status) && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => updateTestStatus(test.id, getNextStatus(test.status)!)}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                  title={`Move to ${getNextStatus(test.status)?.replace('_', ' ')}`}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  Next
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
