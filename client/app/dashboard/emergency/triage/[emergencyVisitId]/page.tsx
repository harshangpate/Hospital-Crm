'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplet,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { createTriageAssessment, getEmergencyVisitById } from '@/lib/api/emergency';

const TRIAGE_LEVELS = [
  {
    value: 'LEVEL_1_RESUSCITATION',
    label: 'Level 1 - Resuscitation',
    color: 'RED',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500',
    textColor: 'text-red-700 dark:text-red-400',
    description: 'Immediate life-saving intervention required',
  },
  {
    value: 'LEVEL_2_EMERGENT',
    label: 'Level 2 - Emergent',
    color: 'ORANGE',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700 dark:text-orange-400',
    description: 'High risk, potential threat to life',
  },
  {
    value: 'LEVEL_3_URGENT',
    label: 'Level 3 - Urgent',
    color: 'YELLOW',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    description: 'Could deteriorate, requires multiple resources',
  },
  {
    value: 'LEVEL_4_LESS_URGENT',
    label: 'Level 4 - Less Urgent',
    color: 'GREEN',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    description: 'Stable, requires simple intervention',
  },
  {
    value: 'LEVEL_5_NON_URGENT',
    label: 'Level 5 - Non-Urgent',
    color: 'BLUE',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    description: 'Chronic problem, could use clinic/OPD',
  },
];

export default function TriageAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const emergencyVisitId = params?.emergencyVisitId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visit, setVisit] = useState<any>(null);

  const [formData, setFormData] = useState({
    triageLevel: 'LEVEL_3_URGENT',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    onsetTime: '',
    severity: 'Moderate',

    // Vital Signs
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    respiratoryRate: '',
    spO2: '',
    painScore: '',
    glucoseLevel: '',

    // Quick Assessment
    consciousLevel: 'Alert',
    airwayStatus: 'Clear',
    breathingStatus: 'Normal',
    circulationStatus: 'Normal',

    // Risk Factors
    activeBloodLoss: false,
    severeTrauma: false,
    chestPain: false,
    unconscious: false,
    seizure: false,
    poisoning: false,
    pregnancyComplications: false,

    triageNotes: '',
    redFlags: '',
  });

  useEffect(() => {
    fetchVisit();
  }, [emergencyVisitId]);

  const fetchVisit = async () => {
    try {
      setLoading(true);
      const response = await getEmergencyVisitById(emergencyVisitId);
      setVisit(response.data.data);
      
      // Pre-fill chief complaint from registration
      if (response.data.data.chiefComplaint) {
        setFormData(prev => ({
          ...prev,
          chiefComplaint: response.data.data.chiefComplaint,
          historyOfPresentIllness: response.data.data.briefHistory || '',
        }));
      }
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

    if (!formData.triageLevel || !formData.chiefComplaint) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const data: any = {
        triageLevel: formData.triageLevel,
        chiefComplaint: formData.chiefComplaint,
        historyOfPresentIllness: formData.historyOfPresentIllness || undefined,
        onsetTime: formData.onsetTime || undefined,
        severity: formData.severity || undefined,

        // Vital Signs (convert to numbers)
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        spO2: formData.spO2 ? parseInt(formData.spO2) : undefined,
        painScore: formData.painScore ? parseInt(formData.painScore) : undefined,
        glucoseLevel: formData.glucoseLevel ? parseFloat(formData.glucoseLevel) : undefined,

        consciousLevel: formData.consciousLevel || undefined,
        airwayStatus: formData.airwayStatus || undefined,
        breathingStatus: formData.breathingStatus || undefined,
        circulationStatus: formData.circulationStatus || undefined,

        activeBloodLoss: formData.activeBloodLoss,
        severeTrauma: formData.severeTrauma,
        chestPain: formData.chestPain,
        unconscious: formData.unconscious,
        seizure: formData.seizure,
        poisoning: formData.poisoning,
        pregnancyComplications: formData.pregnancyComplications,

        triageNotes: formData.triageNotes || undefined,
        redFlags: formData.redFlags || undefined,
      };

      await createTriageAssessment(emergencyVisitId, data);
      alert('Triage assessment completed successfully!');
      router.push('/dashboard/emergency/queue');
    } catch (error: any) {
      console.error('Triage error:', error);
      alert(error.response?.data?.message || 'Failed to complete triage assessment');
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

  const selectedTriageLevel = TRIAGE_LEVELS.find((level) => level.value === formData.triageLevel);

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
            <Activity className="w-8 h-8 text-red-600" />
            Triage Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Emergency Severity Index (ESI) - 5 Level Triage System
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
                  Visit: {visit.visitNumber} • Arrived: {new Date(visit.arrivalTime).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Mode of Arrival</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {visit.modeOfArrival.replace('_', ' ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Triage Level Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Triage Level *
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {TRIAGE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleInputChange('triageLevel', level.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.triageLevel === level.value
                      ? `${level.borderColor} ${level.bgColor}`
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className={`font-bold text-lg ${level.textColor}`}>{level.color}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                    {level.label.split(' - ')[1]}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Chief Complaint & History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              Complaint & History
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chief Complaint *
              </label>
              <input
                type="text"
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                History of Present Illness
              </label>
              <textarea
                value={formData.historyOfPresentIllness}
                onChange={(e) => handleInputChange('historyOfPresentIllness', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symptom Onset Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.onsetTime}
                  onChange={(e) => handleInputChange('onsetTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Vital Signs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-600" />
              Vital Signs
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => handleInputChange('heartRate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BP Systolic (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.bloodPressureSystolic}
                  onChange={(e) => handleInputChange('bloodPressureSystolic', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BP Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.bloodPressureDiastolic}
                  onChange={(e) => handleInputChange('bloodPressureDiastolic', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  value={formData.respiratoryRate}
                  onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={formData.spO2}
                  onChange={(e) => handleInputChange('spO2', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pain Score (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.painScore}
                  onChange={(e) => handleInputChange('painScore', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.glucoseLevel}
                  onChange={(e) => handleInputChange('glucoseLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-600" />
              Quick Assessment (ABC)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conscious Level
                </label>
                <select
                  value={formData.consciousLevel}
                  onChange={(e) => handleInputChange('consciousLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Alert">Alert</option>
                  <option value="Drowsy">Drowsy</option>
                  <option value="Unconscious">Unconscious</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Airway Status
                </label>
                <select
                  value={formData.airwayStatus}
                  onChange={(e) => handleInputChange('airwayStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Clear">Clear</option>
                  <option value="Compromised">Compromised</option>
                  <option value="Obstructed">Obstructed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Breathing Status
                </label>
                <select
                  value={formData.breathingStatus}
                  onChange={(e) => handleInputChange('breathingStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Labored">Labored</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Circulation Status
                </label>
                <select
                  value={formData.circulationStatus}
                  onChange={(e) => handleInputChange('circulationStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Compromised">Compromised</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Risk Factors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Critical Risk Factors
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'activeBloodLoss', label: 'Active Blood Loss' },
                { key: 'severeTrauma', label: 'Severe Trauma' },
                { key: 'chestPain', label: 'Chest Pain' },
                { key: 'unconscious', label: 'Unconscious' },
                { key: 'seizure', label: 'Seizure' },
                { key: 'poisoning', label: 'Poisoning' },
                { key: 'pregnancyComplications', label: 'Pregnancy Complications' },
              ].map((risk) => (
                <label
                  key={risk.key}
                  className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={(formData as any)[risk.key]}
                    onChange={(e) => handleInputChange(risk.key, e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {risk.label}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Triage Notes
              </label>
              <textarea
                value={formData.triageNotes}
                onChange={(e) => handleInputChange('triageNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Red Flags / Warning Signs
              </label>
              <textarea
                value={formData.redFlags}
                onChange={(e) => handleInputChange('redFlags', e.target.value)}
                rows={2}
                placeholder="Any concerning signs that require immediate attention..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
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
              className={`px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 ${
                selectedTriageLevel?.value === 'LEVEL_1_RESUSCITATION' || 
                selectedTriageLevel?.value === 'LEVEL_2_EMERGENT'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Completing Triage...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Triage Assessment
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
}
