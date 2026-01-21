'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Home,
  Building,
  UserX,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getEmergencyVisitById, createDisposition } from '@/lib/api/emergency';

const DISPOSITION_OPTIONS = [
  {
    value: 'DISCHARGE_HOME',
    label: 'Discharge Home',
    icon: Home,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-500',
    description: 'Patient stable, can be discharged',
  },
  {
    value: 'ADMIT_TO_IPD',
    label: 'Admit to IPD',
    icon: Building,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500',
    description: 'Requires inpatient admission',
  },
  {
    value: 'ADMIT_TO_ICU',
    label: 'Admit to ICU',
    icon: AlertCircle,
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-500',
    description: 'Critical care required',
  },
  {
    value: 'TRANSFER_TO_ANOTHER_FACILITY',
    label: 'Transfer to Another Facility',
    icon: Building,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-500',
    description: 'Transfer for specialized care',
  },
  {
    value: 'LEFT_AGAINST_MEDICAL_ADVICE',
    label: 'Left Against Medical Advice',
    icon: UserX,
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-500',
    description: 'Patient left AMA',
  },
  {
    value: 'DECEASED',
    label: 'Deceased',
    icon: AlertCircle,
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-500',
    description: 'Patient expired',
  },
];

export default function DispositionPage() {
  const params = useParams();
  const router = useRouter();
  const emergencyVisitId = params?.emergencyVisitId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visit, setVisit] = useState<any>(null);

  const [formData, setFormData] = useState({
    disposition: 'DISCHARGE_HOME',
    dispositionNotes: '',
    dischargeInstructions: '',
    followUpAdvice: '',
    conditionOnDischarge: 'Improved',
    followUpRequired: false,
    followUpDate: '',
    transferredTo: '',
    estimatedCost: '',
    actualCost: '',
  });

  useEffect(() => {
    fetchVisit();
  }, [emergencyVisitId]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      const response = await getEmergencyVisitById(emergencyVisitId);
      setVisit(response.data.data);
    } catch (error) {
      console.error('Error fetching visit:', error);
      alert('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.disposition) {
      alert('Please select a disposition');
      return;
    }

    if (
      formData.disposition === 'TRANSFER_TO_ANOTHER_FACILITY' &&
      !formData.transferredTo
    ) {
      alert('Please specify the facility to transfer to');
      return;
    }

    try {
      setSubmitting(true);

      const data: any = {
        disposition: formData.disposition,
        dispositionNotes: formData.dispositionNotes || undefined,
        dischargeInstructions: formData.dischargeInstructions || undefined,
        followUpAdvice: formData.followUpAdvice || undefined,
        conditionOnDischarge: formData.conditionOnDischarge || undefined,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || undefined,
        transferredTo: formData.transferredTo || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
      };

      await createDisposition(emergencyVisitId, data);
      alert('Disposition completed successfully!');
      router.push('/dashboard/emergency/queue');
    } catch (error: any) {
      console.error('Disposition error:', error);
      alert(error.response?.data?.message || 'Failed to complete disposition');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading visit details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedDisposition = DISPOSITION_OPTIONS.find(
    (opt) => opt.value === formData.disposition
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-600" />
            Patient Disposition
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete emergency visit and determine next course of action
          </p>
        </motion.div>

        {/* Patient Info */}
        {visit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {visit.patient?.user?.firstName} {visit.patient?.user?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Visit: {visit.visitNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Final Diagnosis</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {visit.finalDiagnosis || visit.provisionalDiagnosis || 'Not specified'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Disposition Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Disposition Type *
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DISPOSITION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('disposition', option.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.disposition === option.value
                        ? `${option.color} border-2`
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <div className="font-semibold text-sm mb-1">{option.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Discharge Details */}
          {(formData.disposition === 'DISCHARGE_HOME' ||
            formData.disposition === 'ADMIT_TO_IPD' ||
            formData.disposition === 'ADMIT_TO_ICU') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Discharge Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition on Discharge/Admission
                </label>
                <select
                  value={formData.conditionOnDischarge}
                  onChange={(e) => handleInputChange('conditionOnDischarge', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Improved">Improved</option>
                  <option value="Same">Same</option>
                  <option value="Deteriorated">Deteriorated</option>
                  <option value="Stable">Stable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discharge Instructions
                </label>
                <textarea
                  value={formData.dischargeInstructions}
                  onChange={(e) => handleInputChange('dischargeInstructions', e.target.value)}
                  rows={4}
                  placeholder="Detailed instructions for patient care at home..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Follow-up Advice
                </label>
                <textarea
                  value={formData.followUpAdvice}
                  onChange={(e) => handleInputChange('followUpAdvice', e.target.value)}
                  rows={3}
                  placeholder="When to return, warning signs, follow-up appointments..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Follow-up appointment required
                  </span>
                </label>
              </div>

              {formData.followUpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.followUpDate}
                    onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Transfer Details */}
          {formData.disposition === 'TRANSFER_TO_ANOTHER_FACILITY' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transfer Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transfer To (Facility Name) *
                </label>
                <input
                  type="text"
                  value={formData.transferredTo}
                  onChange={(e) => handleInputChange('transferredTo', e.target.value)}
                  required
                  placeholder="Name of hospital/facility"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>
          )}

          {/* Notes & Billing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              Additional Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disposition Notes
              </label>
              <textarea
                value={formData.dispositionNotes}
                onChange={(e) => handleInputChange('dispositionNotes', e.target.value)}
                rows={3}
                placeholder="Any additional notes about the disposition..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Estimated Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Actual Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actualCost}
                  onChange={(e) => handleInputChange('actualCost', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-4"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Disposition
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
}
