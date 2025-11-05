'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Stethoscope, Search, Filter, Eye, Calendar, ArrowLeft, Star, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface DoctorDetails {
  doctorId?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  licenseNumber?: string;
  consultationFee?: number;
  department?: string;
  designation?: string;
  isAvailable?: boolean;
  availableFrom?: string;
  availableTo?: string;
}

interface UserWithDoctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  doctor?: DoctorDetails;
}

interface Doctor {
  id: string;
  doctorId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization?: string;
  qualification?: string;
  licenseNumber?: string;
  experience?: number;
  experienceYears?: number;
  consultationFee?: number;
  availableDays?: string[];
  availableTimeStart?: string;
  availableTimeEnd?: string;
  availableFrom?: string;
  availableTo?: string;
  department?: string;
  designation?: string;
  isAvailable?: boolean;
  role?: string;
}

export default function DoctorsListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, specializationFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/users?role=DOCTOR', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Handle both array and object responses
        const usersArray = Array.isArray(data.data) ? data.data : (data.data.users || []);
        
        // Map the user data to flatten doctor information
        const doctorsArray = usersArray.map((user: UserWithDoctor) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          doctorId: user.doctor?.doctorId,
          specialization: user.doctor?.specialization,
          qualification: user.doctor?.qualification,
          experience: user.doctor?.experience,
          licenseNumber: user.doctor?.licenseNumber,
          consultationFee: user.doctor?.consultationFee,
          department: user.doctor?.department,
          designation: user.doctor?.designation,
          isAvailable: user.doctor?.isAvailable,
          availableFrom: user.doctor?.availableFrom,
          availableTo: user.doctor?.availableTo,
        }));
        
        setDoctors(doctorsArray);
        setFilteredDoctors(doctorsArray);
        
        // Extract unique specializations
        const uniqueSpecs = [...new Set(doctorsArray.map((d: Doctor) => d.specialization))].filter(Boolean) as string[];
        setSpecializations(uniqueSpecs);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(query) ||
        (d.doctorId && d.doctorId.toLowerCase().includes(query)) ||
        (d.specialization && d.specialization.toLowerCase().includes(query))
      );
    }

    if (specializationFilter) {
      filtered = filtered.filter(d => d.specialization === specializationFilter);
    }

    setFilteredDoctors(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSpecializationFilter('');
  };

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('doctorsDirectory')}</h1>
                <p className="text-gray-600 mt-1">
                  {filteredDoctors.length} {filteredDoctors.length !== 1 ? t('doctorsAvailable') : t('doctorAvailable')}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('filters')}</h2>
              {(searchQuery || specializationFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t('clearAll')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('searchDoctors')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('allSpecializations')}</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>{t('loadingDoctors')}</p>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="col-span-full p-8 text-center text-gray-500">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg">{t('noDoctorsFound')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('tryAdjustingFilters')}</p>
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Doctor Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Stethoscope className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{doctor.doctorId || 'N/A'}</p>
                      {doctor.department && (
                        <p className="text-xs text-gray-500 mt-1">{doctor.department}</p>
                      )}
                    </div>
                    {doctor.isAvailable !== undefined && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doctor.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.isAvailable ? 'Available' : 'Unavailable'}
                      </div>
                    )}
                  </div>

                  {/* Specialization */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                      {doctor.specialization || t('general')}
                    </span>
                    {doctor.designation && (
                      <span className="ml-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {doctor.designation}
                      </span>
                    )}
                  </div>

                  {/* Experience & Qualification */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    {(doctor.experience || doctor.experienceYears) && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{doctor.experience || doctor.experienceYears}</span> {t('yearsExp')}
                      </div>
                    )}
                    {doctor.qualification && (
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {doctor.qualification}
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <p className="truncate">{doctor.email}</p>
                    <p>{doctor.phone}</p>
                  </div>

                  {/* Availability */}
                  {((doctor.availableTimeStart && doctor.availableTimeEnd) || (doctor.availableFrom && doctor.availableTo)) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{t('availability')}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {doctor.availableTimeStart || doctor.availableFrom} - {doctor.availableTimeEnd || doctor.availableTo}
                      </p>
                      {doctor.availableDays && doctor.availableDays.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doctor.availableDays.map(day => (
                            <span key={day} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              {day}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Consultation Fee */}
                  {doctor.consultationFee && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600">{t('consultationFee')}</p>
                      <p className="text-xl font-bold text-gray-900">₹{doctor.consultationFee}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/doctors/${doctor.id}`)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t('viewProfile')}
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/reception/book-appointment?doctorId=${doctor.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      {t('book')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
