'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  FileText,
  Save,
  User,
  Clock,
  Heart,
  Stethoscope,
  Pill,
  TestTube,
  Image as ImageIcon,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  getEmergencyVisitById,
  updateDoctorAssessment,
  assignDoctor,
  updateVisitStatus,
} from '@/lib/api/emergency';

export default function DoctorAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const emergencyVisitId = params?.emergencyVisitId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visit, setVisit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'vitals'>('assessment');

  const [formData, setFormData] = useState({
    presentingSymptoms: '',
    allergies: '',
    currentMedications: '',
    examinationFindings: '',
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    treatmentGiven: '',
    investigationsOrdered: '',
    proceduresPerformed: '',
  });

  useEffect(() => {
    fetchVisit();
  }, [emergencyVisitId]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      const response = await getEmergencyVisitById(emergencyVisitId);
      const visitData = response.data.data;
      setVisit(visitData);

      // Pre-fill form with existing data
      setFormData({
        presentingSymptoms: visitData.presentingSymptoms || '',
        allergies: visitData.allergies || '',
        currentMedications: visitData.currentMedications || '',
        examinationFindings: visitData.examinationFindings || '',
        provisionalDiagnosis: visitData.provisionalDiagnosis || '',
        finalDiagnosis: visitData.finalDiagnosis || '',
        treatmentGiven: visitData.treatmentGiven || '',
        investigationsOrdered: visitData.investigationsOrdered || '',
        proceduresPerformed: visitData.proceduresPerformed || '',
      });
    } catch (error) {
      console.error('Error fetching visit:', error);
      alert('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDoctorAssessment(emergencyVisitId, formData);
      alert('Assessment saved successfully!');
      fetchVisit(); // Refresh data
    } catch (error: any) {
      console.error('Save error:', error);
      alert(error.response?.data?.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateVisitStatus(emergencyVisitId, { status: newStatus });
      alert('Status updated successfully!');
      fetchVisit();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    }
  };

  const handleDisposition = () => {
    router.push(`/dashboard/emergency/disposition/${emergencyVisitId}`);
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

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-red-600" />
            Emergency Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Doctor's assessment and treatment documentation
          </p>
        </motion.div>

        {/* Patient Info Card */}
        {visit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {visit.patient?.user?.firstName} {visit.patient?.user?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {visit.visitNumber} • {visit.patient?.user?.gender}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chief Complaint</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {visit.chiefComplaint}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Triage: {visit.triageLevel?.replace('LEVEL_', 'Level ').replace('_', ' - ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <select
                  value={visit.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="IN_TREATMENT">In Treatment</option>
                  <option value="UNDER_OBSERVATION">Under Observation</option>
                  <option value="AWAITING_RESULTS">Awaiting Results</option>
                  <option value="READY_FOR_DISPOSITION">Ready for Disposition</option>
                </select>
              </div>
            </div>

            {/* Triage Vitals Summary */}
            {visit.vitalSignsAtTriage && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Triage Vital Signs:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {visit.vitalSignsAtTriage.heartRate && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">HR:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {visit.vitalSignsAtTriage.heartRate} bpm
                      </span>
                    </div>
                  )}
                  {visit.vitalSignsAtTriage.bloodPressureSystolic && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">BP:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {visit.vitalSignsAtTriage.bloodPressureSystolic}/
                        {visit.vitalSignsAtTriage.bloodPressureDiastolic}
                      </span>
                    </div>
                  )}
                  {visit.vitalSignsAtTriage.spO2 && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">SpO2:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {visit.vitalSignsAtTriage.spO2}%
                      </span>
                    </div>
                  )}
                  {visit.vitalSignsAtTriage.temperature && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Temp:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {visit.vitalSignsAtTriage.temperature}°F
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'assessment'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-5 h-5 inline-block mr-2" />
            Assessment
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'vitals'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Heart className="w-5 h-5 inline-block mr-2" />
            Vitals History
          </button>
        </div>

        {/* Assessment Tab */}
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            {/* History & Examination */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-6 h-6 text-red-600" />
                Patient History
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Presenting Symptoms
                </label>
                <textarea
                  value={formData.presentingSymptoms}
                  onChange={(e) => handleInputChange('presentingSymptoms', e.target.value)}
                  rows={3}
                  placeholder="Detailed description of symptoms..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Known Allergies
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    rows={2}
                    placeholder="List any known allergies..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    value={formData.currentMedications}
                    onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                    rows={2}
                    placeholder="Medications currently being taken..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Examination Findings *
                </label>
                <textarea
                  value={formData.examinationFindings}
                  onChange={(e) => handleInputChange('examinationFindings', e.target.value)}
                  rows={4}
                  placeholder="Physical examination findings, observations..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>

            {/* Diagnosis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-red-600" />
                Diagnosis
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provisional Diagnosis *
                </label>
                <input
                  type="text"
                  value={formData.provisionalDiagnosis}
                  onChange={(e) => handleInputChange('provisionalDiagnosis', e.target.value)}
                  placeholder="Initial diagnostic impression..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Final Diagnosis
                </label>
                <input
                  type="text"
                  value={formData.finalDiagnosis}
                  onChange={(e) => handleInputChange('finalDiagnosis', e.target.value)}
                  placeholder="Confirmed diagnosis after investigations..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>

            {/* Treatment & Investigations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Pill className="w-6 h-6 text-red-600" />
                Treatment & Orders
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Pill className="w-4 h-4 inline-block mr-2" />
                  Treatment Given
                </label>
                <textarea
                  value={formData.treatmentGiven}
                  onChange={(e) => handleInputChange('treatmentGiven', e.target.value)}
                  rows={3}
                  placeholder="Medications administered, procedures performed..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <TestTube className="w-4 h-4 inline-block mr-2" />
                  Investigations Ordered
                </label>
                <textarea
                  value={formData.investigationsOrdered}
                  onChange={(e) => handleInputChange('investigationsOrdered', e.target.value)}
                  rows={3}
                  placeholder="Lab tests, imaging studies ordered..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Procedures Performed
                </label>
                <textarea
                  value={formData.proceduresPerformed}
                  onChange={(e) => handleInputChange('proceduresPerformed', e.target.value)}
                  rows={3}
                  placeholder="Any procedures or interventions performed..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end gap-4"
            >
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Queue
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Assessment
                  </>
                )}
              </button>
              <button
                onClick={handleDisposition}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Proceed to Disposition
              </button>
            </motion.div>
          </div>
        )}

        {/* Vitals Tab */}
        {activeTab === 'vitals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Vitals History
            </h2>
            {visit?.vitals && visit.vitals.length > 0 ? (
              <div className="space-y-4">
                {visit.vitals.map((vital: any, index: number) => (
                  <div
                    key={vital.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {new Date(vital.takenAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        By: {vital.takenByName}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {vital.heartRate && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">HR:</span>
                          <span className="ml-2 font-semibold">{vital.heartRate} bpm</span>
                        </div>
                      )}
                      {vital.bloodPressureSystolic && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">BP:</span>
                          <span className="ml-2 font-semibold">
                            {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                          </span>
                        </div>
                      )}
                      {vital.spO2 && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">SpO2:</span>
                          <span className="ml-2 font-semibold">{vital.spO2}%</span>
                        </div>
                      )}
                      {vital.temperature && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Temp:</span>
                          <span className="ml-2 font-semibold">{vital.temperature}°F</span>
                        </div>
                      )}
                    </div>
                    {vital.notes && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Notes: {vital.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No vitals recorded yet
              </p>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
