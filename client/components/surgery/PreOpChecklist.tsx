'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Save, AlertCircle } from 'lucide-react';
import { getPreOpChecklist, updatePreOpChecklist } from '@/lib/api/surgery';

interface ChecklistItem {
  label: string;
  key: keyof ChecklistData;
  required?: boolean;
  type?: 'boolean' | 'text' | 'datetime';
}

interface ChecklistData {
  // Patient Preparation
  consentSigned: boolean;
  patientIdentityVerified: boolean;
  allergiesVerified: boolean;
  fastingStatus: boolean;
  npoSince?: string;
  
  // Lab & Investigations
  bloodTestDone: boolean;
  bloodTestResults?: string;
  xRayDone: boolean;
  xRayResults?: string;
  ecgDone: boolean;
  ecgResults?: string;
  otherTestsDone: boolean;
  otherTestsResults?: string;
  
  // Medications
  preMedicationGiven: boolean;
  preMedicationDetails?: string;
  currentMedicationsStopped: boolean;
  anticoagulantsStopped: boolean;
  
  // Equipment & Supplies
  otPrepared: boolean;
  instrumentsSterilized: boolean;
  equipmentChecked: boolean;
  bloodArranged: boolean;
  bloodUnits?: string;
  implantsAvailable: boolean;
  implantDetails?: string;
  
  // Anesthesia
  anesthesiaAssessmentDone: boolean;
  anesthesiaRiskAssessed: boolean;
  airwayAssessmentDone: boolean;
  
  // Final Checks
  siteMarked: boolean;
  jewelryRemoved: boolean;
  dentalProsthesisRemoved: boolean;
  ivLineSecured: boolean;
  catheterInserted: boolean;
  
  // WHO Safety Checklist
  whoTimeOutCompleted: boolean;
  whoTeamIntroductionDone: boolean;
  
  // Notes
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

const checklistSections: { title: string; items: ChecklistItem[] }[] = [
  {
    title: 'Patient Preparation',
    items: [
      { label: 'Consent Signed', key: 'consentSigned', required: true },
      { label: 'Patient Identity Verified', key: 'patientIdentityVerified', required: true },
      { label: 'Allergies Verified', key: 'allergiesVerified', required: true },
      { label: 'Fasting Status Confirmed', key: 'fastingStatus', required: true },
      { label: 'NPO Since', key: 'npoSince', type: 'datetime' },
    ],
  },
  {
    title: 'Lab & Investigations',
    items: [
      { label: 'Blood Test Done', key: 'bloodTestDone', required: true },
      { label: 'Blood Test Results', key: 'bloodTestResults', type: 'text' },
      { label: 'X-Ray Done', key: 'xRayDone' },
      { label: 'X-Ray Results', key: 'xRayResults', type: 'text' },
      { label: 'ECG Done', key: 'ecgDone', required: true },
      { label: 'ECG Results', key: 'ecgResults', type: 'text' },
      { label: 'Other Tests Done', key: 'otherTestsDone' },
      { label: 'Other Tests Results', key: 'otherTestsResults', type: 'text' },
    ],
  },
  {
    title: 'Medications',
    items: [
      { label: 'Pre-Medication Given', key: 'preMedicationGiven' },
      { label: 'Pre-Medication Details', key: 'preMedicationDetails', type: 'text' },
      { label: 'Current Medications Stopped', key: 'currentMedicationsStopped', required: true },
      { label: 'Anticoagulants Stopped', key: 'anticoagulantsStopped', required: true },
    ],
  },
  {
    title: 'Equipment & Supplies',
    items: [
      { label: 'OT Prepared', key: 'otPrepared', required: true },
      { label: 'Instruments Sterilized', key: 'instrumentsSterilized', required: true },
      { label: 'Equipment Checked', key: 'equipmentChecked', required: true },
      { label: 'Blood Arranged', key: 'bloodArranged' },
      { label: 'Blood Units', key: 'bloodUnits', type: 'text' },
      { label: 'Implants Available', key: 'implantsAvailable' },
      { label: 'Implant Details', key: 'implantDetails', type: 'text' },
    ],
  },
  {
    title: 'Anesthesia',
    items: [
      { label: 'Anesthesia Assessment Done', key: 'anesthesiaAssessmentDone', required: true },
      { label: 'Anesthesia Risk Assessed', key: 'anesthesiaRiskAssessed', required: true },
      { label: 'Airway Assessment Done', key: 'airwayAssessmentDone', required: true },
    ],
  },
  {
    title: 'Final Checks',
    items: [
      { label: 'Site Marked', key: 'siteMarked', required: true },
      { label: 'Jewelry Removed', key: 'jewelryRemoved', required: true },
      { label: 'Dental Prosthesis Removed', key: 'dentalProsthesisRemoved', required: true },
      { label: 'IV Line Secured', key: 'ivLineSecured', required: true },
      { label: 'Catheter Inserted', key: 'catheterInserted' },
    ],
  },
  {
    title: 'WHO Safety Checklist',
    items: [
      { label: 'WHO Time-Out Completed', key: 'whoTimeOutCompleted', required: true },
      { label: 'WHO Team Introduction Done', key: 'whoTeamIntroductionDone', required: true },
    ],
  },
];

export default function PreOpChecklist({ surgeryId }: { surgeryId: string }) {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, [surgeryId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await getPreOpChecklist(surgeryId);
      setChecklist(response.data || getInitialChecklistData());
    } catch (error) {
      console.error('Error fetching checklist:', error);
      setChecklist(getInitialChecklistData());
    } finally {
      setLoading(false);
    }
  };

  const getInitialChecklistData = (): ChecklistData => ({
    consentSigned: false,
    patientIdentityVerified: false,
    allergiesVerified: false,
    fastingStatus: false,
    bloodTestDone: false,
    xRayDone: false,
    ecgDone: false,
    otherTestsDone: false,
    preMedicationGiven: false,
    currentMedicationsStopped: false,
    anticoagulantsStopped: false,
    otPrepared: false,
    instrumentsSterilized: false,
    equipmentChecked: false,
    bloodArranged: false,
    implantsAvailable: false,
    anesthesiaAssessmentDone: false,
    anesthesiaRiskAssessed: false,
    airwayAssessmentDone: false,
    siteMarked: false,
    jewelryRemoved: false,
    dentalProsthesisRemoved: false,
    ivLineSecured: false,
    catheterInserted: false,
    whoTimeOutCompleted: false,
    whoTeamIntroductionDone: false,
  });

  const handleCheckboxChange = (key: keyof ChecklistData, value: boolean) => {
    setChecklist((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleTextChange = (key: keyof ChecklistData, value: string) => {
    setChecklist((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSave = async () => {
    if (!checklist) return;
    
    try {
      setSaving(true);
      await updatePreOpChecklist(surgeryId, checklist);
      setSuccessMessage('Checklist saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletion = () => {
    if (!checklist) return 0;
    const requiredItems = checklistSections.flatMap((section) =>
      section.items.filter((item) => item.required)
    );
    const completedItems = requiredItems.filter((item) => checklist[item.key] === true);
    return Math.round((completedItems.length / requiredItems.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading checklist...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateCompletion();

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pre-Operative Checklist
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete all required items before surgery
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </motion.div>
      )}

      {/* Checklist Sections */}
      <div className="space-y-6">
        {checklistSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {section.title}
            </h4>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.key}>
                  {(!item.type || item.type === 'boolean') && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={checklist?.[item.key] === true}
                          onChange={(e) => handleCheckboxChange(item.key, e.target.checked)}
                          className="sr-only"
                        />
                        <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center group-hover:border-blue-500 transition-colors">
                          {checklist?.[item.key] === true && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <span className="text-gray-900 dark:text-white flex-1">
                        {item.label}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </label>
                  )}
                  {item.type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {item.label}
                      </label>
                      <textarea
                        value={(checklist?.[item.key] as string) || ''}
                        onChange={(e) => handleTextChange(item.key, e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  {item.type === 'datetime' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {item.label}
                      </label>
                      <input
                        type="datetime-local"
                        value={(checklist?.[item.key] as string) || ''}
                        onChange={(e) => handleTextChange(item.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Notes Section */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Notes
          </h4>
          <textarea
            value={checklist?.notes || ''}
            onChange={(e) => handleTextChange('notes', e.target.value)}
            rows={4}
            placeholder="Enter any additional notes or observations..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Checklist'}
        </motion.button>
      </div>

      {/* Completion Warning */}
      {completionPercentage < 100 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Checklist Incomplete
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Please complete all required items before proceeding with the surgery.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
