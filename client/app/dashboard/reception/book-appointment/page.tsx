'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, Clock, User, FileText, ArrowLeft, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

type Step = 'patient' | 'specialty' | 'doctor' | 'datetime' | 'details' | 'confirm';

interface Patient {
  id: string;
  patientId: string;
  bloodGroup: string;
  registrationDate: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  patient: Patient;
}

interface Doctor {
  id: string;
  doctorId: string;
  userId: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function ReceptionBookAppointmentPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('patient');
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<User[]>([]);
  
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<string>('NEW_CONSULTATION');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Data
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string>('');

  // Search patients
  const searchPatients = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setPatientSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users?role=PATIENT&search=${query}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.users)) {
        // Just use the results from API - backend already does the search
        const validUsers = data.data.users.filter((user: User) => 
          user.firstName && user.patient
        );
        setPatientSearchResults(validUsers);
      } else {
        setPatientSearchResults([]);
      }
    } catch (error) {
      toast.error('Failed to search patients');
      setPatientSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load specializations when specialty step is reached
  useEffect(() => {
    if (currentStep === 'specialty') {
      loadSpecializations();
    }
  }, [currentStep]);

  const loadSpecializations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/specializations`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        setSpecializations(data.data);
      }
    } catch (error) {
      console.error('Error loading specializations:', error);
      toast.error('Failed to load specializations');
    } finally {
      setIsLoading(false);
    }
  };

  // Load doctors when specialty is selected
  useEffect(() => {
    if (selectedSpecialty && currentStep === 'doctor') {
      loadDoctors();
    }
  }, [selectedSpecialty, currentStep]);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/by-specialty?specialty=${selectedSpecialty}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setDoctors(data.data);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available time slots from backend
  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;

    setLoadingSlots(true);
    setSlotsMessage('');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/doctors/available-slots?doctorId=${selectedDoctor.doctorId}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableSlots(data.data.slots || []);
          if (data.data.message) {
            setSlotsMessage(data.data.message);
          }
        } else {
          toast.error(data.message || 'Failed to load time slots');
        }
      } else {
        toast.error('Failed to load available time slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctor, selectedDate, token]);

  useEffect(() => {
    if (selectedDoctor && selectedDate && currentStep === 'datetime') {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate, currentStep, fetchAvailableSlots]);

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime || !reason) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Combine date and time into ISO datetime string
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId: selectedPatient.patient.id,
            doctorId: selectedDoctor.id,
            appointmentDate: appointmentDateTime,
            appointmentTime: selectedTime,
            appointmentType,
            reason,
            notes
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Appointment booked successfully!');
        setTimeout(() => {
          router.push('/dashboard/reception/appointments');
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'patient':
        return selectedPatient !== null;
      case 'specialty':
        return selectedSpecialty !== '';
      case 'doctor':
        return selectedDoctor !== null;
      case 'datetime':
        return selectedDate !== '' && selectedTime !== '';
      case 'details':
        return reason.length >= 10;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    const steps: Step[] = ['patient', 'specialty', 'doctor', 'datetime', 'details', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: Step[] = ['patient', 'specialty', 'doctor', 'datetime', 'details', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600 mt-1">Schedule an appointment for a patient</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['patient', 'specialty', 'doctor', 'datetime', 'details', 'confirm'].map((step, index) => {
                const steps: Step[] = ['patient', 'specialty', 'doctor', 'datetime', 'details', 'confirm'];
                const currentIndex = steps.indexOf(currentStep);
                const isActive = step === currentStep;
                const isCompleted = index < currentIndex;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                      </div>
                      <p className="text-xs mt-2 capitalize">{step}</p>
                    </div>
                    {index < 5 && (
                      <div
                        className={`h-1 flex-1 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Step 1: Select Patient */}
            {currentStep === 'patient' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Patient</h2>
                
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, patient ID, email, or phone..."
                      value={patientSearchQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setPatientSearchQuery(query);
                        if (query.length >= 2) {
                          searchPatients(query);
                        } else {
                          setPatientSearchResults([]);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Selected Patient Display */}
                {selectedPatient && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {selectedPatient.patient.patientId}</p>
                        <p className="text-sm text-gray-600">Email: {selectedPatient.email}</p>
                        <p className="text-sm text-gray-600">Phone: {selectedPatient.phone}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPatient(null)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : patientSearchResults.length > 0 && !selectedPatient ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Found {patientSearchResults.length} patient(s)</p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {patientSearchResults.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            console.log('Selected patient:', patient);
                            setSelectedPatient(patient);
                            setPatientSearchQuery('');
                            setPatientSearchResults([]);
                          }}
                          className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">ID: {patient.patient.patientId}</p>
                              <p className="text-sm text-gray-600">{patient.email}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : patientSearchQuery.length >= 2 && !selectedPatient ? (
                  <div className="text-center py-8 text-gray-500">
                    No patients found. Try a different search term.
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 2: Select Specialty */}
            {currentStep === 'specialty' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Specialty</h2>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {specializations.map((specialty) => (
                      <button
                        key={specialty}
                        onClick={() => setSelectedSpecialty(specialty)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedSpecialty === specialty
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{specialty}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Doctor */}
            {currentStep === 'doctor' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Doctor</h2>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctors.filter(doctor => doctor.user).map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          selectedDoctor?.id === doctor.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              Dr. {doctor.user.firstName} {doctor.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{doctor.specialization}</div>
                            <div className="text-sm text-gray-500">
                              {doctor.qualification} • {doctor.experience} years exp.
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              ₹{doctor.consultationFee}
                            </div>
                            <div className="text-xs text-gray-500">Consultation Fee</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Select Date & Time */}
            {currentStep === 'datetime' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date & Time</h2>
                <div className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getTomorrowDate()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Appointment Time
                      </label>

                      {/* Loading State */}
                      {loadingSlots && (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Loading available time slots...</p>
                        </div>
                      )}

                      {/* Message from backend */}
                      {!loadingSlots && slotsMessage && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                          <p className="text-amber-800 text-sm">{slotsMessage}</p>
                        </div>
                      )}

                      {/* Time Slots */}
                      {!loadingSlots && availableSlots.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-2 rounded-lg border text-sm ${
                                selectedTime === slot.time
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : slot.available
                                  ? 'border-gray-200 hover:border-blue-300'
                                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No Slots Available */}
                      {!loadingSlots && !slotsMessage && availableSlots.length === 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No time slots available for this date</p>
                          <p className="text-sm text-gray-500 mt-1">Please select a different date</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Appointment Details */}
            {currentStep === 'details' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>
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
                      placeholder="Please describe the patient's symptoms or reason for consultation (minimum 10 characters)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {reason.length}/500 characters
                    </p>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {currentStep === 'confirm' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Appointment</h2>
                <div className="space-y-6">
                  {/* Patient Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">
                          {selectedPatient?.firstName} {selectedPatient?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Patient ID</p>
                        <p className="font-medium text-gray-900">{selectedPatient?.patient.patientId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{selectedPatient?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedPatient?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Doctor</h3>
                    <p className="font-medium text-gray-900">
                      Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedDoctor?.specialization}</p>
                  </div>

                  {/* Appointment Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Time</p>
                        <p className="font-medium text-gray-900">{selectedTime}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium text-gray-900">
                          {appointmentType.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Reason</p>
                        <p className="font-medium text-gray-900">{reason}</p>
                      </div>
                      {notes && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Notes</p>
                          <p className="font-medium text-gray-900">{notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 'patient'}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep !== 'confirm' ? (
                <button
                  onClick={goToNextStep}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
