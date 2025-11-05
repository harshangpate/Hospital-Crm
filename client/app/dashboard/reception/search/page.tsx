'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, ArrowLeft, Eye, Phone, Mail, Calendar, User } from 'lucide-react';

interface PatientRecord {
  id: string;
  patientId: string;
  bloodGroup: string;
}

interface Patient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  city?: string;
  state?: string;
  patient: PatientRecord;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export default function PatientSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem('token');
      
      // Try searching for patients directly
      const response = await fetch(
        `http://localhost:5000/api/v1/users?role=PATIENT&search=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.users)) {
        // Just use the results from API - backend already does the search
        const validPatients = data.data.users.filter((patient: Patient) => 
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

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE']}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/reception')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Patients</h1>
              <p className="text-gray-600 mt-1">Find patient records by name, ID, phone, or email</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by patient name, ID, phone number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-32 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="w-6 h-6 text-gray-400 absolute left-4 top-4" />
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searched && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {loading ? 'Searching...' : `${searchResults.length} Patient${searchResults.length !== 1 ? 's' : ''} Found`}
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Searching patients...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No patients found</p>
                    <p className="text-gray-400 text-sm mt-2">Try different search terms</p>
                  </div>
                ) : (
                  searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0">
                              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-blue-600" />
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {patient.firstName} {patient.lastName}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  patient.gender === 'MALE' ? 'bg-blue-100 text-blue-800' :
                                  patient.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {patient.gender}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">ID:</span> {patient.patient.patientId}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  {patient.phone}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  {patient.email}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="font-medium">Age:</span> {calculateAge(patient.dateOfBirth)} years
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="font-medium">Blood:</span>
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold">
                                    {patient.patient.bloodGroup}
                                  </span>
                                </div>

                                {patient.city && patient.state && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="font-medium">Location:</span> {patient.city}, {patient.state}
                                  </div>
                                )}
                              </div>

                              {patient.emergencyContactName && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-orange-800 mb-1">Emergency Contact</p>
                                  <div className="flex gap-4 text-sm text-orange-900">
                                    <span>{patient.emergencyContactName}</span>
                                    {patient.emergencyContactPhone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {patient.emergencyContactPhone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/reception/check-in`)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Check-In
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quick Tips */}
          {!searched && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Search Tips</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Search by full or partial patient name</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Use patient ID for exact matches (e.g., PAT-12345)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Search by phone number or email address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Partial searches are supported for all fields</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
