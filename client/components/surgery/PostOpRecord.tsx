'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Save, Calendar, FileText, Pill, AlertCircle } from 'lucide-react';
import { getPostOpRecord, updatePostOpRecord } from '@/lib/api/surgery';

interface PostOpData {
  transferToRecoveryTime?: string;
  transferLocation?: string;
  consciousnessLevel?: string;
  airwayStatus?: string;
  breathingStatus?: string;
  circulationStatus?: string;
  
  painScore?: number;
  vitalsOnArrival?: string;
  monitoringSchedule?: string;
  
  drainsOutput?: string;
  catheterOutput?: string;
  
  painManagement?: string;
  antibiotics?: string;
  otherMedications?: string;
  
  complications?: string;
  
  dischargeCondition?: string;
  dischargeLocation?: string;
  dischargeInstructions?: string;
  
  followUpDate?: string;
  followUpWith?: string;
  followUpInstructions?: string;
  
  prescriptions?: string;
  
  notes?: string;
}

export default function PostOpRecord({ surgeryId }: { surgeryId: string }) {
  const [record, setRecord] = useState<PostOpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [surgeryId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await getPostOpRecord(surgeryId);
      setRecord(response.data || getInitialRecordData());
    } catch (error: any) {
      // 404 is expected for surgeries without a post-op record yet
      if (error?.response?.status !== 404) {
        console.error('Error fetching post-op record:', error);
      }
      setRecord(getInitialRecordData());
    } finally {
      setLoading(false);
    }
  };

  const getInitialRecordData = (): PostOpData => ({
    painScore: 0,
  });

  const handleFieldChange = (field: keyof PostOpData, value: string | number) => {
    setRecord((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!record) return;
    
    try {
      setSaving(true);
      
      // Map frontend field names to backend/database field names
      const mappedData: any = {
        transferredTo: record.transferLocation,
        transferredAt: record.transferToRecoveryTime,
        consciousness: record.consciousnessLevel,
        airwayStatus: record.airwayStatus,
        breathingStatus: record.breathingStatus,
        circulation: record.circulationStatus,
        painScore: record.painScore,
        vitalSignsFrequency: record.monitoringSchedule,
        initialVitals: record.vitalsOnArrival ? { notes: record.vitalsOnArrival } : null,
        drainOutput: record.drainsOutput,
        catheterOutput: record.catheterOutput,
        painManagement: record.painManagement,
        antibioticsPrescribed: record.antibiotics,
        otherMedications: record.otherMedications,
        complications: record.complications,
        dischargeCondition: record.dischargeCondition,
        dischargedTo: record.dischargeLocation,
        followUpInstructions: record.followUpInstructions,
        followUpDate: record.followUpDate,
        dischargeMedications: record.prescriptions,
        dischargeNotes: record.notes,
      };
      
      // Remove undefined/null/empty values
      Object.keys(mappedData).forEach(key => {
        if (mappedData[key] === undefined || mappedData[key] === null || mappedData[key] === '') {
          delete mappedData[key];
        }
      });
      
      console.log('Saving post-op record:', mappedData);
      await updatePostOpRecord(surgeryId, mappedData);
      setSuccessMessage('Record saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving record:', error);
      console.error('Error response:', error?.response?.data);
      alert(`Failed to save record: ${error?.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPainColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading post-operative record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Post-Operative Record
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Document recovery and discharge planning
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
        >
          <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </motion.div>
      )}

      {/* Transfer Details */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transfer Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transfer Time
            </label>
            <input
              type="datetime-local"
              value={record?.transferToRecoveryTime || ''}
              onChange={(e) => handleFieldChange('transferToRecoveryTime', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transfer Location
            </label>
            <select
              value={record?.transferLocation || ''}
              onChange={(e) => handleFieldChange('transferLocation', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              <option value="Recovery Room">Recovery Room</option>
              <option value="ICU">ICU</option>
              <option value="General Ward">General Ward</option>
              <option value="HDU">HDU</option>
            </select>
          </div>
        </div>
      </div>

      {/* Immediate Assessment */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Immediate Post-Op Assessment (ABCD)
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              A - Airway Status
            </label>
            <select
              value={record?.airwayStatus || ''}
              onChange={(e) => handleFieldChange('airwayStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select status</option>
              <option value="Clear">Clear</option>
              <option value="Obstructed">Obstructed</option>
              <option value="Intubated">Intubated</option>
              <option value="Needs Support">Needs Support</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              B - Breathing Status
            </label>
            <select
              value={record?.breathingStatus || ''}
              onChange={(e) => handleFieldChange('breathingStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select status</option>
              <option value="Normal">Normal</option>
              <option value="Labored">Labored</option>
              <option value="On Oxygen">On Oxygen</option>
              <option value="Needs Ventilation">Needs Ventilation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              C - Circulation Status
            </label>
            <select
              value={record?.circulationStatus || ''}
              onChange={(e) => handleFieldChange('circulationStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select status</option>
              <option value="Stable">Stable</option>
              <option value="Tachycardia">Tachycardia</option>
              <option value="Bradycardia">Bradycardia</option>
              <option value="Hypotensive">Hypotensive</option>
              <option value="Hypertensive">Hypertensive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              D - Consciousness Level
            </label>
            <select
              value={record?.consciousnessLevel || ''}
              onChange={(e) => handleFieldChange('consciousnessLevel', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select level</option>
              <option value="Alert">Alert</option>
              <option value="Drowsy">Drowsy</option>
              <option value="Responds to Voice">Responds to Voice</option>
              <option value="Responds to Pain">Responds to Pain</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pain Assessment */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pain Assessment
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pain Score (0-10)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="10"
              value={record?.painScore || 0}
              onChange={(e) => handleFieldChange('painScore', parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className={`text-4xl font-bold ${getPainColor(record?.painScore || 0)}`}>
              {record?.painScore || 0}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
            <span>No Pain</span>
            <span>Mild (1-3)</span>
            <span>Moderate (4-6)</span>
            <span>Severe (7-10)</span>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vitals on Arrival
          </label>
          <textarea
            value={record?.vitalsOnArrival || ''}
            onChange={(e) => handleFieldChange('vitalsOnArrival', e.target.value)}
            rows={2}
            placeholder="BP: , HR: , SpO2: , Temp: , RR: "
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Monitoring Schedule
          </label>
          <input
            type="text"
            value={record?.monitoringSchedule || ''}
            onChange={(e) => handleFieldChange('monitoringSchedule', e.target.value)}
            placeholder="e.g., Every 15 minutes for first hour, then hourly"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Output Monitoring */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Output Monitoring
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drains Output
            </label>
            <input
              type="text"
              value={record?.drainsOutput || ''}
              onChange={(e) => handleFieldChange('drainsOutput', e.target.value)}
              placeholder="e.g., 50ml serous fluid"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catheter Output
            </label>
            <input
              type="text"
              value={record?.catheterOutput || ''}
              onChange={(e) => handleFieldChange('catheterOutput', e.target.value)}
              placeholder="e.g., 200ml clear urine"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Medication Management */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Medication Management
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pain Management
            </label>
            <textarea
              value={record?.painManagement || ''}
              onChange={(e) => handleFieldChange('painManagement', e.target.value)}
              rows={2}
              placeholder="List pain medications and dosing schedule..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Antibiotics
            </label>
            <textarea
              value={record?.antibiotics || ''}
              onChange={(e) => handleFieldChange('antibiotics', e.target.value)}
              rows={2}
              placeholder="List antibiotic prophylaxis..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Other Medications
            </label>
            <textarea
              value={record?.otherMedications || ''}
              onChange={(e) => handleFieldChange('otherMedications', e.target.value)}
              rows={2}
              placeholder="List any other medications..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Complications */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Complications
        </h4>
        <textarea
          value={record?.complications || ''}
          onChange={(e) => handleFieldChange('complications', e.target.value)}
          rows={3}
          placeholder="Note any complications or concerns..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Discharge Planning */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Discharge Planning
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discharge Condition
              </label>
              <select
                value={record?.dischargeCondition || ''}
                onChange={(e) => handleFieldChange('dischargeCondition', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select condition</option>
                <option value="Stable">Stable</option>
                <option value="Improving">Improving</option>
                <option value="Needs Observation">Needs Observation</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discharge Location
              </label>
              <select
                value={record?.dischargeLocation || ''}
                onChange={(e) => handleFieldChange('dischargeLocation', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select location</option>
                <option value="Home">Home</option>
                <option value="Ward">Ward</option>
                <option value="ICU">ICU</option>
                <option value="Another Facility">Another Facility</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discharge Instructions
            </label>
            <textarea
              value={record?.dischargeInstructions || ''}
              onChange={(e) => handleFieldChange('dischargeInstructions', e.target.value)}
              rows={4}
              placeholder="Detailed instructions for patient care after discharge..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prescriptions
            </label>
            <textarea
              value={record?.prescriptions || ''}
              onChange={(e) => handleFieldChange('prescriptions', e.target.value)}
              rows={3}
              placeholder="List all discharge medications with dosing..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Follow-Up */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Follow-Up Planning
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-Up Date
              </label>
              <input
                type="date"
                value={record?.followUpDate || ''}
                onChange={(e) => handleFieldChange('followUpDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Follow-Up With
              </label>
              <input
                type="text"
                value={record?.followUpWith || ''}
                onChange={(e) => handleFieldChange('followUpWith', e.target.value)}
                placeholder="Doctor name or department"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Follow-Up Instructions
            </label>
            <textarea
              value={record?.followUpInstructions || ''}
              onChange={(e) => handleFieldChange('followUpInstructions', e.target.value)}
              rows={2}
              placeholder="Special instructions for follow-up visit..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Additional Notes
        </h4>
        <textarea
          value={record?.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          rows={4}
          placeholder="Any additional observations or notes..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Record'}
        </motion.button>
      </div>
    </div>
  );
}
