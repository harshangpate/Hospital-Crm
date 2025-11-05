'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Save, Calendar, Power, AlertCircle, CheckCircle, Loader2, Settings, DollarSign, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface DoctorAvailability {
  id: string;
  doctorId: string;
  specialization: string;
  isAvailable: boolean;
  availableFrom: string | null;
  availableTo: string | null;
  consultationFee: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function DoctorAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);

  // Form state
  const [isAvailable, setIsAvailable] = useState(true);
  const [consultationFee, setConsultationFee] = useState(0);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/my-availability`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAvailability(data.data);
          setIsAvailable(data.data.isAvailable);
          setConsultationFee(data.data.consultationFee || 0);
        }
      } else {
        toast.error('Failed to load availability settings');
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (consultationFee < 0) {
      toast.error('Consultation fee must be a positive number');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/my-availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isAvailable,
          consultationFee: parseFloat(consultationFee.toString()),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Availability updated successfully');
          loadAvailability();
        } else {
          toast.error(data.message || 'Failed to update availability');
        }
      } else {
        toast.error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['DOCTOR']}>
        <DashboardLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading availability settings...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Availability Settings</h1>
            <p className="text-gray-600">
              Manage your online status and consultation fee. For detailed schedule management, visit Schedule Management.
            </p>
          </div>

          {/* Quick Link to Schedule Management */}
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Need Detailed Schedule Control?</h3>
                <p className="text-blue-50 mb-4">
                  Set weekly hours, add breaks, surgery time, and manage blocked slots in Schedule Management
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard/doctor/schedule-management'}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  Go to Schedule Management
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <Settings className="w-20 h-20 text-blue-300 opacity-50" />
            </div>
          </div>

          {/* Doctor Info Card */}
          {availability && (
            <div className="bg-linear-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700 p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {availability.user.firstName[0]}{availability.user.lastName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Dr. {availability.user.firstName} {availability.user.lastName}
                  </h2>
                  <p className="text-gray-300">{availability.specialization}</p>
                  <p className="text-sm text-gray-400">ID: {availability.doctorId}</p>
                </div>
              </div>
            </div>
          )}

          {/* Availability Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Power className="w-6 h-6 text-gray-700" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Availability Status</h3>
                  <p className="text-sm text-gray-600">
                    Control whether patients can book appointments with you
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isAvailable ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isAvailable ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                isAvailable ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    You are currently accepting new appointments
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800 font-medium">
                    You are currently not accepting new appointments (existing appointments remain active)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Consultation Fee Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-gray-700" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Consultation Fee</h3>
                <p className="text-sm text-gray-600">
                  Set your fee for consultations (displayed to patients during booking)
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Current fee: <span className="font-semibold text-gray-900">₹{consultationFee.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How Availability Toggle Works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>ON:</strong> Patients can book new appointments according to your schedule</li>
                  <li>• <strong>OFF:</strong> New appointment bookings are disabled (you won&apos;t appear in available doctors)</li>
                  <li>• Existing confirmed appointments remain active regardless of this setting</li>
                  <li>• Use this for temporary unavailability (vacation, emergencies, etc.)</li>
                  <li>• For detailed weekly schedules and blocked slots, use <strong>Schedule Management</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
