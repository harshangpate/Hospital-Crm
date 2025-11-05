'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bed, User, Calendar, DollarSign, Building, MapPin, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Patient {
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Admission {
  id: string;
  admissionNumber: string;
  admissionDate: string;
  patient: Patient;
  status: string;
}

interface BedWithAdmission {
  id: string;
  bedNumber: string;
  bedType: string;
  status: string;
  admissions?: Admission[];
}

interface Ward {
  id: string;
  wardNumber: string;
  wardName: string;
  wardType: string;
  floor: number;
  capacity: number;
  occupiedBeds: number;
  chargesPerDay: number;
  facilities?: string;
  isActive: boolean;
  beds: BedWithAdmission[];
}

export default function WardDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <WardDetails />
    </ProtectedRoute>
  );
}

function WardDetails() {
  const params = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [ward, setWard] = useState<Ward | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchWardDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchWardDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/ipd/wards/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setWard(result.data);
      } else {
        console.error('Failed to fetch ward details');
      }
    } catch (error) {
      console.error('Error fetching ward details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'OCCUPIED':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'RESERVED':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="w-5 h-5" />;
      case 'OCCUPIED':
        return <XCircle className="w-5 h-5" />;
      case 'UNDER_MAINTENANCE':
        return <AlertTriangle className="w-5 h-5" />;
      case 'RESERVED':
        return <Clock className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getWardTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'GENERAL':
        return 'bg-blue-100 text-blue-800';
      case 'PRIVATE':
        return 'bg-purple-100 text-purple-800';
      case 'ICU':
        return 'bg-red-100 text-red-800';
      case 'EMERGENCY':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading ward details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ward) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-gray-600 mb-4">Ward not found</div>
          <Link href="/dashboard/ipd/beds" className="text-blue-600 hover:underline">
            Back to Bed Management
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const availableBeds = ward.capacity - ward.occupiedBeds;
  const occupancyPercentage = ((ward.occupiedBeds / ward.capacity) * 100).toFixed(0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/ipd/beds"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bed Management
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-8 h-8 text-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900">{ward.wardName}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getWardTypeColor(ward.wardType)}`}>
                    {ward.wardType}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Ward {ward.wardNumber} • Floor {ward.floor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>₹{ward.chargesPerDay}/day</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ward Statistics */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Beds</p>
                <p className="text-2xl font-bold text-gray-900">{ward.capacity}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">Available</p>
                <p className="text-2xl font-bold text-green-700">{availableBeds}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 mb-1">Occupied</p>
                <p className="text-2xl font-bold text-red-700">{ward.occupiedBeds}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Occupancy Rate</p>
                <p className="text-2xl font-bold text-blue-700">{occupancyPercentage}%</p>
              </div>
            </div>

            {/* Occupancy Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${occupancyPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Facilities */}
            {ward.facilities && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Facilities</h3>
                <p className="text-gray-600">{ward.facilities}</p>
              </div>
            )}
          </div>
        </div>

        {/* Beds Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bed className="w-6 h-6 text-blue-600" />
            Bed Details
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {ward.beds.map((bed) => {
              const admission = bed.admissions && bed.admissions.length > 0 ? bed.admissions[0] : null;
              
              return (
                <div
                  key={bed.id}
                  className={`border-2 rounded-lg p-4 transition-all hover:shadow-lg ${getStatusColor(bed.status)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bed.status)}
                      <span className="font-semibold">{bed.bedNumber}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs font-medium opacity-75">Type</p>
                      <p className="font-medium">{bed.bedType}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium opacity-75">Status</p>
                      <p className="font-medium capitalize">{bed.status.toLowerCase().replace('_', ' ')}</p>
                    </div>

                    {admission && (
                      <>
                        <div className="pt-2 border-t border-current border-opacity-20">
                          <p className="text-xs font-medium opacity-75 mb-1">
                            <User className="w-3 h-3 inline mr-1" />
                            Patient
                          </p>
                          <p className="font-semibold">
                            {admission.patient.user.firstName} {admission.patient.user.lastName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium opacity-75 mb-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Admitted
                          </p>
                          <p className="text-xs">
                            {new Date(admission.admissionDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium opacity-75">Admission #</p>
                          <p className="text-xs font-mono">{admission.admissionNumber}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {admission && (
                    <Link
                      href={`/dashboard/ipd/admissions/${admission.id}`}
                      className="mt-3 block text-center text-xs font-medium underline hover:opacity-75"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {ward.beds.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bed className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No beds found in this ward</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
