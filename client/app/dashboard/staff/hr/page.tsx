'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  UserCheck,
  UserX,
  ClipboardList,
  TrendingUp,
  Award,
  FileText,
  CalendarClock,
  Building2,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { staggerContainer, staggerItem } from '@/lib/animations';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';

interface HRStats {
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  pendingLeaves: number;
  upcomingShifts: number;
}

interface RecentActivity {
  id: string;
  type: 'attendance' | 'leave' | 'payroll' | 'performance';
  description: string;
  time: string;
  user: string;
}

export default function HRPortalPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<HRStats>({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
    upcomingShifts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchHRStats();
    }
  }, [token]);

  const fetchHRStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/v1/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff data');
      }

      const data = await response.json();
      const staff = data.data || [];
      
      // Calculate stats from actual staff data
      const totalStaff = staff.length;
      const today = new Date().toISOString().split('T')[0];
      
      // For now, use calculated values (will implement attendance API later)
      setStats({
        totalStaff,
        presentToday: Math.floor(totalStaff * 0.85), // 85% attendance rate
        absentToday: Math.floor(totalStaff * 0.08),
        onLeave: Math.floor(totalStaff * 0.07),
        pendingLeaves: 5,
        upcomingShifts: Math.floor(totalStaff * 1.5),
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'attendance',
          description: 'Morning shift attendance marked',
          time: '09:00 AM',
          user: 'System',
        },
        {
          id: '2',
          type: 'leave',
          description: 'Leave request approved for Dr. Smith',
          time: '10:30 AM',
          user: user?.firstName || 'HR Manager',
        },
        {
          id: '3',
          type: 'payroll',
          description: 'Payroll processed for December',
          time: 'Yesterday',
          user: 'Payroll System',
        },
      ]);
    } catch (error: any) {
      console.error('Error fetching HR stats:', error);
      setError(error.message || 'Failed to load HR data');
      toast.error('Failed to load HR dashboard data');
      
      // Fallback to demo data
      setStats({
        totalStaff: 110,
        presentToday: 95,
        absentToday: 8,
        onLeave: 7,
        pendingLeaves: 5,
        upcomingShifts: 24,
      });
    } finally {
      setLoading(false);
    }
  };

  const hrModules = [
    {
      title: 'Attendance Management',
      description: 'Track staff attendance, clock in/out, and generate attendance reports',
      icon: UserCheck,
      color: 'blue',
      route: '/dashboard/staff/hr/attendance',
      stats: `${stats.presentToday} Present Today`,
    },
    {
      title: 'Leave Management',
      description: 'Manage leave applications, approvals, and leave balance tracking',
      icon: Calendar,
      color: 'green',
      route: '/dashboard/staff/hr/leaves',
      stats: `${stats.pendingLeaves} Pending Requests`,
    },
    {
      title: 'Payroll Management',
      description: 'Process salaries, generate payslips, and manage deductions',
      icon: DollarSign,
      color: 'purple',
      route: '/dashboard/staff/hr/payroll',
      stats: 'Monthly Processing',
    },
    {
      title: 'Shift Scheduling',
      description: 'Create and manage staff shift rosters and duty assignments',
      icon: CalendarClock,
      color: 'orange',
      route: '/dashboard/staff/hr/shifts',
      stats: `${stats.upcomingShifts} Scheduled`,
    },
    {
      title: 'Performance Reviews',
      description: 'Conduct performance appraisals and track KPIs',
      icon: Award,
      color: 'pink',
      route: '/dashboard/staff/hr/performance',
      stats: 'Quarterly Reviews',
    },
    {
      title: 'Staff Directory',
      description: 'View complete staff information and organizational structure',
      icon: Users,
      color: 'indigo',
      route: '/dashboard/staff',
      stats: `${stats.totalStaff} Total Staff`,
    },
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Quick attendance entry',
      icon: Clock,
      route: '/dashboard/staff/hr/attendance/mark',
      color: 'bg-blue-600',
    },
    {
      title: 'Approve Leaves',
      description: 'Review pending requests',
      icon: ClipboardList,
      route: '/dashboard/staff/hr/leaves/pending',
      color: 'bg-green-600',
    },
    {
      title: 'Process Payroll',
      description: 'Generate payslips',
      icon: FileText,
      route: '/dashboard/staff/hr/payroll/process',
      color: 'bg-purple-600',
    },
    {
      title: 'Create Shift',
      description: 'Schedule new shift',
      icon: Briefcase,
      route: '/dashboard/staff/hr/shifts/create',
      color: 'bg-orange-600',
    },
  ];

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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                Human Resources Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage staff, attendance, leaves, payroll, and performance
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/staff/hr/reports')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                HR Reports
              </button>
              <button
                onClick={() => router.push('/dashboard/staff/create')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="h-5 w-5" />
                Add Staff
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading HR dashboard...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Error Loading Data</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={fetchHRStats}
                  className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {!loading && (
            <>
              {/* Statistics Cards */}
              <ScrollReveal>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
                >
                  <motion.div variants={staggerItem}>
                    <Card3D>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                              {stats.totalStaff}
                            </p>
                          </div>
                          <Users className="h-10 w-10 text-blue-600 opacity-80" />
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card3D>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Present Today</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                              {stats.presentToday}
                            </p>
                          </div>
                          <UserCheck className="h-10 w-10 text-green-600 opacity-80" />
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card3D>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Absent Today</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                              {stats.absentToday}
                            </p>
                          </div>
                          <UserX className="h-10 w-10 text-red-600 opacity-80" />
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card3D>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">On Leave</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                              {stats.onLeave}
                            </p>
                          </div>
                          <Calendar className="h-10 w-10 text-yellow-600 opacity-80" />
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card3D>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Leave Requests</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                              {stats.pendingLeaves}
                            </p>
                          </div>
                          <ClipboardList className="h-10 w-10 text-purple-600 opacity-80" />
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card3D>
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Shifts</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                              {stats.upcomingShifts}
                            </p>
                          </div>
                          <CalendarClock className="h-10 w-10 text-orange-600 opacity-80" />
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>
                </motion.div>
              </ScrollReveal>

          {/* Quick Actions */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => router.push(action.route)}
                    className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 hover:shadow-lg transition-all duration-300 text-left"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 ${action.color} opacity-10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300`} />
                    <action.icon className="h-8 w-8 text-gray-700 dark:text-gray-300 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* HR Modules */}
          <ScrollReveal>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                HR Management Modules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hrModules.map((module, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => router.push(module.route)}
                    className="group cursor-pointer"
                  >
                    <Card3D>
                      <div className="p-6 h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-lg bg-${module.color}-100 dark:bg-${module.color}-900/30`}>
                            <module.icon className={`h-8 w-8 text-${module.color}-600 dark:text-${module.color}-400`} />
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {module.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {module.description}
                        </p>
                        
                        <div className={`text-sm font-medium text-${module.color}-600 dark:text-${module.color}-400`}>
                          {module.stats}
                        </div>
                      </div>
                    </Card3D>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Today's Summary & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ScrollReveal className="lg:col-span-2">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg p-6 h-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Today&apos;s Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <UserCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.totalStaff > 0 ? ((stats.presentToday / stats.totalStaff) * 100).toFixed(1) : '0.0'}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Calendar className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Staff on Leave</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.onLeave}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <ClipboardList className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Actions</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stats.pendingLeaves}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Recent Activity */}
            <ScrollReveal>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'attendance' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          activity.type === 'leave' ? 'bg-green-100 dark:bg-green-900/30' :
                          activity.type === 'payroll' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-orange-100 dark:bg-orange-900/30'
                        }`}>
                          {activity.type === 'attendance' && <Clock className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'leave' && <Calendar className="h-4 w-4 text-green-600" />}
                          {activity.type === 'payroll' && <DollarSign className="h-4 w-4 text-purple-600" />}
                          {activity.type === 'performance' && <Award className="h-4 w-4 text-orange-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activity.time} • {activity.user}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
          </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
