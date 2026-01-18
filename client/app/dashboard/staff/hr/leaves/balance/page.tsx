'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Card3D from '@/components/ui/Card3D';
import ScrollReveal from '@/components/ui/ScrollReveal';

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

interface LeaveBalance {
  id: string;
  staffId: string;
  year: number;
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  maternityLeave: number;
  paternityLeave: number;
  usedCasual: number;
  usedSick: number;
  usedEarned: number;
  usedMaternity: number;
  usedPaternity: number;
}

interface StaffWithBalance extends Staff {
  leaveBalance: LeaveBalance | null;
}

export default function LeaveBalancePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffWithBalance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchStaffWithBalances();
    }
  }, [token, selectedYear]);

  const fetchStaffWithBalances = async () => {
    try {
      setLoading(true);

      // Fetch all staff
      const staffResponse = await fetch('http://localhost:5000/api/v1/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!staffResponse.ok) {
        throw new Error('Failed to fetch staff');
      }

      const staffData = await staffResponse.json();
      const staffList: Staff[] = staffData.data || [];

      // Fetch leave balance for each staff
      const staffWithBalances = await Promise.all(
        staffList.map(async (s) => {
          try {
            const balanceResponse = await fetch(
              `http://localhost:5000/api/v1/leaves/balance/${s.id}?year=${selectedYear}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              return { ...s, leaveBalance: balanceData.data };
            }
            return { ...s, leaveBalance: null };
          } catch (error) {
            console.error(`Error fetching balance for ${s.staffId}:`, error);
            return { ...s, leaveBalance: null };
          }
        })
      );

      setStaff(staffWithBalances);
    } catch (error: any) {
      console.error('Error fetching staff balances:', error);
      toast.error('Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const calculateTotalBalance = (balance: LeaveBalance | null) => {
    if (!balance) return 0;
    return (
      balance.casualLeave +
      balance.sickLeave +
      balance.earnedLeave
    );
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
                <TrendingUp className="h-8 w-8 text-green-600" />
                Leave Balance
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View remaining leave balance for all staff members
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
              </select>
            </div>
          </motion.div>

          {/* Search */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Leave Balance Table */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No staff found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Staff Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Casual Leave
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sick Leave
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Earned Leave
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStaff.map((s) => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {s.user.firstName[0]}{s.user.lastName[0]}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {s.user.firstName} {s.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {s.staffId} • {s.department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {s.leaveBalance?.casualLeave ?? 12}
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {s.leaveBalance?.sickLeave ?? 12}
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {s.leaveBalance?.earnedLeave ?? 15}
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              {s.leaveBalance ? calculateTotalBalance(s.leaveBalance) : 39}
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">days</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Legend */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Leave Balance Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Casual Leave</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">12 days/year</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sick Leave</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">12 days/year</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Earned Leave</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">15 days/year</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maternity/Paternity</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">180/7 days</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
