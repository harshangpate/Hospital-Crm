'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/auth-store';
import { Calendar, FileText, Pill, Activity, Clock, AlertCircle, Heart, Sparkles } from 'lucide-react';
import { getAppointmentStats, getAppointments } from '@/lib/api/appointments';
import { getPrescriptions } from '@/lib/api/prescriptions';
import StatCardComponent from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import GradientButton from '@/components/ui/GradientButton';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    upcoming: 0,
    total: 0,
    completed: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load stats
      const statsResponse = await getAppointmentStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load upcoming appointments
      const appointmentsResponse = await getAppointments({
        limit: 3,
        status: 'SCHEDULED',
      });
      if (appointmentsResponse.success) {
        setUpcomingAppointments(appointmentsResponse.data.appointments);
      }

      // Load recent prescriptions
      const prescriptionsResponse = await getPrescriptions({
        limit: 2,
      });
      if (prescriptionsResponse.success) {
        const prescriptions = prescriptionsResponse.data?.prescriptions || prescriptionsResponse.data || [];
        setRecentPrescriptions(prescriptions);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextAppointment = () => {
    if (upcomingAppointments.length === 0) return 'No upcoming appointments';
    
    const next = upcomingAppointments[0];
    const date = new Date(next.appointmentDate);
    const isToday = date.toDateString() === new Date().toDateString();
    const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
    
    const dateStr = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `Next: ${dateStr} at ${next.appointmentTime}`;
  };

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white overflow-hidden"
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
                  Welcome back, {user?.firstName}! 👋
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-blue-100 text-lg"
                >
                  Here&apos;s your health overview for today
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardComponent
              icon={<Calendar className="w-6 h-6" />}
              title="Upcoming Appointments"
              value={isLoading ? '...' : stats.upcoming.toString()}
              gradient="from-blue-500 to-indigo-600"
              delay={0.1}
            />
            <StatCardComponent
              icon={<Pill className="w-6 h-6" />}
              title="Active Prescriptions"
              value="2"
              gradient="from-green-500 to-emerald-600"
              delay={0.2}
            />
            <StatCardComponent
              icon={<FileText className="w-6 h-6" />}
              title="Medical Records"
              value="12"
              gradient="from-purple-500 to-pink-600"
              delay={0.3}
            />
            <StatCardComponent
              icon={<Activity className="w-6 h-6" />}
              title="Total Appointments"
              value={isLoading ? '...' : stats.total.toString()}
              gradient="from-orange-500 to-red-600"
              delay={0.4}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Appointments */}
            <div className="lg:col-span-2">
              <AnimatedCard delay={0.5} className="backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Upcoming Appointments
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/dashboard/appointments')}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-all"
                  >
                    View All →
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"
                      />
                      <p className="text-gray-300 text-sm">Loading appointments...</p>
                    </motion.div>
                  ) : upcomingAppointments.length === 0 ? (
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
                      <p className="text-gray-300 mb-4">No upcoming appointments</p>
                      <GradientButton
                        onClick={() => router.push('/dashboard/appointments/book')}
                        variant="primary"
                        className="inline-flex"
                      >
                        Book Appointment
                      </GradientButton>
                    </motion.div>
                  ) : (
                    upcomingAppointments.map((apt: any, index: number) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <AppointmentCard
                          doctor={`Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`}
                          specialty={apt.doctor.specialization}
                          date={new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          time={apt.appointmentTime}
                          type={apt.type?.replace('_', ' ') || 'N/A'}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </AnimatedCard>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <AnimatedCard delay={0.6} className="backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Calendar className="w-5 h-5" />}
                      label="Book Appointment"
                      color="blue"
                      onClick={() => router.push('/dashboard/appointments/book')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<FileText className="w-5 h-5" />}
                      label="View Records"
                      color="purple"
                      onClick={() => router.push('/dashboard/medical-records')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Pill className="w-5 h-5" />}
                      label="Request Refill"
                      color="green"
                      onClick={() => router.push('/dashboard/prescriptions')}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ActionButton
                      icon={<Activity className="w-5 h-5" />}
                      label="Check Test Results"
                      color="orange"
                      onClick={() => router.push('/dashboard/lab-tests')}
                    />
                  </motion.div>
                </div>
              </AnimatedCard>

              {/* Health Reminders */}
              <AnimatedCard delay={0.7} className="backdrop-blur-sm bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-amber-500/30">
                <div className="flex items-center mb-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <AlertCircle className="w-5 h-5 text-amber-400 mr-2" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-amber-200">Reminders</h3>
                </div>
                <div className="space-y-2 text-sm text-amber-100">
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    • Take blood pressure medication at 8:00 AM
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    • Schedule annual physical exam
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    • Prescription refill needed in 5 days
                  </motion.p>
                </div>
              </AnimatedCard>
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className="backdrop-blur-sm bg-slate-800/50 border border-slate-700/50 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Prescriptions</h3>
              <button 
                onClick={() => router.push('/dashboard/prescriptions')}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                View All
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : recentPrescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-300">
                <Pill className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No prescriptions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentPrescriptions.map((prescription) => {
                  const firstItem = prescription.items?.[0];
                  const medication = firstItem?.medication;
                  const refillsLeft = (prescription.refillsAllowed || 0) - (prescription.refillsUsed || 0);
                  
                  return (
                    <PrescriptionCard
                      key={prescription.id}
                      medication={medication ? `${medication.name} ${medication.strength || ''}` : 'Prescription'}
                      doctor={prescription.doctor?.user ? `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}` : 'Doctor'}
                      frequency={firstItem?.frequency || 'As directed'}
                      refills={refillsLeft > 0 ? `${refillsLeft} refills left` : 'Needs refill'}
                      urgent={refillsLeft === 0}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AppointmentCard({
  doctor,
  specialty,
  date,
  time,
  type,
}: {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="flex items-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
    >
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mr-4 shadow-md"
      >
        <Calendar className="w-6 h-6 text-white" />
      </motion.div>
      <div className="flex-1">
        <div className="font-semibold text-white">{doctor}</div>
        <div className="text-sm text-gray-300">{specialty}</div>
        <div className="flex items-center mt-1 text-sm text-gray-400">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {date} at {time}
        </div>
      </div>
      <div className="ml-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          {type}
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

function PrescriptionCard({
  medication,
  doctor,
  frequency,
  refills,
  urgent,
}: {
  medication: string;
  doctor: string;
  frequency: string;
  refills: string;
  urgent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`p-4 rounded-xl border-2 ${urgent ? 'border-amber-500 bg-amber-900/30 shadow-amber-500/20 shadow-lg' : 'border-slate-600/50 bg-slate-700/30 shadow-sm hover:shadow-md'} transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-white">{medication}</div>
        {urgent && (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
          >
            Urgent
          </motion.span>
        )}
      </div>
      <div className="text-sm text-gray-300 mb-1">Prescribed by {doctor}</div>
      <div className="text-sm text-gray-400">{frequency}</div>
      <div className={`text-sm mt-2 font-medium ${urgent ? 'text-amber-300' : 'text-gray-300'}`}>
        {refills}
      </div>
    </motion.div>
  );
}
