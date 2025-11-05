'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Save, Calendar, Bed, User, Stethoscope, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  patient: {
    id: string;
    patientId: string;
  };
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  doctor: {
    id: string;
    doctorId: string;
    specialization: string;
  };
}

interface Ward {
  id: string;
  wardNumber: string;
  wardName: string;
  wardType: string;
  chargesPerDay: number;
  beds: Bed[];
}

interface Bed {
  id: string;
  bedNumber: string;
  bedType: string;
  status: string;
}

export default function AdmitPatientPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [admissionType, setAdmissionType] = useState('PLANNED');
  const [reasonForAdmission, setReasonForAdmission] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [estimatedDischarge, setEstimatedDischarge] = useState('');
  const [relativeName, setRelativeName] = useState('');
  const [relativePhone, setRelativePhone] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchWards();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:5000/api/v1/users?role=PATIENT&limit=1000',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usersWithPatients = result.data.users.filter((u: any) => u.patient);
        setPatients(usersWithPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/users?role=DOCTOR&limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usersWithDoctors = result.data.users.filter((u: any) => u.doctor);
        setDoctors(usersWithDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchWards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/ipd/wards', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Wards data received:', result.data);
        console.log('Available beds:', result.data.flatMap((w: any) => w.beds.filter((b: any) => b.status === 'AVAILABLE')));
        setWards(result.data);
      } else {
        console.error('Failed to fetch wards:', response.status);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient || !selectedDoctor || !reasonForAdmission) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          attendingDoctorId: selectedDoctor,
          bedId: selectedBed || null,
          admissionType,
          reasonForAdmission,
          primaryDiagnosis: primaryDiagnosis || null,
          estimatedDischarge: estimatedDischarge || null,
          relativeName: relativeName || null,
          relativePhone: relativePhone || null,
          advancePayment: advancePayment ? parseFloat(advancePayment) : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Patient admitted successfully!');
        router.push(`/dashboard/ipd/admissions/${result.data.id}`);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to admit patient');
      }
    } catch (error) {
      console.error('Error admitting patient:', error);
      setError('An error occurred while admitting patient');
    } finally {
      setSubmitting(false);
    }
  };

  const availableBeds = useMemo(() => {
    console.log('Total wards:', wards.length);
    const allBeds: (Bed & { wardName: string; wardType: string; charges: number })[] = [];
    wards.forEach((ward) => {
      console.log(`Ward ${ward.wardName}: ${ward.beds.length} beds total`);
      const wardAvailableBeds = ward.beds.filter((bed) => bed.status === 'AVAILABLE');
      console.log(`Ward ${ward.wardName}: ${wardAvailableBeds.length} available beds`);
      wardAvailableBeds.forEach((bed) => {
        allBeds.push({
          ...bed,
          wardName: ward.wardName,
          wardType: ward.wardType,
          charges: ward.chargesPerDay,
        });
      });
    });
    console.log('Total available beds:', allBeds.length);
    
    // Sort beds by bed number
    allBeds.sort((a, b) => {
      return a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    return allBeds;
  }, [wards]);

  const selectedPatientData = patients.find((p) => p.patient.id === selectedPatient);
  const selectedDoctorData = doctors.find((d) => d.doctor.id === selectedDoctor);
  const selectedBedData = availableBeds.find((b) => b.id === selectedBed);

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/ipd"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to IPD Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-8 h-8 text-blue-600" />
              Admit New Patient
            </h1>
            <p className="text-gray-600 mt-1">Fill in the details to admit a patient</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Patient Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.patient.patientId}) -{' '}
                        {patient.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPatientData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Patient ID:</strong> {selectedPatientData.patient.patientId}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Email:</strong> {selectedPatientData.email}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Phone:</strong> {selectedPatientData.phone}
                    </p>
                    {selectedPatientData.gender && (
                      <p className="text-sm text-gray-700">
                        <strong>Gender:</strong> {selectedPatientData.gender}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Admission Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Admission Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={admissionType}
                    onChange={(e) => setAdmissionType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Discharge Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDischarge}
                    onChange={(e) => setEstimatedDischarge(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Admission <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reasonForAdmission}
                    onChange={(e) => setReasonForAdmission(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the reason for admission..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Diagnosis
                  </label>
                  <textarea
                    value={primaryDiagnosis}
                    onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter primary diagnosis..."
                  />
                </div>
              </div>
            </div>

            {/* Doctor Assignment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Attending Doctor
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName} ({doctor.doctor.specialization})
                    </option>
                  ))}
                </select>

                {selectedDoctorData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                    <p className="text-sm text-gray-700">
                      <strong>Doctor ID:</strong> {selectedDoctorData.doctor.doctorId}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Specialization:</strong> {selectedDoctorData.doctor.specialization}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bed Assignment */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-blue-600" />
                  Bed Assignment (Optional)
                </h2>
                <button
                  type="button"
                  onClick={fetchWards}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Beds'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bed
                </label>
                {loading ? (
                  <p className="text-gray-500">Loading beds...</p>
                ) : availableBeds.length === 0 ? (
                  <div className="text-red-600">
                    <p>No beds available</p>
                    <button
                      type="button"
                      onClick={fetchWards}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Click to refresh
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedBed}
                    onChange={(e) => setSelectedBed(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Assign Later --</option>
                    {availableBeds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        {bed.bedNumber} - {bed.wardName} ({bed.wardType}) - ${bed.charges}/day
                      </option>
                    ))}
                  </select>
                )}

                {selectedBedData && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-3">
                    <p className="text-sm text-gray-700">
                      <strong>Bed:</strong> {selectedBedData.bedNumber}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Ward:</strong> {selectedBedData.wardName} ({selectedBedData.wardType})
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Bed Type:</strong> {selectedBedData.bedType}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Charges:</strong> ${selectedBedData.charges}/day
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Relative/Guardian Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Relative/Guardian Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relative Name
                  </label>
                  <input
                    type="text"
                    value={relativeName}
                    onChange={(e) => setRelativeName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter relative name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relative Phone
                  </label>
                  <input
                    type="tel"
                    value={relativePhone}
                    onChange={(e) => setRelativePhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Payment ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/dashboard/ipd"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Admitting...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Admit Patient
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
