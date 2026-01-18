'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  LogOut, 
  User, 
  Calendar, 
  Bed,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  Printer
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface Admission {
  id: string;
  admissionNumber: string;
  admissionDate: string;
  status: string;
  primaryDiagnosis: string | null;
  reasonForAdmission: string;
  relativeName: string | null;
  relativePhone: string | null;
  patient: {
    id: string;
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      gender: string | null;
      dateOfBirth: string;
    };
  };
  bed: {
    bedNumber: string;
    ward: {
      wardName: string;
      wardType: string;
      chargesPerDay: number;
    };
  } | null;
}

interface DischargeData {
  dischargeDate: string;
  dischargeTime: string;
  dischargeSummary: string;
  finalDiagnosis: string;
  treatmentProvided: string;
  medicationsOnDischarge: string;
  followUpInstructions: string;
  followUpDate: string;
  dischargedBy: string;
  patientCondition: string;
  dischargeType: string;
}

export default function DischargePatientPage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params.id as string;
  const { user, token } = useAuthStore();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [dischargeTime, setDischargeTime] = useState(new Date().toTimeString().slice(0, 5));
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [treatmentProvided, setTreatmentProvided] = useState('');
  const [medicationsOnDischarge, setMedicationsOnDischarge] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [dischargedBy, setDischargedBy] = useState('');
  const [patientCondition, setPatientCondition] = useState('STABLE');
  const [dischargeType, setDischargeType] = useState('ROUTINE');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR'].includes(user.role)) {
      router.push('/dashboard');
    } else {
      setDischargedBy(`${user.firstName} ${user.lastName}`);
    }
  }, [user, router]);

  useEffect(() => {
    if (token && admissionId) {
      fetchAdmission();
    }
  }, [token, admissionId]);

  const fetchAdmission = async () => {
    if (!token || !admissionId) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admissions/${admissionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAdmission(result.data);
        setFinalDiagnosis(result.data.primaryDiagnosis || '');
      } else {
        alert('Failed to fetch admission details');
        router.push('/dashboard/ipd');
      }
    } catch (error) {
      console.error('Error fetching admission:', error);
      alert('Error fetching admission details');
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async () => {
    if (!token || !admissionId) return;

    // Validation
    if (!dischargeSummary.trim()) {
      alert('Please enter discharge summary');
      return;
    }

    if (!finalDiagnosis.trim()) {
      alert('Please enter final diagnosis');
      return;
    }

    if (!dischargedBy.trim()) {
      alert('Please enter discharging doctor name');
      return;
    }

    const confirmDischarge = confirm(
      `Are you sure you want to discharge ${admission?.patient.user.firstName} ${admission?.patient.user.lastName}?\n\n` +
      `This will:\n` +
      `1. Mark the admission as DISCHARGED\n` +
      `2. Free up the assigned bed\n` +
      `3. Generate final invoice\n` +
      `4. Create discharge summary`
    );

    if (!confirmDischarge) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admissions/${admissionId}/discharge`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dischargeDate: `${dischargeDate}T${dischargeTime}`,
            dischargeSummary,
            finalDiagnosis,
            treatmentProvided,
            medicationsOnDischarge,
            followUpInstructions,
            followUpDate: followUpDate || null,
            dischargedBy,
            patientCondition,
            dischargeType,
          }),
        }
      );

      if (response.ok) {
        alert('✅ Patient discharged successfully!\n\nDischarge summary has been created.');
        router.push('/dashboard/ipd');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert('Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !admission) {
    return (
      <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN', 'DOCTOR']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const daysAdmitted = Math.ceil(
    (new Date().getTime() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN', 'DOCTOR']}>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg shadow-lg p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <LogOut className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Discharge Patient</h1>
            </div>
            <p className="text-red-100">
              Complete discharge process for {admission.patient.user.firstName} {admission.patient.user.lastName}
            </p>
          </motion.div>

          {/* Patient Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {admission.patient.user.firstName} {admission.patient.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient ID</p>
                <p className="font-medium text-gray-900 dark:text-white">{admission.patient.patientId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admission Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{admission.admissionNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admission Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(admission.admissionDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Days Admitted</p>
                <p className="font-medium text-gray-900 dark:text-white">{daysAdmitted} days</p>
              </div>
              {admission.bed && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Bed</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {admission.bed.ward.wardName} - {admission.bed.bedNumber}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason for Admission</p>
                <p className="font-medium text-gray-900 dark:text-white">{admission.reasonForAdmission}</p>
              </div>
            </div>
          </motion.div>

          {/* Discharge Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discharge Details</h2>

            {/* Discharge Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discharge Date *
                </label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discharge Time *
                </label>
                <input
                  type="time"
                  value={dischargeTime}
                  onChange={(e) => setDischargeTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Patient Condition & Discharge Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient Condition *
                </label>
                <select
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="STABLE">Stable</option>
                  <option value="IMPROVED">Improved</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discharge Type *
                </label>
                <select
                  value={dischargeType}
                  onChange={(e) => setDischargeType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ROUTINE">Routine Discharge</option>
                  <option value="AGAINST_MEDICAL_ADVICE">Against Medical Advice</option>
                  <option value="TRANSFER">Transfer to Another Facility</option>
                  <option value="ABSCONDED">Absconded</option>
                  <option value="DEATH">Death</option>
                </select>
              </div>
            </div>

            {/* Final Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Final Diagnosis *
              </label>
              <textarea
                value={finalDiagnosis}
                onChange={(e) => setFinalDiagnosis(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter final diagnosis..."
              />
            </div>

            {/* Discharge Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discharge Summary *
              </label>
              <textarea
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Summarize the patient's hospital stay, treatment, and condition..."
              />
            </div>

            {/* Treatment Provided */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Treatment Provided
              </label>
              <textarea
                value={treatmentProvided}
                onChange={(e) => setTreatmentProvided(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="List treatments, procedures, surgeries performed during stay..."
              />
            </div>

            {/* Medications on Discharge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medications on Discharge
              </label>
              <textarea
                value={medicationsOnDischarge}
                onChange={(e) => setMedicationsOnDischarge(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="List all medications patient should continue taking..."
              />
            </div>

            {/* Follow-up Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-up Instructions
              </label>
              <textarea
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Provide instructions for post-discharge care and follow-up..."
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-up Appointment Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Discharged By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discharging Doctor *
              </label>
              <input
                type="text"
                value={dischargedBy}
                onChange={(e) => setDischargedBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter doctor name..."
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-200">Important Notice</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Discharging this patient will free up their assigned bed and generate the final invoice. 
                    Please ensure all outstanding bills are settled before discharge.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDischarge}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                {submitting ? 'Discharging...' : 'Confirm Discharge'}
              </button>
              <button
                onClick={() => router.back()}
                disabled={submitting}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
