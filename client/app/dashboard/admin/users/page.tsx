'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAllUsers, deleteUser, toggleUserStatus, getUserStats, type User, type UsersQuery } from '@/lib/api/users';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalStaff: 0,
    recentUsers: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    const query: UsersQuery = {
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      role: roleFilter !== 'ALL' ? roleFilter : undefined,
      status: statusFilter,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const [usersResponse, statsResponse] = await Promise.all([
      getAllUsers(query),
      getUserStats()
    ]);

    if (usersResponse.success && usersResponse.data) {
      setUsers(usersResponse.data.users);
      setTotalPages(usersResponse.data.pagination.totalPages);
      setTotalCount(usersResponse.data.pagination.total);
    }

    if (statsResponse.success && statsResponse.data) {
      setStats({
        totalUsers: statsResponse.data.totalUsers ?? 0,
        activeUsers: statsResponse.data.activeUsers ?? 0,
        inactiveUsers: statsResponse.data.inactiveUsers ?? 0,
        totalDoctors: statsResponse.data.totalDoctors ?? 0,
        totalPatients: statsResponse.data.totalPatients ?? 0,
        totalStaff: statsResponse.data.totalStaff ?? 0,
        recentUsers: statsResponse.data.recentUsers ?? 0,
      });
    }

    setLoading(false);
  }, [searchTerm, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (userId: string) => {
    const response = await toggleUserStatus(userId);
    if (response.success) {
      loadData();
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      const response = await deleteUser(userId);
      if (response.success) {
        loadData();
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      SUPER_ADMIN: 'bg-red-100 text-red-700',
      ADMIN: 'bg-purple-100 text-purple-700',
      DOCTOR: 'bg-blue-100 text-blue-700',
      NURSE: 'bg-green-100 text-green-700',
      RECEPTIONIST: 'bg-yellow-100 text-yellow-700',
      PHARMACIST: 'bg-pink-100 text-pink-700',
      LAB_TECHNICIAN: 'bg-cyan-100 text-cyan-700',
      RADIOLOGIST: 'bg-indigo-100 text-indigo-700',
      ACCOUNTANT: 'bg-orange-100 text-orange-700',
      PATIENT: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage all system users and their roles</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<UserCheck className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Doctors"
              value={stats.totalDoctors}
              icon={<Users className="w-6 h-6" />}
              color="purple"
            />
            <StatCard
              title="Patients"
              value={stats.totalPatients}
              icon={<Users className="w-6 h-6" />}
              color="orange"
            />
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="RADIOLOGIST">Radiologist</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="PATIENT">Patient</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {/* Add User Button */}
              <button
                onClick={() => router.push('/dashboard/admin/users/create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <AnimatedCard delay={0.3}>
            {loading ? (
              <div className="p-12 text-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
                />
                <p className="text-gray-500 mt-4">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-gray-600 text-lg">No users found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search term</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b-2 border-gray-600">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user, index) => (
                        <motion.tr 
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <motion.div 
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                              >
                                <span className="text-white font-semibold text-sm">
                                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </span>
                              </motion.div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <motion.span 
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getRoleBadgeColor(user.role)}`}
                            >
                              {user.role.replace('_', ' ')}
                            </motion.span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {user.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {user.isActive ? (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full shadow-sm"
                              >
                                <UserCheck className="w-3 h-3" />
                                Active
                              </motion.span>
                            ) : (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-700 bg-gradient-to-r from-red-100 to-pink-100 rounded-full shadow-sm"
                              >
                                <UserX className="w-3 h-3" />
                                Inactive
                              </motion.span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push(`/dashboard/admin/users/${user.id}/edit`)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm border border-blue-200 hover:border-blue-300"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleStatus(user.id)}
                                className={`p-2 ${user.isActive ? 'text-orange-600 hover:bg-orange-100 border-orange-200 hover:border-orange-300' : 'text-green-600 hover:bg-green-100 border-green-200 hover:border-green-300'} rounded-lg transition-colors shadow-sm border`}
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm border border-red-200 hover:border-red-300"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-200">
                    Showing <span className="font-medium">{users.length}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </motion.button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-200">
                      Page {currentPage} of {totalPages}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </AnimatedCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
