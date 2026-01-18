'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Activity,
  Award,
  TrendingUp,
} from 'lucide-react';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  specialization?: string;
  dateOfBirth?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  doctors: number;
  nurses: number;
  pharmacists: number;
  receptionists: number;
  labTechnicians: number;
}

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']}>
      <StaffContent />
    </ProtectedRoute>
  );
}

function StaffContent() {
  const { token } = useAuthStore();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [stats, setStats] = useState<StaffStats>({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    doctors: 0,
    nurses: 0,
    pharmacists: 0,
    receptionists: 0,
    labTechnicians: 0,
  });

  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'RECEPTIONIST',
    specialization: '',
    dateOfBirth: '',
    address: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/users?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        // The API returns { users: [], pagination: {} }
        const usersArray = data.data.users || [];
        
        // Only include actual staff roles (not admin/accountant/patient/super_admin)
        const staffRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'RADIOLOGIST'];
        const staffData = usersArray.filter(
          (user: { role: string }) => staffRoles.includes(user.role)
        );
        setStaff(staffData);
        calculateStats(staffData);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (staffData: StaffMember[]) => {
    const active = staffData.filter((s) => s.isActive).length;
    const inactive = staffData.filter((s) => !s.isActive).length;
    const doctors = staffData.filter((s) => s.role === 'DOCTOR').length;
    const nurses = staffData.filter((s) => s.role === 'NURSE').length;
    const pharmacists = staffData.filter((s) => s.role === 'PHARMACIST').length;
    const receptionists = staffData.filter((s) => s.role === 'RECEPTIONIST').length;
    const labTechnicians = staffData.filter(
      (s) => s.role === 'LAB_TECHNICIAN' || s.role === 'RADIOLOGIST'
    ).length;

    setStats({
      totalStaff: staffData.length,
      activeStaff: active,
      inactiveStaff: inactive,
      doctors,
      nurses,
      pharmacists,
      receptionists,
      labTechnicians,
    });
  };

  const filterStaff = () => {
    let filtered = [...staff];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone.includes(searchTerm)
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      filtered = filtered.filter((s) => s.isActive);
    } else if (statusFilter === 'INACTIVE') {
      filtered = filtered.filter((s) => !s.isActive);
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStaff),
      });

      const data = await response.json();
      if (data.success) {
        alert('Staff member added successfully!');
        setShowAddModal(false);
        setNewStaff({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'RECEPTIONIST',
          specialization: '',
          dateOfBirth: '',
          address: '',
        });
        fetchStaff();
      } else {
        alert(data.message || 'Failed to add staff member');
      }
    } catch (error) {
      alert('Error adding staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert('Staff member deleted successfully!');
        fetchStaff();
      } else {
        alert(data.message || 'Failed to delete staff member');
      }
    } catch (error) {
      alert('Error deleting staff member');
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/users/${staff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !staff.isActive }),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          `Staff member ${staff.isActive ? 'deactivated' : 'activated'} successfully!`
        );
        fetchStaff();
      }
    } catch (error) {
      alert('Error updating staff status');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      DOCTOR: 'bg-blue-100 text-blue-700',
      NURSE: 'bg-green-100 text-green-700',
      PHARMACIST: 'bg-purple-100 text-purple-700',
      LAB_TECHNICIAN: 'bg-orange-100 text-orange-700',
      RADIOLOGIST: 'bg-pink-100 text-pink-700',
      RECEPTIONIST: 'bg-cyan-100 text-cyan-700',
      ACCOUNTANT: 'bg-yellow-100 text-yellow-700',
      ADMIN: 'bg-red-100 text-red-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return <Activity className="w-4 h-4" />;
      case 'NURSE':
        return <UserCheck className="w-4 h-4" />;
      case 'PHARMACIST':
        return <Award className="w-4 h-4" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Staff Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage hospital staff, roles, and permissions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStaff}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Staff
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalStaff}</h3>
            <p className="text-sm text-gray-600 mt-1">Total Staff Members</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.activeStaff}</h3>
            <p className="text-sm text-gray-600 mt-1">Active Staff</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Doctors</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.doctors}</h3>
            <p className="text-sm text-gray-600 mt-1">Medical Doctors</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Nurses</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.nurses}</h3>
            <p className="text-sm text-gray-600 mt-1">Nursing Staff</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pharmacists</p>
                <p className="text-xl font-bold text-gray-800">{stats.pharmacists}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Receptionists</p>
                <p className="text-xl font-bold text-gray-800">{stats.receptionists}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lab Technicians</p>
                <p className="text-xl font-bold text-gray-800">{stats.labTechnicians}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">Doctors</option>
                <option value="NURSE">Nurses</option>
                <option value="PHARMACIST">Pharmacists</option>
                <option value="LAB_TECHNICIAN">Lab Technicians</option>
                <option value="RADIOLOGIST">Radiologists</option>
                <option value="RECEPTIONIST">Receptionists</option>
                <option value="ACCOUNTANT">Accountants</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredStaff.length}</span> of{' '}
              <span className="font-semibold">{stats.totalStaff}</span> staff members
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 flex items-center gap-1 text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm">
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No staff members found</p>
                      <p className="text-sm mt-1">
                        Try adjusting your filters or add a new staff member
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.specialization && (
                              <p className="text-sm text-gray-500">{member.specialization}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {member.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`p-2 ${
                              member.isActive
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            } rounded-lg transition`}
                            title={member.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {member.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Add New Staff Member
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                    <select
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="NURSE">Nurse</option>
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="LAB_TECHNICIAN">Lab Technician</option>
                      <option value="RADIOLOGIST">Radiologist</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                {(newStaff.role === 'DOCTOR' || newStaff.role === 'NURSE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={newStaff.specialization}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, specialization: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Cardiology, Pediatrics"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={newStaff.dateOfBirth}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={newStaff.address}
                    onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  >
                    {loading ? 'Adding...' : 'Add Staff Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
