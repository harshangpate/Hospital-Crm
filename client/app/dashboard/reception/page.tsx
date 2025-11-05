'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Users, UserPlus, Calendar, Clock, Search, FileText, Activity, TrendingUp, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import StatCardComponent from '@/components/ui/StatCard';

interface ReceptionStats {
  todayCheckIns: number;
  pendingCheckIns: number;
  todayAppointments: number;
  walkInPatients: number;
  totalPatientsToday: number;
  averageWaitTime: number;
}

interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  appointmentTime?: string;
  checkInTime: string;
  status: string;
  doctorName?: string;
  purpose: string;
}

export default function ReceptionPortal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ReceptionStats>({
    todayCheckIns: 0,
    pendingCheckIns: 0,
    todayAppointments: 0,
    walkInPatients: 0,
    totalPatientsToday: 0,
    averageWaitTime: 0
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchStats();
    fetchQueue();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/reception/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/reception/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setQueue(data.data);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(item =>
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-8 text-white overflow-hidden"
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
                    Reception Portal 🏥
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-teal-100 text-lg"
                  >
                    Manage patient check-ins and queue
                  </motion.p>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
              >
                <button
                  onClick={() => router.push('/dashboard/reception/new-patient')}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 flex items-center gap-2 transition-all shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  New Patient
                </button>
                <button
                  onClick={() => router.push('/dashboard/reception/check-in')}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 flex items-center gap-2 transition-all shadow-lg"
                >
                  <Users className="w-5 h-5" />
                  Check-In
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCardComponent
              icon={<Users className="w-6 h-6" />}
              title="Today's Check-ins"
              value={stats.todayCheckIns.toString()}
              gradient="from-blue-500 to-indigo-600"
              delay={0.1}
            />
            <StatCardComponent
              icon={<Clock className="w-6 h-6" />}
              title="Pending"
              value={stats.pendingCheckIns.toString()}
              gradient="from-orange-500 to-red-600"
              delay={0.15}
            />
            <StatCardComponent
              icon={<Calendar className="w-6 h-6" />}
              title="Appointments"
              value={stats.todayAppointments.toString()}
              gradient="from-purple-500 to-pink-600"
              delay={0.2}
            />
            <StatCardComponent
              icon={<UserPlus className="w-6 h-6" />}
              title="Walk-ins"
              value={stats.walkInPatients.toString()}
              gradient="from-green-500 to-emerald-600"
              delay={0.25}
            />
            <StatCardComponent
              icon={<Activity className="w-6 h-6" />}
              title="Total Today"
              value={stats.totalPatientsToday.toString()}
              gradient="from-indigo-500 to-blue-600"
              delay={0.3}
            />
            <StatCardComponent
              icon={<TrendingUp className="w-6 h-6" />}
              title="Avg Wait Time"
              value={`${stats.averageWaitTime}m`}
              gradient="from-gray-500 to-slate-600"
              delay={0.35}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/dashboard/reception/check-in')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Patient Check-in</p>
              </button>

              <button
                onClick={() => router.push('/dashboard/reception/new-patient')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <UserPlus className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Register Patient</p>
              </button>

              <button
                onClick={() => router.push('/dashboard/reception/book-appointment')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Book Appointment</p>
              </button>

              <button
                onClick={() => router.push('/dashboard/reception/search')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
              >
                <Search className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Find Patient</p>
              </button>
            </div>
          </div>

          {/* Today's Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Queue</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading queue...</div>
              ) : filteredQueue.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No patients in queue</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.patientName}</p>
                            <p className="text-sm text-gray-500">{item.patientId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.type === 'APPOINTMENT' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.doctorName || 'Walk-in'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.purpose}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(item.checkInTime).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'WAITING' ? 'bg-orange-100 text-orange-800' :
                            item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/dashboard/reception/patient/${item.patientId}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
