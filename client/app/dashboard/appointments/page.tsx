'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { Calendar, Clock, User, Search, Filter, Plus, X, Edit, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getAppointments, cancelAppointment } from '@/lib/api/appointments';
import { useAuthStore } from '@/lib/auth-store';

interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  appointmentType: string;
  reason: string;
  doctor: {
    user: {
      firstName: string;
      lastName: string;
    };
    specialization: string;
  };
  patient?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadAppointments();
  }, [currentPage, statusFilter]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const filters: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      const response = await getAppointments(filters);
      
      if (response.success) {
        setAppointments(response.data.appointments);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (error: any) {
      toast.error('Failed to load appointments');
      console.error('Load appointments error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancelingId(id);
      const response = await cancelAppointment(id, 'Cancelled by patient');
      
      if (response.success) {
        toast.success('Appointment cancelled successfully');
        loadAppointments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
      IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
      NO_SHOW: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'No Show' },
    };

    const config = statusConfig[status] || statusConfig.SCHEDULED;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = searchQuery.toLowerCase();
    const doctorName = `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`.toLowerCase();
    const patientName = apt.patient 
      ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}`.toLowerCase()
      : '';
    
    return (
      doctorName.includes(searchLower) ||
      patientName.includes(searchLower) ||
      apt.appointmentNumber.toLowerCase().includes(searchLower) ||
      apt.doctor.specialization.toLowerCase().includes(searchLower)
    );
  });

  const canCancelOrReschedule = (appointment: Appointment) => {
    return ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  };

  return (
    <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600 mt-1">Manage your medical appointments</p>
            </div>
            {user?.role === 'PATIENT' && (
              <button
                onClick={() => router.push('/dashboard/appointments/book')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book New Appointment
              </button>
            )}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by doctor, patient, or appointment number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredAppointments.length} of {total} appointments
            </div>
          </div>

          {/* Appointments List */}
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading appointments...</p>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'You have no appointments scheduled yet'}
                </p>
                {user?.role === 'PATIENT' && !searchQuery && (
                  <button
                    onClick={() => router.push('/dashboard/appointments/book')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Your First Appointment
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, translateY: -2 }}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Appointment Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.appointmentNumber}
                            </h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium">
                              Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{appointment.doctor.specialization}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {appointment.appointmentTime}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {appointment.appointmentType?.replace('_', ' ') || 'N/A'}
                        </div>
                      </div>

                      {appointment.reason && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <span className="font-medium">Reason:</span> {appointment.reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      {canCancelOrReschedule(appointment) && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all text-sm font-medium shadow-sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Reschedule
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancelingId === appointment.id}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelingId === appointment.id ? (
                              <>
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"
                                />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </>
                            )}
                          </motion.button>
                        </>
                      )}
                      {appointment.status === 'COMPLETED' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-lg"
                        >
                          View Details
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <AnimatedCard delay={0.4}>
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Previous
                </motion.button>
                <span className="text-sm font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </motion.button>
              </div>
            </AnimatedCard>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
