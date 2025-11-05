'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  AlertCircle,
  Save,
  Search
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface Patient {
  id: string;
  patientId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    gender: string;
    dateOfBirth: string;
  };
}

interface ImagingTest {
  id: string;
  testName: string;
  testCode: string;
  modality: string;
  bodyPart: string;
  requiresContrast: boolean;
  price: number;
  discountedPrice: number | null;
}

interface FormData {
  patientId: string;
  imagingCatalogId: string;
  modality: string;
  bodyPart: string;
  studyDescription: string;
  clinicalIndication: string;
  urgencyLevel: string;
  scheduledDate: string;
  scheduledTime: string;
  requiresContrast: boolean;
  contrastType: string;
  specialInstructions: string;
}

const URGENCY_LEVELS = [
  { value: 'ROUTINE', label: 'Routine', color: 'bg-gray-100 text-gray-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-orange-100 text-orange-700' },
  { value: 'EMERGENCY', label: 'Emergency', color: 'bg-red-100 text-red-700' },
  { value: 'STAT', label: 'STAT', color: 'bg-red-600 text-white' },
];

const MODALITY_OPTIONS = [
  'X_RAY',
  'CT',
  'MRI',
  'ULTRASOUND',
  'MAMMOGRAPHY',
  'PET_SCAN',
  'FLUOROSCOPY',
  'NUCLEAR_MEDICINE',
  'DEXA_SCAN',
];

export default function OrderImagingTestPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [imagingTests, setImagingTests] = useState<ImagingTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<ImagingTest[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    imagingCatalogId: '',
    modality: '',
    bodyPart: '',
    studyDescription: '',
    clinicalIndication: '',
    urgencyLevel: 'ROUTINE',
    scheduledDate: '',
    scheduledTime: '',
    requiresContrast: false,
    contrastType: '',
    specialInstructions: '',
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR'].includes(user.role)) {
      router.push('/dashboard/radiology');
    }
    fetchPatients();
    fetchImagingTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter tests when modality changes
    if (formData.modality) {
      const filtered = imagingTests.filter(test => test.modality === formData.modality);
      setFilteredTests(filtered);
    } else {
      setFilteredTests([]);
    }
  }, [formData.modality, imagingTests]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users?role=PATIENT&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPatients(result.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchImagingTests = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/imaging-catalog?isActive=true&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setImagingTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching imaging tests:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patientId: patient.id });
    setPatientSearch(`${patient.user.firstName} ${patient.user.lastName} (${patient.patientId})`);
    setShowPatientDropdown(false);
  };

  const handleTestSelect = (testId: string) => {
    const test = imagingTests.find(t => t.id === testId);
    if (test) {
      setFormData({
        ...formData,
        imagingCatalogId: testId,
        bodyPart: test.bodyPart,
        studyDescription: test.testName,
        requiresContrast: test.requiresContrast,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.clinicalIndication || !formData.modality || !formData.bodyPart) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Combine date and time for scheduledDate
      let scheduledDateTime = null;
      if (formData.scheduledDate && formData.scheduledTime) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      }

      const payload = {
        patientId: formData.patientId,
        imagingCatalogId: formData.imagingCatalogId || undefined,
        modality: formData.modality,
        bodyPart: formData.bodyPart,
        studyDescription: formData.studyDescription,
        clinicalIndication: formData.clinicalIndication,
        urgencyLevel: formData.urgencyLevel,
        scheduledDate: scheduledDateTime,
        requiresContrast: formData.requiresContrast,
        contrastType: formData.contrastType || undefined,
        specialInstructions: formData.specialInstructions || undefined,
        orderedBy: user?.id,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Imaging test ordered successfully! Test #: ${result.data.testNumber}`);
        router.push('/dashboard/radiology');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to order imaging test');
      }
    } catch (error) {
      console.error('Error ordering imaging test:', error);
      alert('Error ordering imaging test');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = patientSearch.toLowerCase();
    return (
      patient.patientId.toLowerCase().includes(searchLower) ||
      patient.user.firstName.toLowerCase().includes(searchLower) ||
      patient.user.lastName.toLowerCase().includes(searchLower) ||
      patient.user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/radiology"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Radiology Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Order Imaging Test
            </h1>
            <p className="text-gray-600 mt-2">
              Create a new radiology/imaging test order
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Patient Information
              </h2>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Search by name, patient ID, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {patient.user.firstName} {patient.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.patientId} • {patient.user.email}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Patient ID:</span>
                      <span className="ml-2 text-gray-900">{selectedPatient.patientId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Gender:</span>
                      <span className="ml-2 text-gray-900">{selectedPatient.user.gender}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="ml-2 text-gray-900">{selectedPatient.user.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">DOB:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedPatient.user.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Details */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Test Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.modality}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value, imagingCatalogId: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Modality</option>
                    {MODALITY_OPTIONS.map(modality => (
                      <option key={modality} value={modality}>
                        {modality.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.modality && filteredTests.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Template (Optional)
                    </label>
                    <select
                      value={formData.imagingCatalogId}
                      onChange={(e) => handleTestSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a test template...</option>
                      {filteredTests.map(test => (
                        <option key={test.id} value={test.id}>
                          {test.testName} - {test.bodyPart}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Part <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Chest, Abdomen, Head"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Study Description
                  </label>
                  <input
                    type="text"
                    value={formData.studyDescription}
                    onChange={(e) => setFormData({ ...formData, studyDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CT Chest with Contrast"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Indication <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.clinicalIndication}
                    onChange={(e) => setFormData({ ...formData, clinicalIndication: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Reason for imaging, symptoms, suspected diagnosis..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Scheduling & Urgency */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Scheduling & Priority
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {URGENCY_LEVELS.map((level) => (
                      <label
                        key={level.value}
                        className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="urgency"
                          value={level.value}
                          checked={formData.urgencyLevel === level.value}
                          onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${level.color}`}>
                          {level.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Scheduled Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank if scheduling will be done later
                  </p>
                </div>
              </div>
            </div>

            {/* Contrast & Additional Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.requiresContrast}
                      onChange={(e) => setFormData({ ...formData, requiresContrast: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Requires Contrast Agent
                    </span>
                  </label>
                </div>

                {formData.requiresContrast && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contrast Type
                    </label>
                    <input
                      type="text"
                      value={formData.contrastType}
                      onChange={(e) => setFormData({ ...formData, contrastType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Iodinated, Gadolinium"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Any special instructions or precautions..."
                  />
                </div>
              </div>
            </div>

            {/* Alert Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Before ordering:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensure patient has no contraindications for the selected modality</li>
                  <li>Verify patient allergies, especially if contrast is required</li>
                  <li>Check if patient preparation instructions have been provided</li>
                  <li>Confirm scheduling availability for urgent/emergency cases</li>
                </ul>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <Link
                href="/dashboard/radiology"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Order Imaging Test
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
