'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  TestTube2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Plus,
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import StatCardComponent from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  status: string;
  orderedDate: string;
  scheduledDate: string | null;
  collectionDate: string | null;
  resultDate: string | null;
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
  cost: number | null;
}

interface Stats {
  totalTests: number;
  orderedTests: number;
  sampleCollectedTests: number;
  inProgressTests: number;
  completedTests: number;
  todayTests: number;
}

export default function LaboratoryPortal() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Check authorization
  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch functions
  const fetchLabTests = async () => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        sortBy: 'orderedDate',
        sortOrder: 'desc',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('testCategory', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setLabTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/stats`,
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

  useEffect(() => {
    if (token) {
      fetchLabTests();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, searchTerm, token]);

  const updateTestStatus = async (testId: string, newStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}/status`,
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
        // Refresh the list
        fetchLabTests();
        fetchStats();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const confirmTest = async (testId: string) => {
    if (!token) return;
    
    if (!confirm('Confirm this lab test order?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Test confirmed successfully!');
        fetchLabTests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to confirm test');
      }
    } catch (error) {
      console.error('Error confirming test:', error);
      alert('Error confirming test');
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: { [key: string]: string } = {
      'PENDING_CONFIRMATION': 'ORDERED',
      'ORDERED': 'SAMPLE_COLLECTED',
      'SAMPLE_COLLECTED': 'IN_PROGRESS',
      'IN_PROGRESS': 'PENDING_APPROVAL',
    };
    return statusFlow[currentStatus] || null;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'PENDING_CONFIRMATION': 'bg-gray-100 text-gray-800',
      'ORDERED': 'bg-yellow-100 text-yellow-800',
      'SAMPLE_COLLECTED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'PENDING_APPROVAL': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
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
        <div className="space-y-6">
          {/* Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white overflow-hidden"
          >
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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
                    Laboratory Portal 🔬
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-purple-100 text-lg"
                  >
                    Manage lab tests, sample collection, and test results
                  </motion.p>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/dashboard/laboratory/analytics"
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all shadow-lg"
                >
                  <FileText className="h-5 w-5" />
                  View Analytics
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <StatCardComponent
                icon={<TestTube2 className="w-6 h-6" />}
                title="Total Tests"
                value={stats.totalTests.toString()}
                gradient="from-gray-500 to-gray-600"
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
                icon={<TestTube2 className="w-6 h-6" />}
                title="Sample Collected"
                value={stats.sampleCollectedTests.toString()}
                gradient="from-blue-500 to-indigo-600"
                delay={0.2}
              />
              <StatCardComponent
                icon={<Clock className="w-6 h-6" />}
                title="In Progress"
                value={stats.inProgressTests.toString()}
                gradient="from-purple-500 to-pink-600"
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
                gradient="from-teal-500 to-cyan-600"
                delay={0.35}
              />
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests or patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="ORDERED">Ordered</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">All Categories</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Pathology">Pathology</option>
              <option value="Radiology">Radiology</option>
            </select>
          </div>

          {/* New Test Button */}
          <Link
            href="/dashboard/laboratory/new"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Test Order
          </Link>
        </div>
      </div>

      {/* Lab Tests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {labTests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No lab tests found
                  </td>
                </tr>
              ) : (
                labTests.map((test) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{test.testName}</span>
                        {test.isCritical && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.testCategory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        {test.isCritical && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-300 animate-pulse">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            CRITICAL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(test.orderedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/laboratory/${test.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </Link>
                        {test.status === 'PENDING_CONFIRMATION' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => confirmTest(test.id)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                              title="Confirm test and generate bill"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Confirm
                            </button>
                          </>
                        )}
                        {getNextStatus(test.status) && test.status !== 'PENDING_CONFIRMATION' && (
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
      </div>
    </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
