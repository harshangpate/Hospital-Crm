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
  Pill,
  Plus,
  X,
  Search,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

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

interface Medication {
  id: string;
  name: string;
  genericName: string;
  medicationForm: string;
  strength: string;
  category: string;
  unitPrice: number;
}

interface PrescriptionItem {
  medicationId: string;
  medication?: Medication;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route: string;
  instructions: string;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<UserData[]>([]);
  const [doctors, setDoctors] = useState<UserData[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchDoctor, setSearchDoctor] = useState("");
  const [searchMedication, setSearchMedication] = useState("");
  const [showMedicationSearch, setShowMedicationSearch] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    diagnosis: "",
    notes: "",
    refillsAllowed: "0",
    validUntil: "",
  });

  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);

  useEffect(() => {
    // Get current user info
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    
    fetchPatients();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (searchMedication.length >= 2) {
      searchMedications();
    }
  }, [searchMedication]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/v1/users?role=PATIENT&limit=100",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  const searchMedications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/prescriptions/medications/search?q=${searchMedication}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMedications(data.data);
      }
    } catch (error) {
      console.error("Error searching medications:", error);
    }
  };

  const addMedication = (medication: Medication) => {
    const newItem: PrescriptionItem = {
      medicationId: medication.id,
      medication,
      dosage: "1 tablet",
      frequency: "Twice daily",
      duration: "7 days",
      quantity: 14,
      route: "Oral",
      instructions: "",
    };
    setPrescriptionItems([...prescriptionItems, newItem]);
    setShowMedicationSearch(false);
    setSearchMedication("");
    setMedications([]);
  };

  const removeMedication = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    const updated = [...prescriptionItems];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptionItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prescriptionItems.length === 0) {
      alert("Please add at least one medication");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
        refillsAllowed: parseInt(formData.refillsAllowed),
        validUntil: formData.validUntil || undefined,
        items: prescriptionItems.map((item) => ({
          medicationId: item.medicationId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          route: item.route,
          instructions: item.instructions,
        })),
      };

      const response = await fetch("http://localhost:5000/api/v1/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        // Check for drug interactions
        if (data.warnings && data.warnings.interactions) {
          setInteractions(data.warnings.interactions);
          if (
            confirm(
              `Warning: ${data.warnings.interactions.length} drug interaction(s) detected. View details?`
            )
          ) {
            return; // Show interactions
          }
        }
        alert("Prescription created successfully!");
        router.push(`/dashboard/prescriptions/${data.data.id}`);
      } else {
        alert(data.message || "Failed to create prescription");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      alert("Failed to create prescription");
    } finally {
      setLoading(false);
    }
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
            <Pill className="h-8 w-8 text-blue-600" />
            New Prescription
          </h1>
          <p className="text-gray-600 mt-1">Create a new prescription with medications</p>
        </div>

        {/* Drug Interactions Alert */}
        {interactions.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-2">
                  Drug Interactions Detected ({interactions.length})
                </h3>
                <div className="space-y-2">
                  {interactions.map((interaction: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded border border-red-200">
                      <p className="font-semibold text-red-900">
                        {interaction.medication.name} ↔ {interaction.interactsWith.name}
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        {interaction.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                          Severity: {interaction.severityLevel}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                          {interaction.interactionType}
                        </span>
                      </div>
                      {interaction.recommendation && (
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Recommendation:</strong> {interaction.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
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
                      Dr. {doctor.firstName} {doctor.lastName} -{" "}
                      {doctor.doctor?.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnosis */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows={2}
                  placeholder="Enter diagnosis..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Refills and Validity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refills Allowed
                </label>
                <input
                  type="number"
                  value={formData.refillsAllowed}
                  onChange={(e) =>
                    setFormData({ ...formData, refillsAllowed: e.target.value })
                  }
                  min="0"
                  max="12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional notes or instructions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Medications *</h2>
              <button
                type="button"
                onClick={() => setShowMedicationSearch(!showMedicationSearch)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </button>
            </div>

            {/* Medication Search */}
            {showMedicationSearch && (
              <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search medications by name..."
                    value={searchMedication}
                    onChange={(e) => setSearchMedication(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                {medications.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {medications.map((med) => (
                      <div
                        key={med.id}
                        onClick={() => addMedication(med)}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{med.name}</p>
                            {med.genericName && (
                              <p className="text-sm text-gray-600">
                                Generic: {med.genericName}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {med.medicationForm} • {med.strength}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {med.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Added Medications */}
            {prescriptionItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No medications added yet</p>
                <p className="text-sm">Click "Add Medication" to search and add</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptionItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {index + 1}. {item.medication?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.medication?.medicationForm} •{" "}
                          {item.medication?.strength}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => updateItem(index, "dosage", e.target.value)}
                          placeholder="e.g., 1 tablet"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Frequency
                        </label>
                        <select
                          value={item.frequency}
                          onChange={(e) => updateItem(index, "frequency", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option>Once daily</option>
                          <option>Twice daily</option>
                          <option>Three times daily</option>
                          <option>Four times daily</option>
                          <option>Every 4 hours</option>
                          <option>Every 6 hours</option>
                          <option>Every 8 hours</option>
                          <option>Every 12 hours</option>
                          <option>As needed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => updateItem(index, "duration", e.target.value)}
                          placeholder="e.g., 7 days"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseInt(e.target.value))
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Route
                        </label>
                        <select
                          value={item.route}
                          onChange={(e) => updateItem(index, "route", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option>Oral</option>
                          <option>Sublingual</option>
                          <option>Topical</option>
                          <option>Intravenous</option>
                          <option>Intramuscular</option>
                          <option>Subcutaneous</option>
                          <option>Inhalation</option>
                          <option>Rectal</option>
                          <option>Ophthalmic</option>
                          <option>Otic</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => updateItem(index, "instructions", e.target.value)}
                          placeholder="e.g., Take with food"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || prescriptionItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Prescription
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
