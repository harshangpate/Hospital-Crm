'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  getAppointmentById, 
  cancelAppointment, 
  rescheduleAppointment,
  getAvailableSlots 
} from '@/lib/api/appointments';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  XCircle,
  Edit,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Stethoscope,
  CreditCard,
  Activity,
} from 'lucide-react';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Reschedule state
  const [newDate, setNewDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loadAppointment = async () => {
    setLoading(true);
    const response = await getAppointmentById(appointmentId);
    if (response.success) {
      setAppointment(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    const response = await cancelAppointment(appointmentId, cancelReason);
    
    if (response.success) {
      alert('Appointment cancelled successfully');
      loadAppointment();
      setShowCancel(false);
      setCancelReason('');
    } else {
      alert(response.message || 'Failed to cancel appointment');
    }
    
    setCancelling(false);
  };

  const handleDateChange = async (date: string) => {
    setNewDate(date);
    setSelectedSlot('');
    
    if (!appointment) return;

    setLoadingSlots(true);
    const response = await getAvailableSlots(appointment.doctor.id, date);
    
    if (response.success) {
      setAvailableSlots(response.data);
    }
    
    setLoadingSlots(false);
  };

  const handleReschedule = async () => {
    if (!newDate || !selectedSlot) {
      alert('Please select a new date and time slot');
      return;
    }

    if (!rescheduleReason.trim()) {
      alert('Please provide a reason for rescheduling');
      return;
    }

    setRescheduling(true);
    const response = await rescheduleAppointment(appointmentId, {
      appointmentDate: newDate,
      appointmentTime: selectedSlot,
      reason: rescheduleReason
    });

    if (response.success) {
      alert('Appointment rescheduled successfully');
      loadAppointment();
      setShowReschedule(false);
      setNewDate('');
      setSelectedSlot('');
      setRescheduleReason('');
    } else {
      alert(response.message || 'Failed to reschedule appointment');
    }

    setRescheduling(false);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
      CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200',
      RESCHEDULED: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status] || colors.SCHEDULED;
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      SCHEDULED: <Clock className="w-5 h-5" />,
      CONFIRMED: <CheckCircle className="w-5 h-5" />,
      IN_PROGRESS: <Activity className="w-5 h-5" />,
      COMPLETED: <CheckCircle className="w-5 h-5" />,
      CANCELLED: <XCircle className="w-5 h-5" />,
      NO_SHOW: <AlertCircle className="w-5 h-5" />,
      RESCHEDULED: <Edit className="w-5 h-5" />
    };
    return icons[status] || icons.SCHEDULED;
  };

  const canReschedule = () => {
    return appointment && ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
  };

  const canCancel = () => {
    return appointment && !['CANCELLED', 'COMPLETED'].includes(appointment.status);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
        <DashboardLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading appointment details...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!appointment) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Appointment Not Found</h3>
              <p className="text-gray-600 mb-6">The appointment you&apos;re looking for doesn&apos;t exist.</p>
              <button
                onClick={() => router.push('/dashboard/appointments')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Appointments
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
      <DashboardLayout>
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/appointments')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Appointments
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Details</h1>
                <p className="text-gray-600">Appointment #{appointment.appointmentNumber}</p>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
                <span className="font-semibold">{appointment.status?.replace('_', ' ') || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appointment Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Appointment Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="font-medium text-gray-900">{formatTime(appointment.appointmentTime)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Type</p>
                    <p className="font-medium text-gray-900">{appointment.type?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-medium text-gray-900">{appointment.status?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  
                  {appointment.reason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Reason for Visit</p>
                      <p className="text-gray-900">{appointment.reason}</p>
                    </div>
                  )}
                  
                  {appointment.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                      <p className="text-gray-900">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  Doctor Information
                </h3>
                
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {appointment.doctor.user.firstName[0]}{appointment.doctor.user.lastName[0]}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">
                      Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                    </h4>
                    <p className="text-gray-600 mb-3">{appointment.doctor.specialization}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.doctor.user.phone || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.doctor.user.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-700">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Consultation Fee: ${appointment.doctor.consultationFee}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-700">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.doctor.qualification}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Patient Information
                </h3>
                
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {appointment.patient.user.firstName[0]}{appointment.patient.user.lastName[0]}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">
                      {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                    </h4>
                    <p className="text-gray-600 mb-3">Patient ID: {appointment.patient.patientId}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.patient.user.phone || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.patient.user.email}</span>
                      </div>
                      
                      {appointment.patient.bloodGroup && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Blood Group: {appointment.patient.bloodGroup}</span>
                        </div>
                      )}
                      
                      {appointment.patient.user.address && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{appointment.patient.user.city}, {appointment.patient.user.state}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Notes */}
              {appointment.doctorNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Doctor&apos;s Notes
                  </h3>
                  <p className="text-gray-800">{appointment.doctorNotes}</p>
                </div>
              )}

              {/* Cancellation Reason */}
              {appointment.cancellationReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Cancellation Reason
                  </h3>
                  <p className="text-gray-800">{appointment.cancellationReason}</p>
                </div>
              )}
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-3">
                  {canReschedule() && (
                    <button
                      onClick={() => setShowReschedule(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                      Reschedule Appointment
                    </button>
                  )}
                  
                  {canCancel() && (
                    <button
                      onClick={() => setShowCancel(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Cancel Appointment
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Booked On</p>
                    <p className="font-medium text-gray-900">
                      {new Date(appointment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(appointment.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Consultation Fee</p>
                    <p className="font-medium text-gray-900">
                      ${appointment.doctor.consultationFee}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reschedule Modal */}
        {showReschedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Reschedule Appointment</h3>
              
              {/* New Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Slots */}
              {newDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time Slot
                  </label>
                  
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-600">Loading available slots...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No available slots for this date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                            selectedSlot === slot
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:border-blue-500'
                          }`}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rescheduling *
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={4}
                  placeholder="Please provide a reason for rescheduling..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReschedule}
                  disabled={rescheduling || !newDate || !selectedSlot || !rescheduleReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {rescheduling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Reschedule
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowReschedule(false);
                    setNewDate('');
                    setSelectedSlot('');
                    setRescheduleReason('');
                  }}
                  disabled={rescheduling}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Cancel Appointment</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Yes, Cancel Appointment
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCancel(false);
                    setCancelReason('');
                  }}
                  disabled={cancelling}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
