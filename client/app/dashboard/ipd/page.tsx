'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Hospital,
  Bed,
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface AdmissionStats {
  totalAdmissions: number;
  activeAdmissions: number;
  dischargedToday: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
}

interface Admission {
  id: string;
  admissionNumber: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      gender?: string;
      dateOfBirth?: string;
    };
  };
  bed?: {
    bedNumber: string;
    ward: {
      wardName: string;
      wardType: string;
    };
  };
  admissionDate: string;
  admissionType: string;
  status: string;
  primaryDiagnosis?: string;
  attendingDoctorId: string;
}

export default function IPDDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ADMITTED');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchStats();
    fetchAdmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/admissions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');

      const response = await fetch(
        `http://localhost:5000/api/v1/admissions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAdmissions(result.data.admissions);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ADMITTED: 'bg-green-100 text-green-800 border-green-200',
      DISCHARGED: 'bg-gray-100 text-gray-800 border-gray-200',
      TRANSFERRED: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getAdmissionTypeBadge = (type: string) => {
    const styles = {
      EMERGENCY: 'bg-red-100 text-red-800',
      PLANNED: 'bg-blue-100 text-blue-800',
      TRANSFER: 'bg-purple-100 text-purple-800',
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Hospital className="w-8 h-8 text-blue-600" />
                  IPD Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Inpatient Department - Admissions & Bed Management
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/ipd/beds"
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Bed className="w-4 h-4" />
                  Bed Management
                </Link>
                <Link
                  href="/dashboard/ipd/admit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Admit Patient
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Admissions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.activeAdmissions}
                    </p>
                  </div>
                  <div className="bg-green-500/20 dark:bg-green-500/10 p-3 rounded-full">
                    <UserCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Bed Occupancy</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.occupancyRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.occupiedBeds}/{stats.totalBeds} beds
                    </p>
                  </div>
                  <div className="bg-blue-500/20 dark:bg-blue-500/10 p-3 rounded-full">
                    <Bed className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Available Beds</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.availableBeds}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Bed className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Discharged Today</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.dischargedToday}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-full">
                    <UserX className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('ADMITTED')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'ADMITTED'
                      ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 dark:bg-green-500/10 dark:border-green-500/30'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  Active ({stats?.activeAdmissions || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('DISCHARGED')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'DISCHARGED'
                      ? 'bg-gray-500/20 text-gray-300 border-2 border-gray-500/50 dark:bg-gray-500/10 dark:border-gray-500/30'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <UserX className="w-4 h-4 inline mr-1" />
                  Discharged
                </button>
                <button
                  onClick={() => setStatusFilter('TRANSFERRED')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === 'TRANSFERRED'
                      ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 dark:bg-blue-500/10 dark:border-blue-500/30'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-1" />
                  Transferred
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, admission#..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchAdmissions()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={fetchAdmissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Admissions List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {statusFilter === 'ADMITTED' ? 'Active Admissions' : 
                 statusFilter === 'DISCHARGED' ? 'Discharged Patients' : 
                 'Transferred Patients'}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading admissions...</p>
              </div>
            ) : admissions.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No admissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bed / Ward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diagnosis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admissions.map((admission) => (
                      <tr key={admission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">
                            {admission.admissionNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {admission.patient.user.firstName} {admission.patient.user.lastName}
                            </div>
                            {admission.patient.user.gender && (
                              <div className="text-sm text-gray-500">
                                {admission.patient.user.gender}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {admission.bed ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {admission.bed.bedNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {admission.bed.ward.wardName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No bed assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(admission.admissionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getAdmissionTypeBadge(
                              admission.admissionType
                            )}`}
                          >
                            {admission.admissionType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {admission.primaryDiagnosis || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                              admission.status
                            )}`}
                          >
                            {admission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/dashboard/ipd/admissions/${admission.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </Link>
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
