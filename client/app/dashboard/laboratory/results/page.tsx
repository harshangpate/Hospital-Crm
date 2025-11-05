'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  TestTube2, 
  Save,
  ArrowLeft,
  FileText,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  status: string;
  orderedDate: string;
  patient: {
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
  };
  sampleType: string | null;
  normalRange: string | null;
  labNotes: string | null;
}

export default function ResultEntryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultEntryContent />
    </Suspense>
  );
}

function ResultEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<LabTest | null>(null);
  
  // Form state
  const [results, setResults] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [normalRange, setNormalRange] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    if (testId) {
      fetchTestDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, testId]);

  const fetchTestDetails = async () => {
    if (!token || !testId) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTest(result.data);
        setNormalRange(result.data.normalRange || '');
        setLabNotes(result.data.labNotes || '');
        setPerformedBy(user?.firstName + ' ' + user?.lastName || '');
      } else {
        alert('Failed to fetch test details');
        router.push('/dashboard/laboratory/pending');
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      alert('Error fetching test details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResults = async () => {
    if (!token || !testId) return;

    // Validation
    if (!results.trim()) {
      alert('Please enter test results');
      return;
    }

    if (!performedBy.trim()) {
      alert('Please enter who performed the test');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}/results`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            results,
            interpretation,
            normalRange: normalRange || undefined,
            performedBy,
            verifiedBy: verifiedBy || undefined,
            labNotes: labNotes || undefined,
          }),
        }
      );

      if (response.ok) {
        alert('Results submitted successfully!');
        router.push('/dashboard/laboratory/pending');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit results');
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      alert('Error submitting results');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading test details...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!test) {
    return (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN']}>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Test not found</h3>
            <button
              onClick={() => router.push('/dashboard/laboratory/pending')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Go back to pending tests
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <TestTube2 className="h-8 w-8 text-blue-600" />
                  Enter Lab Results
                </h1>
                <p className="text-gray-600 mt-1">
                  Submit test results for {test.testName}
                </p>
              </div>
            </div>
          </div>

          {/* Test & Patient Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Test Number</p>
                    <p className="font-medium text-gray-900">{test.testNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <TestTube2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Test Name</p>
                    <p className="font-medium text-gray-900">{test.testName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">{test.testCategory}</p>
                  </div>
                </div>
                {test.sampleType && (
                  <div className="flex items-start gap-3">
                    <TestTube2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Sample Type</p>
                      <p className="font-medium text-gray-900">{test.sampleType}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-start gap-3 mb-4">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-medium text-gray-900">
                      {test.patient.user.firstName} {test.patient.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {test.patient.patientId} • {calculateAge(test.patient.user.dateOfBirth)}Y • {test.patient.user.gender}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Ordered Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(test.orderedDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-gray-900">{test.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Test Results</h2>

            <div className="space-y-6">
              {/* Critical Result Flag */}
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="isCritical"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="isCritical" className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Mark as Critical Result (requires immediate attention)
                </label>
              </div>

              {/* Results Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Results <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  rows={6}
                  placeholder="Enter detailed test results, measurements, observations..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter all measurements, values, and observations from the test
                </p>
              </div>

              {/* Normal Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Normal Range
                </label>
                <input
                  type="text"
                  value={normalRange}
                  onChange={(e) => setNormalRange(e.target.value)}
                  placeholder="e.g., 70-100 mg/dL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Reference range for normal values
                </p>
              </div>

              {/* Interpretation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interpretation / Comments
                </label>
                <textarea
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  rows={4}
                  placeholder="Enter clinical interpretation, significance, or recommendations..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Clinical interpretation of the results
                </p>
              </div>

              {/* Performed By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performed By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  placeholder="Lab technician name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Verified By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verified By (Optional)
                </label>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  placeholder="Doctor/Pathologist name (if verified)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Name of the doctor or pathologist who verified the results
                </p>
              </div>

              {/* Lab Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lab Notes
                </label>
                <textarea
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes, technical details, or special observations..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResults}
                disabled={submitting || !results.trim() || !performedBy.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Submit Results
                  </>
                )}
              </button>
            </div>
            {isCritical && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    Critical results will be flagged and the ordering doctor will be notified immediately.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Success Message */}
          {submitting && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Results are being submitted. Please wait...
                </p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
