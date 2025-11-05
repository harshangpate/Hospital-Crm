'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  TestTube2, 
  User, 
  CheckCircle2,
  Edit,
  Save,
  X,
  Printer
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  testType: string | null;
  status: string;
  orderedDate: string;
  scheduledDate: string | null;
  collectionDate: string | null;
  resultDate: string | null;
  sampleType: string | null;
  sampleCollectedBy: string | null;
  results: string | null;
  resultDocument: string | null;
  normalRange: string | null;
  interpretation: string | null;
  performedBy: string | null;
  verifiedBy: string | null;
  labNotes: string | null;
  cost: number | null;
  isPaid: boolean;
  // Sample Tracking Fields
  sampleBarcode: string | null;
  sampleCondition: string | null;
  sampleLocation: string | null;
  sampleNotes: string | null;
  chainOfCustody: string | null;
  // Critical Value Fields
  isCritical: boolean;
  criticalNotifiedAt: string | null;
  // Approval Workflow Fields
  approvedBy: string | null;
  approvedAt: string | null;
  approvalComments: string | null;
  rejectionReason: string | null;
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
}

export default function LabTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();
  const [labTest, setLabTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [status, setStatus] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [sampleCollectedBy, setSampleCollectedBy] = useState('');
  const [results, setResults] = useState('');
  const [normalRange, setNormalRange] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [labNotes, setLabNotes] = useState('');
  
  // Sample Tracking states
  const [sampleBarcode, setSampleBarcode] = useState('');
  const [sampleCondition, setSampleCondition] = useState('');
  const [sampleLocation, setSampleLocation] = useState('');
  const [sampleNotes, setSampleNotes] = useState('');
  const [chainOfCustody, setChainOfCustody] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'NURSE'].includes(user.role)) {
      router.push('/dashboard');
    }
    fetchLabTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLabTest = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setLabTest(result.data);
        setStatus(result.data.status);
        setResults(result.data.results || '');
        setNormalRange(result.data.normalRange || '');
        setInterpretation(result.data.interpretation || '');
        setPerformedBy(result.data.performedBy || '');
        setVerifiedBy(result.data.verifiedBy || '');
        setLabNotes(result.data.labNotes || '');
        setSampleCollectedBy(result.data.sampleCollectedBy || '');
        // Initialize sample tracking fields
        setSampleBarcode(result.data.sampleBarcode || '');
        setSampleCondition(result.data.sampleCondition || 'Good');
        setSampleLocation(result.data.sampleLocation || '');
        setSampleNotes(result.data.sampleNotes || '');
        setChainOfCustody(result.data.chainOfCustody || '');
      }
    } catch (error) {
      console.error('Error fetching lab test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${params.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            collectionDate: collectionDate || undefined,
            sampleCollectedBy: sampleCollectedBy || undefined,
            sampleBarcode: sampleBarcode || undefined,
            sampleCondition: sampleCondition || undefined,
            sampleLocation: sampleLocation || undefined,
            sampleNotes: sampleNotes || undefined,
            chainOfCustody: chainOfCustody || undefined,
          }),
        }
      );

      if (response.ok) {
        alert('Status updated successfully!');
        fetchLabTest();
        setEditing(false);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  const generateBarcode = () => {
    // Generate a unique barcode using test number and timestamp
    const timestamp = Date.now().toString(36).toUpperCase();
    const barcode = `LAB-${labTest?.testNumber}-${timestamp}`;
    setSampleBarcode(barcode);
  };

  const handleApproveResults = async () => {
    const approvalComments = prompt('Enter approval comments (optional):');
    
    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${params.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approvalComments,
          }),
        }
      );

      if (response.ok) {
        alert('Test results approved successfully!');
        fetchLabTest();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to approve results');
      }
    } catch (error) {
      console.error('Error approving results:', error);
      alert('Error approving results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectResults = async () => {
    const rejectionReason = prompt('Enter rejection reason (required):');
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${params.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rejectionReason,
          }),
        }
      );

      if (response.ok) {
        alert('Test results rejected and sent back for corrections');
        fetchLabTest();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to reject results');
      }
    } catch (error) {
      console.error('Error rejecting results:', error);
      alert('Error rejecting results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResults = async () =>{
    if (!results) {
      alert('Please enter test results');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${params.id}/results`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            results,
            normalRange,
            interpretation,
            performedBy,
            verifiedBy,
            labNotes,
          }),
        }
      );

      if (response.ok) {
        alert('Test results submitted successfully!');
        fetchLabTest();
        setEditing(false);
      } else {
        alert('Failed to submit results');
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      alert('Error submitting results');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      ORDERED: 'bg-yellow-100 text-yellow-800',
      SAMPLE_COLLECTED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!labTest) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="text-center">
              <p className="text-red-600">Lab test not found</p>
              <Link href="/dashboard/laboratory" className="text-blue-600 hover:underline mt-4 inline-block">
                Back to Laboratory
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const canEditStatus = user?.role && ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'].includes(user.role);
  const canSubmitResults = user?.role && ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'].includes(user.role);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
      {/* Print-only Header */}
      <header className="print-header">
        <h1>Hospital Laboratory Report</h1>
        <p>Generated on {new Date().toLocaleString()}</p>
      </header>

      {/* Header */}
      <div className="mb-6 print-hide">
        <Link
          href="/dashboard/laboratory"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Laboratory
        </Link>

        {/* Critical Value Alert Banner */}
        {labTest.isCritical && labTest.results && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-4 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800">
                  🚨 CRITICAL VALUE ALERT
                </h3>
                <p className="text-red-700 mt-1">
                  This test result has been flagged as critical and requires immediate attention.
                  {labTest.criticalNotifiedAt && (
                    <span className="ml-2 text-sm">
                      Doctor notified on {new Date(labTest.criticalNotifiedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TestTube2 className="h-8 w-8 text-blue-600" />
              {labTest.testNumber}
            </h1>
            <p className="text-gray-600 mt-2">{labTest.testName}</p>
          </div>
          <div className="flex items-center gap-3">
            {labTest.status === 'COMPLETED' && labTest.results && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Printer className="h-5 w-5" />
                Print Report
              </button>
            )}
            
            {/* Approval Workflow Buttons - Show for SUPER_ADMIN and ADMIN only */}
            {labTest.status === 'PENDING_APPROVAL' && ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
              <>
                <button
                  onClick={handleApproveResults}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {submitting ? 'Processing...' : 'Approve Results'}
                </button>
                <button
                  onClick={handleRejectResults}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  <X className="h-5 w-5" />
                  Reject Results
                </button>
              </>
            )}

            {canEditStatus && !editing && labTest.status !== 'COMPLETED' && labTest.status !== 'PENDING_APPROVAL' && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-5 w-5" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient & Test Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TestTube2 className="h-5 w-5 text-blue-600" />
              Test Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Number</label>
                <p className="text-gray-900">{labTest.testNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {editing ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ORDERED">Ordered</option>
                    <option value="SAMPLE_COLLECTED">Sample Collected</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                ) : (
                  getStatusBadge(labTest.status)
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                <p className="text-gray-900">{labTest.testName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900">{labTest.testCategory}</p>
              </div>
              {labTest.testType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                  <p className="text-gray-900">{labTest.testType}</p>
                </div>
              )}
              {labTest.sampleType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
                  <p className="text-gray-900">{labTest.sampleType}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordered Date</label>
                <p className="text-gray-900">{new Date(labTest.orderedDate).toLocaleString()}</p>
              </div>
              {labTest.scheduledDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <p className="text-gray-900">{new Date(labTest.scheduledDate).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Sample Collection Info */}
            {(labTest.collectionDate || editing) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Collection & Tracking</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <input
                        type="datetime-local"
                        value={collectionDate}
                        onChange={(e) => setCollectionDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : labTest.collectionDate ? (
                      <p className="text-gray-900">{new Date(labTest.collectionDate).toLocaleString()}</p>
                    ) : (
                      <p className="text-gray-500">Not collected yet</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collected By</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <input
                        type="text"
                        value={sampleCollectedBy}
                        onChange={(e) => setSampleCollectedBy(e.target.value)}
                        placeholder="Technician name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : labTest.sampleCollectedBy ? (
                      <p className="text-gray-900">{labTest.sampleCollectedBy}</p>
                    ) : (
                      <p className="text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Barcode Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sample Barcode</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sampleBarcode}
                          onChange={(e) => setSampleBarcode(e.target.value)}
                          placeholder="LAB-XXX-XXXXX"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={generateBarcode}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          Generate
                        </button>
                      </div>
                    ) : labTest.sampleBarcode ? (
                      <p className="text-gray-900 font-mono">{labTest.sampleBarcode}</p>
                    ) : (
                      <p className="text-gray-500">No barcode</p>
                    )}
                  </div>

                  {/* Sample Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sample Condition</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <select
                        value={sampleCondition}
                        onChange={(e) => setSampleCondition(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Good">Good</option>
                        <option value="Hemolyzed">Hemolyzed</option>
                        <option value="Clotted">Clotted</option>
                        <option value="Contaminated">Contaminated</option>
                        <option value="Insufficient">Insufficient Volume</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : labTest.sampleCondition ? (
                      <span className={`inline-block px-2 py-1 text-sm rounded ${
                        labTest.sampleCondition === 'Good' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {labTest.sampleCondition}
                      </span>
                    ) : (
                      <p className="text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Storage Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <input
                        type="text"
                        value={sampleLocation}
                        onChange={(e) => setSampleLocation(e.target.value)}
                        placeholder="e.g., Fridge A, Shelf 2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : labTest.sampleLocation ? (
                      <p className="text-gray-900">{labTest.sampleLocation}</p>
                    ) : (
                      <p className="text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Chain of Custody */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chain of Custody</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <textarea
                        value={chainOfCustody}
                        onChange={(e) => setChainOfCustody(e.target.value)}
                        rows={2}
                        placeholder="Record who handled the sample and when..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : labTest.chainOfCustody ? (
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{labTest.chainOfCustody}</p>
                    ) : (
                      <p className="text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Sample Notes */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sample Notes</label>
                    {editing && status === 'SAMPLE_COLLECTED' ? (
                      <textarea
                        value={sampleNotes}
                        onChange={(e) => setSampleNotes(e.target.value)}
                        rows={2}
                        placeholder="Any special observations about the sample..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : labTest.sampleNotes ? (
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{labTest.sampleNotes}</p>
                    ) : (
                      <p className="text-gray-500">No notes</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Results Section */}
          {(labTest.status === 'IN_PROGRESS' || labTest.status === 'COMPLETED' || editing) && canSubmitResults && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Test Results
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Results *</label>
                  {editing || !labTest.results ? (
                    <textarea
                      value={results}
                      onChange={(e) => setResults(e.target.value)}
                      rows={4}
                      placeholder="Enter test results..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{labTest.results}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Normal Range</label>
                  {editing || !labTest.normalRange ? (
                    <input
                      type="text"
                      value={normalRange}
                      onChange={(e) => setNormalRange(e.target.value)}
                      placeholder="e.g., 70-100 mg/dL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{labTest.normalRange}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interpretation</label>
                  {editing || !labTest.interpretation ? (
                    <textarea
                      value={interpretation}
                      onChange={(e) => setInterpretation(e.target.value)}
                      rows={3}
                      placeholder="Medical interpretation of results..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{labTest.interpretation}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Performed By</label>
                    {editing || !labTest.performedBy ? (
                      <input
                        type="text"
                        value={performedBy}
                        onChange={(e) => setPerformedBy(e.target.value)}
                        placeholder="Technician name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{labTest.performedBy}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verified By</label>
                    {editing || !labTest.verifiedBy ? (
                      <input
                        type="text"
                        value={verifiedBy}
                        onChange={(e) => setVerifiedBy(e.target.value)}
                        placeholder="Doctor/Supervisor name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{labTest.verifiedBy}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lab Notes</label>
                  {editing || !labTest.labNotes ? (
                    <textarea
                      value={labNotes}
                      onChange={(e) => setLabNotes(e.target.value)}
                      rows={3}
                      placeholder="Additional notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{labTest.labNotes}</p>
                  )}
                </div>

                {labTest.resultDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result Date</label>
                    <p className="text-gray-900">{new Date(labTest.resultDate).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Workflow Information */}
          {(labTest.status === 'PENDING_APPROVAL' || labTest.status === 'COMPLETED' || labTest.rejectionReason) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                Approval Workflow
              </h2>
              
              <div className="space-y-4">
                {/* Pending Approval Message */}
                {labTest.status === 'PENDING_APPROVAL' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 font-medium">
                      ⏳ Results submitted and awaiting senior approval
                    </p>
                    <p className="text-orange-600 text-sm mt-1">
                      A pathologist or senior lab technician must review and approve these results before they are finalized.
                    </p>
                  </div>
                )}

                {/* Approval Information */}
                {labTest.approvedBy && labTest.approvedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✅ Results Approved
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Approved on {new Date(labTest.approvedAt).toLocaleString()}
                    </p>
                    {labTest.approvalComments && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Approval Comments:</p>
                        <p className="text-gray-900 text-sm">{labTest.approvalComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Information */}
                {labTest.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">
                      ❌ Results Rejected
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Rejection Reason:</p>
                      <p className="text-gray-900 text-sm">{labTest.rejectionReason}</p>
                    </div>
                    <p className="text-red-600 text-sm mt-2">
                      Please review and resubmit the results with corrections.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {editing && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-4">
                {status === 'SAMPLE_COLLECTED' && (
                  <button
                    onClick={handleUpdateStatus}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {submitting ? 'Updating...' : 'Update Status'}
                  </button>
                )}
                {(status === 'IN_PROGRESS' || status === 'COMPLETED') && (
                  <button
                    onClick={handleSubmitResults}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {submitting ? 'Submitting...' : 'Submit Results'}
                  </button>
                )}
                <button
                  onClick={() => setEditing(false)}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Patient Info */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Patient Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">
                  {labTest.patient.user.firstName} {labTest.patient.user.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <p className="text-gray-900">{labTest.patient.patientId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{labTest.patient.user.email}</p>
              </div>
              {labTest.patient.user.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{labTest.patient.user.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <p className="text-gray-900">{labTest.patient.user.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900">
                  {new Date(labTest.patient.user.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6 print-hide">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-3">
              {labTest.cost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <p className="text-gray-900 text-lg font-semibold">₹{labTest.cost.toFixed(2)}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  labTest.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {labTest.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures Section (Print Only) */}
      <div className="print-header signatures">
        <div className="signature-block">
          <div className="signature-line"></div>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            <strong>{labTest.performedBy || 'Lab Technician'}</strong>
            <br />
            <span style={{ fontSize: '12px' }}>Performed By</span>
          </p>
        </div>
        <div className="signature-block">
          <div className="signature-line"></div>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            <strong>{labTest.verifiedBy || 'Pathologist'}</strong>
            <br />
            <span style={{ fontSize: '12px' }}>Verified By</span>
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the main content */
          nav,
          aside,
          header:not(.print-header),
          .no-print,
          button,
          .print-hide {
            display: none !important;
          }

          /* Show print header */
          .print-header {
            display: block !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 20mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Main content */
          .min-h-screen {
            min-height: auto;
            background: white;
            padding: 0;
          }

          /* Cards */
          .bg-white {
            box-shadow: none !important;
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
          }

          /* Typography */
          .text-gray-900 {
            color: #000 !important;
          }

          .text-gray-600,
          .text-gray-700 {
            color: #333 !important;
          }

          /* Remove unnecessary spacing */
          .gap-6 {
            gap: 1rem;
          }

          /* Print header (hidden by default, shown in print) */
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
          }

          .print-header h1 {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }

          .print-header p {
            font-size: 14px;
            color: #666;
          }

          /* Signatures section */
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }

          .signature-block {
            text-align: center;
          }

          .signature-line {
            width: 200px;
            border-top: 1px solid #000;
            margin-bottom: 5px;
          }
        }

        /* Hide print header in normal view */
        .print-header {
          display: none;
        }
      `}</style>
    </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
