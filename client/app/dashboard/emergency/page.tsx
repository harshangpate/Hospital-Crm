'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  Clock,
  Bed,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  ListChecks,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getEmergencyStatistics } from '@/lib/api/emergency';

const TRIAGE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  LEVEL_1_RESUSCITATION: { bg: 'bg-red-500', text: 'text-white', icon: '🔴' },
  LEVEL_2_EMERGENT: { bg: 'bg-orange-500', text: 'text-white', icon: '🟠' },
  LEVEL_3_URGENT: { bg: 'bg-yellow-500', text: 'text-white', icon: '🟡' },
  LEVEL_4_LESS_URGENT: { bg: 'bg-green-500', text: 'text-white', icon: '🟢' },
  LEVEL_5_NON_URGENT: { bg: 'bg-blue-500', text: 'text-white', icon: '🔵' },
};

export default function EmergencyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getEmergencyStatistics();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-red-600" />
              Emergency Department Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time emergency department metrics and patient status
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          <button
            onClick={() => router.push('/dashboard/emergency/register')}
            className="bg-linear-to-br from-red-600 to-red-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <UserPlus className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold">Register Patient</h3>
            <p className="text-sm text-red-100 mt-1">Quick emergency registration</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/emergency/queue')}
            className="bg-linear-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <ListChecks className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold">View Queue</h3>
            <p className="text-sm text-blue-100 mt-1">Patient queue & assignments</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/emergency/beds')}
            className="bg-linear-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <Bed className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold">Bed Status</h3>
            <p className="text-sm text-green-100 mt-1">Emergency bed management</p>
          </button>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patients in ER</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.patientsInER || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Users className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Activity className="w-4 h-4 mr-2" />
              Active patients
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Waiting for Doctor</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.waitingForDoctor || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              Pending assessment
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Waiting Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.avgWaitingTime || 0}
                  <span className="text-lg ml-1">min</span>
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 mr-2" />
              Today's average
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bed Occupancy</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.bedOccupancy?.percentage || 0}%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Bed className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>
                {stats?.bedOccupancy?.occupied || 0} of {stats?.bedOccupancy?.total || 0} beds
              </span>
            </div>
          </motion.div>
        </div>

        {/* Triage Level Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Patients by Triage Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats?.byTriageLevel?.map((level: any) => {
              const triageConfig = TRIAGE_COLORS[level.triageLevel];
              return (
                <div
                  key={level.triageLevel}
                  className={`p-4 rounded-lg ${triageConfig?.bg || 'bg-gray-500'} ${
                    triageConfig?.text || 'text-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{triageConfig?.icon || '⚪'}</div>
                  <div className="text-3xl font-bold">{level._count}</div>
                  <div className="text-sm mt-1 opacity-90">
                    {level.triageLevel.replace('LEVEL_', 'Level ').replace('_', ' - ')}
                  </div>
                </div>
              );
            })}
            {(!stats?.byTriageLevel || stats.byTriageLevel.length === 0) && (
              <div className="col-span-5 text-center py-8 text-gray-600 dark:text-gray-400">
                No patients currently triaged
              </div>
            )}
          </div>
        </motion.div>

        {/* Critical Alerts */}
        {stats?.criticalPatients > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-400">
                  Critical Alert
                </h3>
                <p className="text-red-700 dark:text-red-300">
                  {stats.criticalPatients} critical patient(s) (Level 1 or 2) require immediate
                  attention
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Today's Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Today's Arrivals
            </h2>
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-blue-600">{stats?.arrivalsToday || 0}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Patients registered today</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Today's Dispositions
            </h2>
            {stats?.dispositionsToday && stats.dispositionsToday.length > 0 ? (
              <div className="space-y-3">
                {stats.dispositionsToday.map((disp: any) => (
                  <div
                    key={disp.disposition}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {disp.disposition.replace(/_/g, ' ')}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {disp._count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No dispositions yet today
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
