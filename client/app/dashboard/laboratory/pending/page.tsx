'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  TestTube2, 
  Clock, 
  AlertCircle,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Beaker
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  status: string;
  orderedDate: string;
  scheduledDate: string | null;
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
  sampleType: string | null;
}

interface Stats {
  pendingConfirmation: number;
  ordered: number;
  sampleCollected: number;
  inProgress: number;
  urgent: number;
}

export default function PendingTestsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingConfirmation: 0,
    ordered: 0,
    sampleCollected: 0,
    inProgress: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchPendingTests();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, statusFilter]);

  const fetchPendingTests = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy: 'orderedDate',
        sortOrder: 'desc',
      });

      // Filter by status - only show pending/active tests
      if (statusFilter === 'all') {
        params.append('status', 'PENDING_CONFIRMATION,ORDERED,SAMPLE_COLLECTED,IN_PROGRESS');
      } else {
        params.append('status', statusFilter);
      }

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
        setTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending tests:', error);
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
        const data = result.data;
        
        // Calculate stats from the data
        setStats({
          pendingConfirmation: data.statusCounts?.PENDING_CONFIRMATION || 0,
          ordered: data.statusCounts?.ORDERED || 0,
          sampleCollected: data.statusCounts?.SAMPLE_COLLECTED || 0,
          inProgress: data.statusCounts?.IN_PROGRESS || 0,
          urgent: 0 // We'll need to add urgent flag logic
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleConfirmTest = async (testId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}/confirm`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Test confirmed successfully!');
        fetchPendingTests();
        fetchStats();
      } else {
        alert('Failed to confirm test');
      }
    } catch (error) {
      console.error('Error confirming test:', error);
      alert('Error confirming test');
    }
  };

  const handleUpdateStatus = async (testId: string, newStatus: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert('Status updated successfully!');
        fetchPendingTests();
        fetchStats();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
      PENDING_CONFIRMATION: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: 'Pending Confirmation',
        icon: AlertCircle
      },
      ORDERED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Ordered',
        icon: FileText
      },
      SAMPLE_COLLECTED: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        label: 'Sample Collected',
        icon: Beaker
      },
      IN_PROGRESS: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        label: 'In Progress',
        icon: Clock
      },
      COMPLETED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Completed',
        icon: CheckCircle2
      },
      CANCELLED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        label: 'Cancelled',
        icon: XCircle
      },
    };

    const config = statusConfig[status] || statusConfig.ORDERED;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredTests = tests.filter(test => {
    const searchLower = searchTerm.toLowerCase();
    return (
      test.testNumber.toLowerCase().includes(searchLower) ||
      test.testName.toLowerCase().includes(searchLower) ||
      test.patient.patientId.toLowerCase().includes(searchLower) ||
      `${test.patient.user.firstName} ${test.patient.user.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TestTube2 className="h-8 w-8 text-blue-600" />
                Pending Lab Tests
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and process pending laboratory tests
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/laboratory/new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <FileText className="h-5 w-5" />
              New Test Order
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              icon={<AlertCircle className="h-6 w-6" />}
              title="Pending Confirmation"
              value={stats.pendingConfirmation}
              color="yellow"
              onClick={() => setStatusFilter('PENDING_CONFIRMATION')}
              active={statusFilter === 'PENDING_CONFIRMATION'}
            />
            <StatCard
              icon={<FileText className="h-6 w-6" />}
              title="Ordered"
              value={stats.ordered}
              color="blue"
              onClick={() => setStatusFilter('ORDERED')}
              active={statusFilter === 'ORDERED'}
            />
            <StatCard
              icon={<Beaker className="h-6 w-6" />}
              title="Sample Collected"
              value={stats.sampleCollected}
              color="purple"
              onClick={() => setStatusFilter('SAMPLE_COLLECTED')}
              active={statusFilter === 'SAMPLE_COLLECTED'}
            />
            <StatCard
              icon={<Clock className="h-6 w-6" />}
              title="In Progress"
              value={stats.inProgress}
              color="orange"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              active={statusFilter === 'IN_PROGRESS'}
            />
            <StatCard
              icon={<TestTube2 className="h-6 w-6" />}
              title="All Pending"
              value={stats.pendingConfirmation + stats.ordered + stats.sampleCollected + stats.inProgress}
              color="gray"
              onClick={() => setStatusFilter('all')}
              active={statusFilter === 'all'}
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by test number, test name, patient name, or patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tests List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Test Orders ({filteredTests.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading tests...</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="p-12 text-center">
                <TestTube2 className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No pending tests</h3>
                <p className="mt-2 text-gray-600">All tests have been processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
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
                    {filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TestTube2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {test.testName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {test.testNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {test.patient.user.firstName} {test.patient.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {test.patient.patientId} • {calculateAge(test.patient.user.dateOfBirth)}Y • {test.patient.user.gender}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            {test.testCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(test.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(test.orderedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {test.status === 'PENDING_CONFIRMATION' && (
                              <button
                                onClick={() => handleConfirmTest(test.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                              >
                                Confirm
                              </button>
                            )}
                            {test.status === 'ORDERED' && (
                              <button
                                onClick={() => handleUpdateStatus(test.id, 'SAMPLE_COLLECTED')}
                                className="text-purple-600 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded"
                              >
                                Collect Sample
                              </button>
                            )}
                            {test.status === 'SAMPLE_COLLECTED' && (
                              <button
                                onClick={() => handleUpdateStatus(test.id, 'IN_PROGRESS')}
                                className="text-orange-600 hover:text-orange-900 bg-orange-50 px-3 py-1 rounded"
                              >
                                Start Testing
                              </button>
                            )}
                            {test.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => router.push(`/dashboard/laboratory/results?testId=${test.id}`)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                              >
                                Enter Results
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/dashboard/laboratory/${test.id}`)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: 'yellow' | 'blue' | 'purple' | 'orange' | 'gray';
  onClick: () => void;
  active: boolean;
}

function StatCard({ icon, title, value, color, onClick, active }: StatCardProps) {
  const colorClasses = {
    yellow: active ? 'bg-yellow-50 border-yellow-500' : 'bg-white border-gray-200',
    blue: active ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200',
    purple: active ? 'bg-purple-50 border-purple-500' : 'bg-white border-gray-200',
    orange: active ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200',
    gray: active ? 'bg-gray-50 border-gray-500' : 'bg-white border-gray-200',
  };

  const iconColors = {
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    gray: 'text-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer text-left`}
    >
      <div className="flex items-center justify-between">
        <div className={iconColors[color]}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </div>
    </button>
  );
}
