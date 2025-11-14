'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/auth-store';
import { getAppointmentStats, getAppointments } from '@/lib/api/appointments';
import { Users, Calendar, Clock, TrendingUp, FileText, Activity, Loader2, RefreshCw, Sparkles, Stethoscope } from 'lucide-react';
import StatCardComponent from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import GradientButton from '@/components/ui/GradientButton';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedToday: 0,
    pendingToday: 0,
    totalPatients: 0,
    avgWaitTime: '0 min',
    patientSatisfaction: '0'
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [waitingRoomPatients, setWaitingRoomPatients] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch doctor's stats and appointments
      const token = localStorage.getItem('token');
      const [statsResponse, appointmentsResponse] = await Promise.all([
        getAppointmentStats(),
        getAppointments({
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
          limit: 20
        })
      ]);

      if (statsResponse.success) {
        const data = statsResponse.data;
        setStats({
          todayAppointments: data.todayAppointments || 0,
          completedToday: data.completedToday || 0,
          pendingToday: (data.todayAppointments || 0) - (data.completedToday || 0),
          totalPatients: data.totalPatients || 0,
          avgWaitTime: data.avgWaitTime || '12 min',
          patientSatisfaction: data.patientSatisfaction || '4.8'
        });
      }

      if (appointmentsResponse.success) {
        const appointments = appointmentsResponse.data.appointments || [];
        setTodaySchedule(appointments);
        
        // Filter waiting room patients (CONFIRMED status)
        const waiting = appointments.filter((apt: any) => 
          apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED'
        ).slice(0, 5); // Show max 5 waiting patients
        setWaitingRoomPatients(waiting);

        // Fetch recent activities from multiple sources
        try {
          const activities: any[] = [];

          // Get doctor ID from user object
          const doctorId = user?.doctor?.id;
          console.log('Fetching activities for doctor ID:', doctorId);

          // Fetch recent prescriptions for this doctor
          const prescriptionsRes = await fetch(
            `http://localhost:5000/api/v1/prescriptions?${doctorId ? `doctorId=${doctorId}&` : ''}limit=10&page=1`, 
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          if (prescriptionsRes.ok) {
            const prescData = await prescriptionsRes.json();
            console.log('Prescriptions data:', prescData);
            if (prescData.success && prescData.data) {
              const prescriptions = Array.isArray(prescData.data) ? prescData.data : prescData.data.prescriptions || [];
              console.log('Found prescriptions:', prescriptions.length);
              prescriptions.slice(0, 5).forEach((presc: any) => {
                activities.push({
                  icon: 'prescription',
                  title: `Prescription written for ${presc.patient?.user?.firstName || 'Patient'} ${presc.patient?.user?.lastName || ''}`,
                  time: getRelativeTime(presc.issuedAt || presc.createdAt),
                  timestamp: new Date(presc.issuedAt || presc.createdAt).getTime(),
                  type: 'PRESCRIPTION'
                });
              });
            }
          }

          // Fetch recent lab tests for this doctor
          const labTestsRes = await fetch(
            `http://localhost:5000/api/v1/lab-tests?${doctorId ? `doctorId=${doctorId}&` : ''}limit=10`, 
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          if (labTestsRes.ok) {
            const labData = await labTestsRes.json();
            if (labData.success && labData.data) {
              const tests = Array.isArray(labData.data) ? labData.data : labData.data.labTests || [];
              tests.slice(0, 5).forEach((test: any) => {
                activities.push({
                  icon: 'lab',
                  title: `Lab test ordered for ${test.patient?.user?.firstName || 'Patient'} ${test.patient?.user?.lastName || ''}`,
                  time: getRelativeTime(test.createdAt),
                  timestamp: new Date(test.createdAt).getTime(),
                  type: 'LAB_TEST'
                });
              });
            }
          }

          // Fetch recent medical records for this doctor
          const medicalRecordsRes = await fetch(
            `http://localhost:5000/api/v1/medical-records?${doctorId ? `doctorId=${doctorId}&` : ''}limit=10`, 
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          if (medicalRecordsRes.ok) {
            const recordsData = await medicalRecordsRes.json();
            console.log('Medical records data:', recordsData);
            if (recordsData.success && recordsData.data) {
              const records = Array.isArray(recordsData.data) ? recordsData.data : recordsData.data.records || [];
              console.log('Found medical records:', records.length);
              records.slice(0, 5).forEach((record: any) => {
                activities.push({
                  icon: 'medical-record',
                  title: `Medical record created for ${record.patient?.user?.firstName || 'Patient'} ${record.patient?.user?.lastName || ''}`,
                  time: getRelativeTime(record.createdAt),
                  timestamp: new Date(record.createdAt).getTime(),
                  type: 'MEDICAL_RECORD'
                });
              });
            }
          }

          // Add completed consultations
          const recentCompleted = appointments
            .filter((apt: any) => apt.status === 'COMPLETED')
            .slice(0, 3)
            .map((apt: any) => ({
              icon: 'consultation',
              title: `Consultation completed for ${apt.patient.user.firstName} ${apt.patient.user.lastName}`,
              time: getRelativeTime(apt.updatedAt),
              timestamp: new Date(apt.updatedAt).getTime(),
              type: 'APPOINTMENT'
            }));
          
          activities.push(...recentCompleted);

          // Sort by timestamp (most recent first) and take top 5
          const sortedActivities = activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
          
          console.log('Total activities found:', activities.length);
          console.log('Sorted activities:', sortedActivities);
          setRecentActivities(sortedActivities);
        } catch (activityError) {
          console.error('Error fetching activities:', activityError);
          // Fallback to just completed appointments if other fetches fail
          const recentCompleted = appointments
            .filter((apt: any) => apt.status === 'COMPLETED')
            .slice(0, 3)
            .map((apt: any) => ({
              icon: 'consultation',
              title: `Consultation completed for ${apt.patient.user.firstName} ${apt.patient.user.lastName}`,
              time: getRelativeTime(apt.updatedAt),
              timestamp: new Date(apt.updatedAt).getTime(),
              type: 'APPOINTMENT'
            }));
          setRecentActivities(recentCompleted);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds to catch new activities
    const refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 seconds

    // Refresh when user returns to the page/tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadDashboardData]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      COMPLETED: 'completed',
      IN_PROGRESS: 'in-progress',
      CONFIRMED: 'waiting',
      SCHEDULED: 'scheduled',
      CANCELLED: 'cancelled',
      NO_SHOW: 'no-show'
    };
    return colors[status] || 'scheduled';
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const calculateWaitTime = (appointmentTime: string) => {
    const now = new Date();
    const aptTime = new Date(`${now.toDateString()} ${appointmentTime}`);
    const diffMs = now.getTime() - aptTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? `${diffMins} min` : 'On time';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['DOCTOR']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white overflow-hidden"
          >
            {/* Animated background circles */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative z-10 flex items-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold mb-2"
                >
                  {getGreeting()}, Dr. {user?.lastName}! 👨‍⚕️
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-green-100 text-lg"
                >
                  You have {stats.todayAppointments} {stats.todayAppointments === 1 ? 'appointment' : 'appointments'} scheduled for today
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardComponent
              icon={<Calendar className="w-6 h-6" />}
              title="Today's Appointments"
              value={stats.todayAppointments.toString()}
              gradient="from-blue-500 to-indigo-600"
              delay={0.1}
            />
            <StatCardComponent
              icon={<Users className="w-6 h-6" />}
              title="Total Patients"
              value={stats.totalPatients.toString()}
              gradient="from-green-500 to-emerald-600"
              delay={0.2}
            />
            <StatCardComponent
              icon={<Clock className="w-6 h-6" />}
              title="Avg. Wait Time"
              value={stats.avgWaitTime}
              gradient="from-purple-500 to-pink-600"
              delay={0.3}
            />
            <StatCardComponent
              icon={<TrendingUp className="w-6 h-6" />}
              title="Patient Satisfaction"
              value={stats.patientSatisfaction}
              gradient="from-orange-500 to-red-600"
              delay={0.4}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <AnimatedCard delay={0.5} className="backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Today&apos;s Schedule
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/dashboard/doctor/schedule?view=month')}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-all"
                  >
                    View Calendar →
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {todaySchedule.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      </motion.div>
                      <p className="text-gray-600">No appointments scheduled for today</p>
                    </motion.div>
                  ) : (
                    todaySchedule.map((appointment: any, index: number) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <AppointmentCard
                          patient={`${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`}
                          patientId={appointment.patient.patientId}
                          time={formatTime(appointment.appointmentTime)}
                          type={appointment.type?.replace('_', ' ') || 'N/A'}
                          status={getStatusColor(appointment.status)}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </AnimatedCard>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              <AnimatedCard delay={0.6} className="backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Users className="w-5 h-5" />}
                      label="View Patients"
                      color="blue"
                      onClick={() => router.push('/dashboard/appointments')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<FileText className="w-5 h-5" />}
                      label="Write Prescription"
                      color="green"
                      onClick={() => router.push('/dashboard/prescriptions/new')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Activity className="w-5 h-5" />}
                      label="Order Lab Tests"
                      color="purple"
                      onClick={() => router.push('/dashboard/lab-tests')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Calendar className="w-5 h-5" />}
                      label="Manage Schedule"
                      color="orange"
                      onClick={() => router.push('/dashboard/doctor/schedule')}
                    />
                  </motion.div>
                </div>
              </AnimatedCard>

              {/* Waiting Room */}
              <AnimatedCard delay={0.7} className="backdrop-blur-sm bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700/50">
                <h3 className="text-lg font-semibold text-blue-200 mb-4">Waiting Room</h3>
                <div className="space-y-3">
                  {waitingRoomPatients.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4"
                    >
                      <p className="text-sm text-blue-300">No patients waiting</p>
                    </motion.div>
                  ) : (
                    waitingRoomPatients.map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <WaitingPatient
                          name={`${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`}
                          waitTime={calculateWaitTime(appointment.appointmentTime)}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </AnimatedCard>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="backdrop-blur-sm bg-slate-800/50 border border-slate-700/50 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
              <button
                onClick={() => loadDashboardData()}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Refresh activities"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-300">No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    icon={
                      activity.icon === 'consultation' ? (
                        <Users className="w-5 h-5 text-purple-600" />
                      ) : activity.icon === 'prescription' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : activity.icon === 'medical-record' ? (
                        <FileText className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Activity className="w-5 h-5 text-green-600" />
                      )
                    }
                    title={activity.title}
                    time={activity.time}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AppointmentCard({
  patient,
  patientId,
  time,
  type,
  status,
}: {
  patient: string;
  patientId: string;
  time: string;
  type: string;
  status: string;
}) {
  const statusConfig = {
    completed: { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'text-white', label: 'Completed' },
    'in-progress': { bg: 'bg-gradient-to-r from-blue-500 to-indigo-500', text: 'text-white', label: 'In Progress' },
    waiting: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-white', label: 'Waiting' },
    scheduled: { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-white', label: 'Scheduled' },
  }[status] || { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-white', label: status };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="flex items-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer"
    >
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-4 shadow-md"
      >
        <Users className="w-6 h-6 text-white" />
      </motion.div>
      <div className="flex-1">
        <div className="font-semibold text-white">{patient}</div>
        <div className="text-sm text-gray-300">{patientId}</div>
        <div className="flex items-center mt-1 text-sm text-gray-400">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {time} • {type}
        </div>
      </div>
      <div className="ml-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </span>
      </div>
    </motion.div>
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
    blue: 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/60 border-blue-700/50',
    green: 'bg-green-900/40 text-green-200 hover:bg-green-900/60 border-green-700/50',
    purple: 'bg-purple-900/40 text-purple-200 hover:bg-purple-900/60 border-purple-700/50',
    orange: 'bg-orange-900/40 text-orange-200 hover:bg-orange-900/60 border-orange-700/50',
  }[color];

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 rounded-xl border ${colorClasses} font-medium text-sm transition-all shadow-sm hover:shadow-md`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );
}

function WaitingPatient({ name, waitTime }: { name: string; waitTime: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-600/50 hover:border-blue-400 cursor-pointer"
    >
      <span className="text-sm font-medium text-white">{name}</span>
      <span className="text-xs font-medium text-blue-400">{waitTime}</span>
    </motion.div>
  );
}

function ActivityItem({
  icon,
  title,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
}) {
  return (
    <div className="flex items-center p-3 bg-slate-700/30 rounded-lg">
      <div className="w-10 h-10 rounded-lg bg-slate-600/50 flex items-center justify-center mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-gray-400">{time}</div>
      </div>
    </div>
  );
}
