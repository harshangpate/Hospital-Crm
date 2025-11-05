'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, User, Phone, Mail, MapPin, AlertCircle, FileText } from 'lucide-react';

interface PatientRecord {
  id: string;
  patientId: string;
  bloodGroup: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  allergies?: string;
  medicalHistory?: string;
  createdAt: string;
  patient: PatientRecord;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPatient(params.id as string);
    }
  }, [params.id]);

  const fetchPatient = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPatient(data.data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading patient details...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!patient) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto mt-20 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
            <p className="text-gray-600 mb-6">The patient you are looking for does not exist.</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{patient.patient.patientId}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/reception/check-in')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Check-In Patient
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Patient Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patient ID</p>
                    <p className="font-medium text-gray-900">{patient.patient.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium text-gray-900">
                      {new Date(patient.dateOfBirth).toLocaleDateString()} ({calculateAge(patient.dateOfBirth)} years)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Blood Group</p>
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-800 font-semibold rounded">
                      {patient.patient.bloodGroup}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registered On</p>
                    <p className="font-medium text-gray-900">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">{patient.email}</span>
                  </div>
                  {(patient.address || patient.city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-600 mt-1" />
                      <div>
                        {patient.address && <p className="text-gray-900">{patient.address}</p>}
                        {patient.city && patient.state && (
                          <p className="text-gray-900">
                            {patient.city}, {patient.state} {patient.zipCode}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              {(patient.allergies || patient.medicalHistory) && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Medical Information
                  </h2>
                  <div className="space-y-4">
                    {patient.allergies && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Allergies</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-900">{patient.allergies}</p>
                        </div>
                      </div>
                    )}
                    {patient.medicalHistory && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Medical History</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-gray-900">{patient.medicalHistory}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Emergency Contact & Quick Actions */}
            <div className="space-y-6">
              {/* Emergency Contact */}
              {patient.emergencyContactName && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Emergency Contact
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-orange-700">Name</p>
                      <p className="font-medium text-orange-900">{patient.emergencyContactName}</p>
                    </div>
                    {patient.emergencyContactPhone && (
                      <div>
                        <p className="text-sm text-orange-700">Phone</p>
                        <p className="font-medium text-orange-900">{patient.emergencyContactPhone}</p>
                      </div>
                    )}
                    {patient.emergencyContactRelation && (
                      <div>
                        <p className="text-sm text-orange-700">Relationship</p>
                        <p className="font-medium text-orange-900">{patient.emergencyContactRelation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard/reception/check-in')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Check-In Patient
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/appointments/book')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Book Appointment
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/medical-records?patientId=${patient.id}`)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    View Medical Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
