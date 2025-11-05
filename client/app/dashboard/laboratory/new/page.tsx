'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TestTube2, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Patient {
  id: string;
  patientId: string;
}

interface UserWithPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  patient?: Patient;
}

export default function NewLabTestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<UserWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [patientId, setPatientId] = useState('');
  const [testName, setTestName] = useState('');
  const [testCategories, setTestCategories] = useState<string[]>([]);
  const [testType, setTestType] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sampleTypes, setSampleTypes] = useState<string[]>([]);
  const [cost, setCost] = useState('');
  const [labNotes, setLabNotes] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchAllPatients();
  }, []);

  const fetchAllPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/users?role=PATIENT&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // The API returns { data: { users: [], pagination: {} } }
        if (result.data && Array.isArray(result.data.users)) {
          const usersWithPatients = result.data.users.filter((u: UserWithPatient) => u.patient);
          setUsers(usersWithPatients);
        } else {
          setUsers([]);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch patients:', response.statusText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle test category selection
  const toggleTestCategory = (category: string) => {
    setTestCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle sample type selection
  const toggleSampleType = (type: string) => {
    setSampleTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !testName || testCategories.length === 0) {
      alert('Please fill in all required fields (at least one test category)');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/lab-tests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patientId,
            doctorId: user?.role === 'DOCTOR' ? user.id : undefined,
            testName,
            testCategory: testCategories.join(', '), // Join multiple categories with comma
            testType: testType || undefined,
            scheduledDate: scheduledDate || undefined,
            sampleType: sampleTypes.length > 0 ? sampleTypes.join(', ') : undefined, // Join multiple sample types
            cost: cost ? parseFloat(cost) : undefined,
            labNotes: labNotes || undefined,
          }),
        }
      );

      if (response.ok) {
        alert('Lab test ordered successfully!');
        // Redirect based on user role
        if (user?.role === 'DOCTOR') {
          router.push('/dashboard/lab-tests');
        } else {
          router.push('/dashboard/laboratory');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create lab test');
      }
    } catch (error) {
      console.error('Error creating lab test:', error);
      alert('Error creating lab test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
        <div className="mb-6">
          <Link
            href={user?.role === 'DOCTOR' ? '/dashboard/lab-tests' : '/dashboard/laboratory'}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            {user?.role === 'DOCTOR' ? 'Back to Lab Tests' : 'Back to Laboratory'}
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TestTube2 className="h-8 w-8 text-blue-600" />
            New Lab Test Order
          </h1>
          <p className="text-gray-600 mt-2">Create a new laboratory test order</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient *
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading patients...' : 'Select a patient'}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.patient!.id}>
                    {u.firstName} {u.lastName} - {u.patient!.patientId} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Complete Blood Count"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <input
                    type="text"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    placeholder="e.g., Blood Test, Urine Test"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Categories * (Select one or more)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'Hematology',
                      'Biochemistry',
                      'Microbiology',
                      'Pathology',
                      'Immunology',
                      'Serology',
                      'Virology',
                      'Bacteriology',
                      'Parasitology',
                      'Molecular Biology',
                      'Cytology',
                      'Histopathology',
                      'Clinical Chemistry',
                      'Toxicology',
                      'Endocrinology',
                      'Hematology & Coagulation',
                      'Blood Bank',
                      'Genetics',
                      'Tumor Markers',
                      'Allergy Testing',
                      'Drug Screening',
                      'Hormone Assay',
                      'Cardiac Markers',
                      'Liver Function',
                      'Kidney Function',
                      'Thyroid Function',
                      'Lipid Profile',
                      'Diabetes Panel',
                      'Infectious Disease',
                      'Autoimmune Panel',
                      'General Health',
                      'Other'
                    ].map((category) => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={testCategories.includes(category)}
                          onChange={() => toggleTestCategory(category)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                  {testCategories.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {testCategories.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Types (Select one or more)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      'Blood (Whole)',
                      'Blood (Serum)',
                      'Blood (Plasma)',
                      'Urine',
                      'Stool',
                      'Saliva',
                      'Sputum',
                      'CSF (Cerebrospinal Fluid)',
                      'Tissue Biopsy',
                      'Bone Marrow',
                      'Swab (Throat)',
                      'Swab (Nasal)',
                      'Swab (Wound)',
                      'Swab (Vaginal)',
                      'Swab (Urethral)',
                      'Pleural Fluid',
                      'Peritoneal Fluid',
                      'Synovial Fluid',
                      'Amniotic Fluid',
                      'Semen',
                      'Hair',
                      'Nail',
                      'Skin Scraping',
                      'Aspirate',
                      'Pus',
                      'Other'
                    ].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={sampleTypes.includes(type)}
                          onChange={() => toggleSampleType(type)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                  {sampleTypes.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {sampleTypes.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lab Notes
                </label>
                <textarea
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  rows={4}
                  placeholder="Additional notes or instructions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting || !patientId}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Creating...' : 'Create Lab Test Order'}
            </button>
            <Link
              href={user?.role === 'DOCTOR' ? '/dashboard/lab-tests' : '/dashboard/laboratory'}
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
