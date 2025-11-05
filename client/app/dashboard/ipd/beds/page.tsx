'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bed, Search, Filter, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Ward {
  id: string;
  wardNumber: string;
  wardName: string;
  wardType: string;
  floor: number;
  capacity: number;
  occupiedBeds: number;
  chargesPerDay: number;
}

interface BedWithDetails {
  id: string;
  bedNumber: string;
  bedType: string;
  status: string;
  ward: Ward;
  admissions?: Array<{
    id: string;
    patient: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
    admissionDate: string;
  }>;
}

export default function BedManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [beds, setBeds] = useState<BedWithDetails[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchWards();
    fetchBeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWard, statusFilter]);

  const fetchWards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/ipd/wards', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setWards(result.data);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedWard) params.append('wardId', selectedWard);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `http://localhost:5000/api/v1/ipd/beds?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBeds(result.data);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncBedStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/ipd/sync-statuses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! Fixed ${result.data.bedsFixed} beds and updated ${result.data.wardsUpdated} wards.`);
        // Refresh the bed list
        fetchBeds();
        fetchWards();
      } else {
        alert('Failed to sync bed statuses');
      }
    } catch (error) {
      console.error('Error syncing bed statuses:', error);
      alert('Error syncing bed statuses');
    }
  };

  const createMissingBeds = async () => {
    if (!confirm('This will create bed records for wards that are missing them. Continue?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/ipd/create-missing-beds', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! Created ${result.data.totalBedsCreated} beds for ${result.data.wardsUpdated.length} wards.`);
        // Refresh the bed list
        fetchBeds();
        fetchWards();
      } else {
        alert('Failed to create missing beds');
      }
    } catch (error) {
      console.error('Error creating missing beds:', error);
      alert('Error creating missing beds');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'OCCUPIED':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'RESERVED':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="w-5 h-5" />;
      case 'OCCUPIED':
        return <XCircle className="w-5 h-5" />;
      case 'UNDER_MAINTENANCE':
        return <AlertTriangle className="w-5 h-5" />;
      case 'RESERVED':
        return <Clock className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const filteredBeds = beds.filter((bed) => {
    if (searchTerm) {
      return (
        bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.ward.wardName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const groupedByWard = filteredBeds.reduce((acc, bed) => {
    const wardId = bed.ward.id;
    if (!acc[wardId]) {
      acc[wardId] = {
        ward: bed.ward,
        beds: [],
      };
    }
    acc[wardId].beds.push(bed);
    return acc;
  }, {} as Record<string, { ward: Ward; beds: BedWithDetails[] }>);

  const stats = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
    maintenance: beds.filter((b) => b.status === 'UNDER_MAINTENANCE').length,
    reserved: beds.filter((b) => b.status === 'RESERVED').length,
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/ipd"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to IPD Dashboard
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Bed className="w-8 h-8 text-blue-600" />
                  Bed Management
                </h1>
                <p className="text-gray-600 mt-1">View and manage hospital bed status</p>
              </div>
              {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                <div className="flex gap-2">
                  <button
                    onClick={createMissingBeds}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Missing Beds
                  </button>
                  <button
                    onClick={syncBedStatuses}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Sync Bed Statuses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Beds</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <p className="text-sm text-green-600">Available</p>
              <p className="text-2xl font-bold text-green-700">{stats.available}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4">
              <p className="text-sm text-red-600">Occupied</p>
              <p className="text-2xl font-bold text-red-700">{stats.occupied}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <p className="text-sm text-yellow-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.maintenance}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-sm text-blue-600">Reserved</p>
              <p className="text-2xl font-bold text-blue-700">{stats.reserved}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Filter by Ward
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Wards</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.wardName} ({ward.wardType}) - Floor {ward.floor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by bed number..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bed Grid by Ward */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading beds...</p>
            </div>
          ) : Object.keys(groupedByWard).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No beds found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedByWard).map(({ ward, beds: wardBeds }) => (
                <div key={ward.id} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {ward.wardName} ({ward.wardNumber})
                        </h2>
                        <p className="text-sm text-gray-600">
                          Floor {ward.floor} • {ward.wardType} • ${ward.chargesPerDay}/day •{' '}
                          {ward.occupiedBeds}/{ward.capacity} occupied
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/ipd/wards/${ward.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {wardBeds.map((bed) => (
                        <div
                          key={bed.id}
                          className={`border-2 rounded-lg p-4 transition-all hover:shadow-lg cursor-pointer ${getStatusColor(
                            bed.status
                          )}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{bed.bedNumber}</span>
                            {getStatusIcon(bed.status)}
                          </div>
                          <p className="text-xs mb-1">{bed.bedType}</p>
                          <p className="text-xs font-semibold">{bed.status.replace('_', ' ')}</p>
                          {bed.admissions && bed.admissions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current">
                              <p className="text-xs font-medium">
                                {bed.admissions[0].patient.user.firstName}{' '}
                                {bed.admissions[0].patient.user.lastName}
                              </p>
                              <p className="text-xs">
                                Since {new Date(bed.admissions[0].admissionDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                <span className="text-sm text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                <span className="text-sm text-gray-700">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                <span className="text-sm text-gray-700">Under Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                <span className="text-sm text-gray-700">Reserved</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
