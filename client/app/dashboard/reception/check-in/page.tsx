'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, UserCheck, Calendar, Clock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface PatientRecord {
  id: string;
  patientId: string;
  bloodGroup: string;
}

interface PatientSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  patient: PatientRecord;
}

interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  doctor: {
    user: {
      firstName: string;
      lastName: string;
    };
    specialization: string;
  };
}

export default function CheckInPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'appointment' | 'walkin'>('appointment');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/users?role=PATIENT&search=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.users)) {
        // Just use the results from API - backend already does the search
        const validPatients = data.data.users.filter((patient: PatientSearchResult) => 
          patient.firstName && patient.patient
        );
        setSearchResults(validPatients);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = async (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');

    if (searchType === 'appointment') {
      // Fetch today's appointments for this patient
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/api/v1/appointments?patientId=${patient.id}&date=${new Date().toISOString().split('T')[0]}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();
        if (data.success) {
          setAppointments(data.data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!selectedPatient || !purpose) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // If checking in an existing appointment, update its status
      if (selectedAppointment) {
        const response = await fetch(`http://localhost:5000/api/v1/appointments/${selectedAppointment.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'CHECKED_IN'
          })
        });

        const data = await response.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard/reception');
          }, 2000);
        }
      } else {
        // For walk-ins, create a new appointment
        const response = await fetch('http://localhost:5000/api/v1/appointments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            appointmentDate: new Date().toISOString(),
            appointmentType: 'WALK_IN',
            reason: purpose,
            status: 'CHECKED_IN'
          })
        });

        const data = await response.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard/reception');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedPatient(null);
    setAppointments([]);
    setSelectedAppointment(null);
    setPurpose('');
    setSearchQuery('');
    setSearchResults([]);
    setSuccess(false);
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/reception')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Check-In</h1>
              <p className="text-gray-600 mt-1">Check in patients for appointments or walk-ins</p>
            </div>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Check-In Successful!</h3>
              <p className="text-green-700">Patient has been checked in successfully.</p>
              <button
                onClick={reset}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Check In Another Patient
              </button>
            </div>
          ) : (
            <>
              {/* Check-in Type Selection */}
              {!selectedPatient && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Check-In Type</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSearchType('appointment')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        searchType === 'appointment'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Appointment</p>
                      <p className="text-sm text-gray-500">Patient has scheduled appointment</p>
                    </button>

                    <button
                      onClick={() => setSearchType('walkin')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        searchType === 'walkin'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Walk-In</p>
                      <p className="text-sm text-gray-500">Patient without appointment</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Patient Search */}
              {!selectedPatient && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Patient</h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, patient ID, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    <button
                      onClick={searchPatients}
                      disabled={loading}
                      className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Search
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded-lg divide-y">
                      {searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => selectPatient(patient)}
                          className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{patient.patient.patientId}</p>
                              <p className="text-sm text-gray-500">{patient.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{patient.phone}</p>
                              <p className="text-sm text-gray-500">
                                {patient.patient.bloodGroup} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Patient & Appointments */}
              {selectedPatient && (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                      <button
                        onClick={reset}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Change Patient
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Patient Name</p>
                          <p className="font-medium text-gray-900">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Patient ID</p>
                          <p className="font-medium text-gray-900">{selectedPatient.patient.patientId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">{selectedPatient.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Blood Group</p>
                          <p className="font-medium text-gray-900">{selectedPatient.patient.bloodGroup}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointments (for appointment type) */}
                  {searchType === 'appointment' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Appointments</h2>
                      {appointments.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-900">No appointments today</p>
                            <p className="text-sm text-yellow-700">This patient has no scheduled appointments for today.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {appointments.map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                selectedAppointment?.id === apt.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">{apt.doctor.specialization}</p>
                                  <p className="text-sm text-gray-500 mt-1">{apt.appointmentNumber}</p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    {apt.appointmentTime}
                                  </div>
                                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                    apt.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                                    apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {apt.status}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purpose of Visit */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Purpose of Visit</h2>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Enter the purpose of visit (e.g., General Checkup, Follow-up, New Complaint)..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Check-In Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={reset}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckIn}
                      disabled={!purpose || loading || (searchType === 'appointment' && !selectedAppointment)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      <UserCheck className="w-5 h-5" />
                      {loading ? 'Checking In...' : 'Complete Check-In'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
