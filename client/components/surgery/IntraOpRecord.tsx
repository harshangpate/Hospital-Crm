'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Save, Clock, User, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { getIntraOpRecord, updateIntraOpRecord } from '@/lib/api/surgery';

interface VitalSign {
  time: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  spO2: number;
  temperature: number;
  respiratoryRate: number;
}

interface IntraOpData {
  patientInOtTime?: string;
  anesthesiaStartTime?: string;
  surgeryStartTime?: string;
  surgeryEndTime?: string;
  anesthesiaEndTime?: string;
  patientOutOtTime?: string;
  
  anesthesiaType?: string;
  anesthesiaDrugsUsed?: string;
  anesthesiaComplications?: string;
  
  ivFluidsGiven?: string;
  bloodTransfused?: string;
  bloodLoss?: string;
  urineOutput?: string;
  
  patientPosition?: string;
  surgicalApproach?: string;
  findingsDuringProcedure?: string;
  procedurePerformed?: string;
  
  specimensSent?: string;
  implantsUsed?: string;
  implantBatchNumbers?: string;
  
  swabCount?: string;
  instrumentCount?: string;
  needleCount?: string;
  countsVerified: boolean;
  
  vitals: VitalSign[];
  
  surgeonNotes?: string;
  anesthesiaNotes?: string;
  nursingNotes?: string;
}

export default function IntraOpRecord({ surgeryId }: { surgeryId: string }) {
  const [record, setRecord] = useState<IntraOpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [surgeryId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await getIntraOpRecord(surgeryId);
      setRecord(response.data || getInitialRecordData());
    } catch (error) {
      console.error('Error fetching intra-op record:', error);
      setRecord(getInitialRecordData());
    } finally {
      setLoading(false);
    }
  };

  const getInitialRecordData = (): IntraOpData => ({
    countsVerified: false,
    vitals: [],
  });

  const handleFieldChange = (field: keyof IntraOpData, value: string | boolean) => {
    setRecord((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const addVitalSign = () => {
    const newVital: VitalSign = {
      time: new Date().toISOString().slice(0, 16),
      heartRate: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      spO2: 0,
      temperature: 0,
      respiratoryRate: 0,
    };
    setRecord((prev) => (prev ? { ...prev, vitals: [...prev.vitals, newVital] } : null));
  };

  const removeVitalSign = (index: number) => {
    setRecord((prev) =>
      prev ? { ...prev, vitals: prev.vitals.filter((_, i) => i !== index) } : null
    );
  };

  const updateVitalSign = (index: number, field: keyof VitalSign, value: string | number) => {
    setRecord((prev) => {
      if (!prev) return null;
      const newVitals = [...prev.vitals];
      newVitals[index] = { ...newVitals[index], [field]: value };
      return { ...prev, vitals: newVitals };
    });
  };

  const handleSave = async () => {
    if (!record) return;
    
    try {
      setSaving(true);
      await updateIntraOpRecord(surgeryId, record);
      setSuccessMessage('Record saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading intra-operative record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Intra-Operative Record
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Document all events during the surgery
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
          <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </motion.div>
      )}

      {/* Timeline Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Surgery Timeline
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Patient In OT', field: 'patientInOtTime' },
            { label: 'Anesthesia Start', field: 'anesthesiaStartTime' },
            { label: 'Surgery Start', field: 'surgeryStartTime' },
            { label: 'Surgery End', field: 'surgeryEndTime' },
            { label: 'Anesthesia End', field: 'anesthesiaEndTime' },
            { label: 'Patient Out OT', field: 'patientOutOtTime' },
          ].map((item) => (
            <div key={item.field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {item.label}
              </label>
              <input
                type="datetime-local"
                value={(record?.[item.field as keyof IntraOpData] as string) || ''}
                onChange={(e) => handleFieldChange(item.field as keyof IntraOpData, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Vitals Monitoring */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vital Signs Monitoring
          </h4>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addVitalSign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Vital Reading
          </motion.button>
        </div>

        {/* Vitals Summary */}
        {record?.vitals && record.vitals.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {record.vitals.length} vital sign readings recorded
            </p>
          </div>
        )}

        {/* Vitals Table */}
        <div className="space-y-4">
          {record?.vitals.map((vital, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Reading #{index + 1}</h5>
                <button
                  onClick={() => removeVitalSign(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    type="datetime-local"
                    value={vital.time.slice(0, 16)}
                    onChange={(e) => updateVitalSign(index, 'time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={vital.heartRate}
                    onChange={(e) => updateVitalSign(index, 'heartRate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    BP Systolic
                  </label>
                  <input
                    type="number"
                    value={vital.bloodPressureSystolic}
                    onChange={(e) => updateVitalSign(index, 'bloodPressureSystolic', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    BP Diastolic
                  </label>
                  <input
                    type="number"
                    value={vital.bloodPressureDiastolic}
                    onChange={(e) => updateVitalSign(index, 'bloodPressureDiastolic', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={vital.spO2}
                    onChange={(e) => updateVitalSign(index, 'spO2', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vital.temperature}
                    onChange={(e) => updateVitalSign(index, 'temperature', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Respiratory Rate
                  </label>
                  <input
                    type="number"
                    value={vital.respiratoryRate}
                    onChange={(e) => updateVitalSign(index, 'respiratoryRate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anesthesia Details */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Anesthesia Details
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anesthesia Type
            </label>
            <input
              type="text"
              value={record?.anesthesiaType || ''}
              onChange={(e) => handleFieldChange('anesthesiaType', e.target.value)}
              placeholder="e.g., General, Spinal, Regional"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drugs Used
            </label>
            <textarea
              value={record?.anesthesiaDrugsUsed || ''}
              onChange={(e) => handleFieldChange('anesthesiaDrugsUsed', e.target.value)}
              rows={3}
              placeholder="List all drugs administered..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Complications
            </label>
            <textarea
              value={record?.anesthesiaComplications || ''}
              onChange={(e) => handleFieldChange('anesthesiaComplications', e.target.value)}
              rows={2}
              placeholder="Note any complications..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Fluid Management */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fluid & Blood Management
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'IV Fluids Given', field: 'ivFluidsGiven' },
            { label: 'Blood Transfused', field: 'bloodTransfused' },
            { label: 'Blood Loss (ml)', field: 'bloodLoss' },
            { label: 'Urine Output (ml)', field: 'urineOutput' },
          ].map((item) => (
            <div key={item.field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {item.label}
              </label>
              <input
                type="text"
                value={(record?.[item.field as keyof IntraOpData] as string) || ''}
                onChange={(e) => handleFieldChange(item.field as keyof IntraOpData, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Procedure Documentation */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Procedure Documentation
        </h4>
        <div className="space-y-4">
          {[
            { label: 'Patient Position', field: 'patientPosition' },
            { label: 'Surgical Approach', field: 'surgicalApproach' },
            { label: 'Findings During Procedure', field: 'findingsDuringProcedure', rows: 3 },
            { label: 'Procedure Performed', field: 'procedurePerformed', rows: 4 },
          ].map((item) => (
            <div key={item.field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {item.label}
              </label>
              <textarea
                value={(record?.[item.field as keyof IntraOpData] as string) || ''}
                onChange={(e) => handleFieldChange(item.field as keyof IntraOpData, e.target.value)}
                rows={item.rows || 2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Surgical Counts */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Surgical Counts
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Swab Count', field: 'swabCount' },
              { label: 'Instrument Count', field: 'instrumentCount' },
              { label: 'Needle Count', field: 'needleCount' },
            ].map((item) => (
              <div key={item.field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {item.label}
                </label>
                <input
                  type="text"
                  value={(record?.[item.field as keyof IntraOpData] as string) || ''}
                  onChange={(e) => handleFieldChange(item.field as keyof IntraOpData, e.target.value)}
                  placeholder="e.g., 10/10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={record?.countsVerified || false}
              onChange={(e) => handleFieldChange('countsVerified', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-900 dark:text-white font-medium">
              All counts verified and correct
            </span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Team Notes
        </h4>
        <div className="space-y-4">
          {[
            { label: 'Surgeon Notes', field: 'surgeonNotes' },
            { label: 'Anesthesia Notes', field: 'anesthesiaNotes' },
            { label: 'Nursing Notes', field: 'nursingNotes' },
          ].map((item) => (
            <div key={item.field}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4" />
                {item.label}
              </label>
              <textarea
                value={(record?.[item.field as keyof IntraOpData] as string) || ''}
                onChange={(e) => handleFieldChange(item.field as keyof IntraOpData, e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          ))}
        </div>
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
