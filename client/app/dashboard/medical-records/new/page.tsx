"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Stethoscope,
  FileText,
  Activity,
  Plus,
  X,
} from "lucide-react";

interface Patient {
  id: string;
  patientId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Doctor {
  id: string;
  doctorId: string;
  user: {
    firstName: string;
    lastName: string;
  };
  specialization: string;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  patient?: {
    id: string;
    patientId: string;
  };
  doctor?: {
    id: string;
    doctorId: string;
    specialization: string;
  };
}

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<UserData[]>([]);
  const [doctors, setDoctors] = useState<UserData[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchDoctor, setSearchDoctor] = useState("");

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    recordType: "CONSULTATION",
    chiefComplaint: "",
    presentIllness: "",
    examination: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    followUpDate: "",
  });

  const [vitalSigns, setVitalSigns] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });

  const [diagnoses, setDiagnoses] = useState<
    Array<{
      diagnosisName: string;
      icdCode: string;
      diagnosisType: string;
      status: string;
      severity: string;
      notes: string;
    }>
  >([]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/v1/users?role=PATIENT&limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.users)) {
        setPatients(data.data.users);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/v1/users?role=DOCTOR&limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.users)) {
        setDoctors(data.data.users);
        
        // Auto-fill doctor if current user is a doctor
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === "DOCTOR") {
            const currentDoctor = data.data.users.find((d: UserData) => 
              d.firstName === user.firstName && d.lastName === user.lastName
            );
            if (currentDoctor && currentDoctor.doctor) {
              setFormData(prev => ({ ...prev, doctorId: currentDoctor.doctor!.id }));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // Prepare vital signs data (only include non-empty values)
      const vitalSignsData: Record<string, number> = {};
      Object.entries(vitalSigns).forEach(([key, value]) => {
        if (value) {
          vitalSignsData[key] = parseFloat(value);
        }
      });

      const payload = {
        ...formData,
        vitalSigns: Object.keys(vitalSignsData).length > 0 ? vitalSignsData : undefined,
        diagnoses: diagnoses.length > 0 ? diagnoses : undefined,
      };

      const response = await fetch("http://localhost:5000/api/v1/medical-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        alert("Medical record created successfully!");
        router.push(`/dashboard/medical-records/${data.data.id}`);
      } else {
        alert(data.message || "Failed to create medical record");
      }
    } catch (error) {
      console.error("Error creating medical record:", error);
      alert("Failed to create medical record");
    } finally {
      setLoading(false);
    }
  };

  const addDiagnosis = () => {
    setDiagnoses([
      ...diagnoses,
      {
        diagnosisName: "",
        icdCode: "",
        diagnosisType: "PRIMARY",
        status: "ACTIVE",
        severity: "MODERATE",
        notes: "",
      },
    ]);
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const updateDiagnosis = (index: number, field: string, value: string) => {
    const updated = [...diagnoses];
    updated[index] = { ...updated[index], [field]: value };
    setDiagnoses(updated);
  };

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.patient?.patientId || ''}`
      .toLowerCase()
      .includes(searchPatient.toLowerCase())
  );

  const filteredDoctors = doctors.filter((d) =>
    `${d.firstName} ${d.lastName} ${d.doctor?.specialization || ''}`
      .toLowerCase()
      .includes(searchDoctor.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            New Medical Record
          </h1>
          <p className="text-gray-600 mt-1">Create a new patient medical record</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient and Doctor Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selection */}
              <div>
                <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient *
                </label>
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select patient</option>
                  {filteredPatients.map((patient) => (
                    <option key={patient.id} value={patient.patient?.id || ''}>
                      {patient.firstName} {patient.lastName} - ID: {patient.patient?.patientId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Doctor *
                </label>
                <input
                  type="text"
                  placeholder="Search doctor..."
                  value={searchDoctor}
                  onChange={(e) => setSearchDoctor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select doctor</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.doctor?.id || ''}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.doctor?.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {/* Record Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Type *
                </label>
                <select
                  value={formData.recordType}
                  onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="ADMISSION">Admission</option>
                  <option value="SURGERY">Surgery</option>
                  <option value="LAB_RESULT">Lab Result</option>
                  <option value="IMAGING">Imaging</option>
                  <option value="VACCINATION">Vaccination</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                </select>
              </div>

              {/* Follow Up Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Clinical Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinical Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chief Complaint *
                </label>
                <input
                  type="text"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  required
                  placeholder="e.g., Persistent headache for 3 days"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Present Illness
                </label>
                <textarea
                  value={formData.presentIllness}
                  onChange={(e) => setFormData({ ...formData, presentIllness: e.target.value })}
                  rows={3}
                  placeholder="Detailed history of present illness..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Examination Findings
                </label>
                <textarea
                  value={formData.examination}
                  onChange={(e) => setFormData({ ...formData, examination: e.target.value })}
                  rows={3}
                  placeholder="Physical examination findings..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  required
                  rows={2}
                  placeholder="Primary diagnosis..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan
                </label>
                <textarea
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  rows={3}
                  placeholder="Treatment plan and recommendations..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Vital Signs (Optional)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BP Systolic
                </label>
                <input
                  type="number"
                  value={vitalSigns.bloodPressureSystolic}
                  onChange={(e) =>
                    setVitalSigns({ ...vitalSigns, bloodPressureSystolic: e.target.value })
                  }
                  placeholder="120"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BP Diastolic
                </label>
                <input
                  type="number"
                  value={vitalSigns.bloodPressureDiastolic}
                  onChange={(e) =>
                    setVitalSigns({ ...vitalSigns, bloodPressureDiastolic: e.target.value })
                  }
                  placeholder="80"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={vitalSigns.heartRate}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                  placeholder="72"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalSigns.temperature}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                  placeholder="98.6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={vitalSigns.oxygenSaturation}
                  onChange={(e) =>
                    setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })
                  }
                  placeholder="98"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalSigns.weight}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                  placeholder="70"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalSigns.height}
                  onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })}
                  placeholder="170"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Detailed Diagnoses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Detailed Diagnoses (Optional)</h2>
              <button
                type="button"
                onClick={addDiagnosis}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Diagnosis
              </button>
            </div>
            {diagnoses.map((diagnosis, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900">Diagnosis {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeDiagnosis(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis Name
                    </label>
                    <input
                      type="text"
                      value={diagnosis.diagnosisName}
                      onChange={(e) => updateDiagnosis(index, "diagnosisName", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ICD-10 Code
                    </label>
                    <input
                      type="text"
                      value={diagnosis.icdCode}
                      onChange={(e) => updateDiagnosis(index, "icdCode", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={diagnosis.diagnosisType}
                      onChange={(e) => updateDiagnosis(index, "diagnosisType", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="PRIMARY">Primary</option>
                      <option value="SECONDARY">Secondary</option>
                      <option value="DIFFERENTIAL">Differential</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={diagnosis.severity}
                      onChange={(e) => updateDiagnosis(index, "severity", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="MILD">Mild</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="SEVERE">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={diagnosis.status}
                      onChange={(e) => updateDiagnosis(index, "status", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CHRONIC">Chronic</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </DashboardLayout>
  );
}
