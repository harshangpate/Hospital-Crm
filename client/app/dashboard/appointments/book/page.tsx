'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import GradientButton from '@/components/ui/GradientButton';
import { Calendar, Clock, User, FileText, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  createAppointment,
  getDoctorsBySpecialty,
  getAvailableSlots,
  getSpecializations,
} from '@/lib/api/appointments';

type Step = 'specialty' | 'doctor' | 'datetime' | 'details' | 'confirm';

export default function BookAppointmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('specialty');
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<string>('NEW_CONSULTATION');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Data
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Load specializations
  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      const response = await getSpecializations();
      if (response.success) {
        setSpecializations(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load specializations');
    }
  };

  // Load doctors when specialty is selected
  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors();
    }
  }, [selectedSpecialty]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await getDoctorsBySpecialty(selectedSpecialty);
      if (response.success) {
        setDoctors(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      setIsLoading(true);
      console.log('Loading slots for doctor:', selectedDoctor?.id, 'date:', selectedDate);
      const response = await getAvailableSlots(selectedDoctor.id, selectedDate);
      console.log('Available slots response:', response);
      
      if (response.success) {
        const slots = response.data?.slots || [];
        console.log('Slots array:', slots);
        setAvailableSlots(slots);
        
        if (slots.length === 0) {
          toast.info(response.data?.message || 'No available time slots for this date');
        }
      } else {
        toast.error(response.message || 'Failed to load available slots');
      }
    } catch (error: any) {
      console.error('Error loading slots:', error);
      toast.error(error.response?.data?.message || 'Failed to load available slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'specialty' && selectedSpecialty) {
      setCurrentStep('doctor');
    } else if (currentStep === 'doctor' && selectedDoctor) {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime' && selectedDate && selectedTime) {
      setCurrentStep('details');
    } else if (currentStep === 'details' && reason.length >= 10) {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'doctor') setCurrentStep('specialty');
    else if (currentStep === 'datetime') setCurrentStep('doctor');
    else if (currentStep === 'details') setCurrentStep('datetime');
    else if (currentStep === 'confirm') setCurrentStep('details');
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await createAppointment({
        doctorId: selectedDoctor.id,
        appointmentDate: new Date(selectedDate).toISOString(),
        appointmentTime: selectedTime,
        reason,
        notes,
        appointmentType: appointmentType as any,
      });

      if (response.success) {
        toast.success('Appointment booked successfully!');
        router.push('/dashboard/appointments');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <ProtectedRoute allowedRoles={['PATIENT', 'RECEPTIONIST', 'NURSE', 'ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600 mt-2">Schedule your medical consultation</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { key: 'specialty', label: 'Specialty' },
                { key: 'doctor', label: 'Doctor' },
                { key: 'datetime', label: 'Date & Time' },
                { key: 'details', label: 'Details' },
                { key: 'confirm', label: 'Confirm' },
              ].map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted =
                  (step.key === 'specialty' && selectedSpecialty) ||
                  (step.key === 'doctor' && selectedDoctor) ||
                  (step.key === 'datetime' && selectedDate && selectedTime) ||
                  (step.key === 'details' && reason);

                return (
                  <div key={step.key} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                      </div>
                      <span className="text-xs mt-2 text-gray-600">{step.label}</span>
                    </div>
                    {index < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Step 1: Select Specialty */}
            {currentStep === 'specialty' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl"
                  >
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Select Medical Specialty
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Choose the department you need</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {specializations.map((spec, index) => (
                    <motion.button
                      key={spec}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, translateY: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`p-5 rounded-xl border-2 text-left transition-all shadow-sm ${
                        selectedSpecialty === spec
                          ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`font-semibold ${selectedSpecialty === spec ? 'text-blue-700' : 'text-gray-900'}`}>
                        {spec}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Doctor */}
            {currentStep === 'doctor' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl"
                  >
                    <User className="w-6 h-6 text-green-600" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Select Doctor
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Choose your preferred doctor</p>
                  </div>
                </div>
                {isLoading ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
                    />
                    <p className="text-gray-500 mt-4">Loading doctors...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctors.filter(doctor => doctor.user).map((doctor, index) => (
                      <motion.button
                        key={doctor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`w-full p-5 rounded-xl border-2 text-left transition-all shadow-sm ${
                          selectedDoctor?.id === doctor.id
                            ? 'border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center">
                          <motion.div
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 ${
                              selectedDoctor?.id === doctor.id
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                            }`}
                          >
                            <User className={`w-7 h-7 ${selectedDoctor?.id === doctor.id ? 'text-white' : 'text-blue-600'}`} />
                          </motion.div>
                          <div className="flex-1">
                            <div className={`font-bold text-lg ${selectedDoctor?.id === doctor.id ? 'text-green-700' : 'text-gray-900'}`}>
                              Dr. {doctor.user.firstName} {doctor.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">{doctor.specialization}</div>
                            <div className="text-sm text-gray-500">{doctor.qualification}</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Select Date & Time */}
            {currentStep === 'datetime' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Select Date & Time
                </h2>
                <div className="space-y-6">
                  {/* Date Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime('');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots
                      </label>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No available time slots for this date.</p>
                          <p className="text-sm text-gray-400 mt-1">Please select a different date or contact the clinic.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                selectedTime === slot.time
                                  ? 'bg-blue-600 text-white'
                                  : slot.available
                                  ? 'bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Appointment Details */}
            {currentStep === 'details' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Appointment Details
                </h2>
                <div className="space-y-4">
                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      <option value="NEW_CONSULTATION">New Consultation</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="ROUTINE_CHECKUP">Routine Check-up</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="TELEMEDICINE">Telemedicine</option>
                    </select>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Visit *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Please describe your symptoms or reason for consultation (minimum 10 characters)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {reason.length}/500 characters
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Any additional information you'd like to share"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 'confirm' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Confirm Appointment
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Doctor</p>
                        <p className="font-medium text-gray-900">
                          Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Specialty</p>
                        <p className="font-medium text-gray-900">{selectedSpecialty}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-medium text-gray-900">{selectedTime}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-900">
                          {appointmentType.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Reason</p>
                        <p className="font-medium text-gray-900">{reason}</p>
                      </div>
                      {notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="font-medium text-gray-900">{notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-between mt-6 pt-6 border-t border-gray-200"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                disabled={currentStep === 'specialty'}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back
              </motion.button>
              {currentStep !== 'confirm' ? (
                <GradientButton
                  onClick={handleNext}
                  disabled={
                    (currentStep === 'specialty' && !selectedSpecialty) ||
                    (currentStep === 'doctor' && !selectedDoctor) ||
                    (currentStep === 'datetime' && (!selectedDate || !selectedTime)) ||
                    (currentStep === 'details' && reason.length < 10)
                  }
                  variant="primary"
                  className="px-8 py-3 text-lg font-semibold shadow-lg"
                >
                  Next Step
                </GradientButton>
              ) : (
                <GradientButton
                  onClick={handleSubmit}
                  loading={isLoading}
                  disabled={isLoading}
                  variant="success"
                  className="px-8 py-3 text-lg font-semibold shadow-lg"
                >
                  <Check className="w-5 h-5 mr-2 inline" />
                  Confirm Booking
                </GradientButton>
              )}
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
