'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/auth-store';
import { getUserStats } from '@/lib/api/users';
import { getAppointmentStats, getAppointments } from '@/lib/api/appointments';
import StatCard from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import GradientButton from '@/components/ui/GradientButton';
import { StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  UserPlus,
  Stethoscope,
  UserCog,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalDoctors: number;
    totalPatients: number;
    totalStaff: number;
    recentUsers: number;
  }>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalStaff: 0,
    recentUsers: 0
  });
  const [appointmentStats, setAppointmentStats] = useState<{
    totalToday: number;
    completedToday: number;
    pendingToday: number;
    totalAppointments: number;
  }>({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0,
    totalAppointments: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      // Load user statistics
      const userStatsResponse = await getUserStats();
      if (userStatsResponse.success && userStatsResponse.data) {
        setStats({
          totalUsers: userStatsResponse.data.totalUsers ?? 0,
          activeUsers: userStatsResponse.data.activeUsers ?? 0,
          inactiveUsers: userStatsResponse.data.inactiveUsers ?? 0,
          totalDoctors: userStatsResponse.data.totalDoctors ?? 0,
          totalPatients: userStatsResponse.data.totalPatients ?? 0,
          totalStaff: userStatsResponse.data.totalStaff ?? 0,
          recentUsers: userStatsResponse.data.recentUsers ?? 0,
        });
      }

      // Load appointment statistics for admin
      const appointmentStatsResponse = await getAppointmentStats();
      if (appointmentStatsResponse.success && appointmentStatsResponse.data) {
        setAppointmentStats(appointmentStatsResponse.data);
      }

      // Load recent appointments as activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentsResponse = await getAppointments({
        startDate: today.toISOString(),
        limit: 10
      });

      if (appointmentsResponse.success) {
        setRecentActivities(appointmentsResponse.data.appointments || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const calculateGrowth = (recent: number, total: number) => {
    if (total === 0 || !recent || !total) return '0%';
    const percentage = ((recent / total) * 100).toFixed(0);
    return `+${percentage}%`;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <DashboardLayout>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="space-y-8 p-6">
          {/* Welcome Section with Animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl"
          >
            {/* Animated Background Circles */}
            <motion.div
              className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full"
              animate={{
                scale: [1.2, 1, 1.2],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-8 h-8" />
                </motion.div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user?.firstName}!
                </h1>
              </div>
              <p className="text-purple-100 text-lg">
                Here's what's happening with your hospital today.
              </p>
            </div>
          </motion.div>

          {/* Key Metrics with Modern StatCards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Users className="w-8 h-8" />}
              title="Total Patients"
              value={formatNumber(stats.totalPatients)}
              trend={{ value: 12, isPositive: true }}
              gradient="from-blue-500 to-cyan-600"
              delay={0}
            />
            <StatCard
              icon={<Stethoscope className="w-8 h-8" />}
              title="Total Doctors"
              value={formatNumber(stats.totalDoctors)}
              trend={{ value: 8, isPositive: true }}
              gradient="from-green-500 to-emerald-600"
              delay={0.1}
            />
            <StatCard
              icon={<Calendar className="w-8 h-8" />}
              title="Today's Appointments"
              value={formatNumber(appointmentStats.totalToday)}
              trend={{ value: 15, isPositive: true }}
              gradient="from-purple-500 to-pink-600"
              delay={0.2}
            />
            <StatCard
              icon={<UserCheck className="w-8 h-8" />}
              title="Active Users"
              value={formatNumber(stats.activeUsers)}
              trend={{ value: 5, isPositive: true }}
              gradient="from-orange-500 to-red-600"
              delay={0.3}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <AnimatedCard delay={0.4}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Activity className="w-6 h-6 text-purple-600" />
                      Recent Appointments
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Latest activity in the system</p>
                  </div>
                  <GradientButton
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/dashboard/appointments')}
                  >
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </GradientButton>
                </div>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-16">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-gray-500 font-medium">No recent appointments</p>
                    <p className="text-sm text-gray-400 mt-1">Appointments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.slice(0, 8).map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                      >
                        <ActivityItem
                          icon={<Calendar className="w-5 h-5 text-purple-600" />}
                          title={`Appointment ${appointment.status.toLowerCase()}`}
                          description={`${appointment.patient.user.firstName} ${appointment.patient.user.lastName} with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`}
                          time={new Date(appointment.createdAt).toLocaleDateString()}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatedCard>

              {/* System Statistics */}
              <AnimatedCard delay={0.5} className="mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  System Overview
                </h3>
                <div className="space-y-4">
                  <StatBar 
                    label="Total Users" 
                    value={stats.totalUsers || 0} 
                    color="blue" 
                  />
                  <StatBar 
                    label="Active Users" 
                    value={stats.activeUsers || 0} 
                    color="green" 
                    percentage={stats.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100) : 0}
                  />
                  <StatBar 
                    label="Doctors" 
                    value={stats.totalDoctors || 0} 
                    color="purple" 
                  />
                  <StatBar 
                    label="Patients" 
                    value={stats.totalPatients || 0} 
                    color="orange" 
                  />
                  <StatBar 
                    label="Staff Members" 
                    value={stats.totalStaff || 0} 
                    color="pink" 
                  />
                </div>
              </AnimatedCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <AnimatedCard delay={0.6}>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<UserPlus className="w-5 h-5" />}
                      label="Create New User"
                      color="blue"
                      onClick={() => router.push('/dashboard/admin/users/create')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<UserCog className="w-5 h-5" />}
                      label="Manage Users"
                      color="green"
                      onClick={() => router.push('/dashboard/admin/users')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Calendar className="w-5 h-5" />}
                      label="View Appointments"
                      color="purple"
                      onClick={() => router.push('/dashboard/appointments')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Activity className="w-5 h-5" />}
                      label="System Reports"
                      color="orange"
                      onClick={() => router.push('/dashboard/reports')}
                    />
                  </motion.div>
                </div>
              </AnimatedCard>

              {/* Appointment Statistics */}
              <AnimatedCard delay={0.7}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-3">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Today's Schedule</h3>
                    <p className="text-sm text-gray-500">Appointment Overview</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <QuickStat
                      label="Total Today"
                      value={(appointmentStats.totalToday || 0).toString()}
                      icon={<Calendar className="w-4 h-4" />}
                      gradient="from-blue-500 to-cyan-600"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <QuickStat
                      label="Completed"
                      value={(appointmentStats.completedToday || 0).toString()}
                      icon={<Activity className="w-4 h-4" />}
                      gradient="from-green-500 to-emerald-600"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <QuickStat
                      label="Pending"
                      value={(appointmentStats.pendingToday || 0).toString()}
                      icon={<Clock className="w-4 h-4" />}
                      gradient="from-orange-500 to-red-600"
                    />
                  </motion.div>
                </div>
              </AnimatedCard>

              {/* User Statistics */}
              <AnimatedCard delay={0.8}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">User Insights</h3>
                    <p className="text-sm text-gray-500">System Activity</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <QuickStat 
                      label="Total Users" 
                      value={(stats.totalUsers || 0).toString()} 
                      icon={<Users className="w-4 h-4" />}
                      gradient="from-purple-500 to-pink-600"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <QuickStat 
                      label="Active Users" 
                      value={(stats.activeUsers || 0).toString()} 
                      icon={<UserCheck className="w-4 h-4" />}
                      gradient="from-green-500 to-teal-600"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    <QuickStat 
                      label="New (30 days)" 
                      value={(stats.recentUsers || 0).toString()} 
                      icon={<TrendingUp className="w-4 h-4" />}
                      gradient="from-cyan-500 to-blue-600"
                    />
                  </motion.div>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatBar({
  label,
  value,
  color,
  percentage,
}: {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
  }[color];

  const displayPercentage = percentage || 80;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-bold text-gray-900"
        >
          {value}
        </motion.span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${displayPercentage}%` }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="group flex items-start p-4 bg-white dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-4 shrink-0 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">{title}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{description}</div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {time}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
  }[color];

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center px-5 py-4 rounded-xl bg-gradient-to-r ${colorClasses} text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] group`}
    >
      <span className="group-hover:scale-110 transition-transform duration-300">{icon}</span>
      <span className="ml-3 flex-1 text-left">{label}</span>
      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}

function QuickStat({
  label,
  value,
  icon,
  gradient = 'from-gray-500 to-gray-700',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br p-[2px] hover:scale-[1.02] transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-100`} />
      <div className="relative bg-white rounded-[10px] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{value}</span>
        </div>
      </div>
    </div>
  );
}
