'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  User,
  Calendar,
  Activity,
  Printer
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface RadiologyTest {
  id: string;
  testNumber: string;
  modality: string;
  bodyPart: string;
  studyDescription: string;
  status: string;
  urgencyLevel: string;
  orderedDate: string;
  scheduledDate: string | null;
  performedDate: string | null;
  reportedDate: string | null;
  clinicalIndication: string;
  requiresContrast: boolean;
  contrastType: string | null;
  specialInstructions: string | null;
  technique: string | null;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  radiologistNotes: string | null;
  isCritical: boolean;
  criticalFindings: string | null;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
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
  orderedByUser: {
    firstName: string;
    lastName: string;
  } | null;
  approvedByUser: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function RadiologyTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<RadiologyTest | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  
  const [reportData, setReportData] = useState({
    technique: '',
    findings: '',
    impression: '',
    recommendations: '',
    radiologistNotes: '',
    isCritical: false,
    criticalFindings: '',
  });

  const [approvalData, setApprovalData] = useState({
    action: '',
    rejectionReason: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTest(result.data);
        
        // Pre-fill report data if exists
        if (result.data.findings) {
          setReportData({
            technique: result.data.technique || '',
            findings: result.data.findings || '',
            impression: result.data.impression || '',
            recommendations: result.data.recommendations || '',
            radiologistNotes: result.data.radiologistNotes || '',
            isCritical: result.data.isCritical,
            criticalFindings: result.data.criticalFindings || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportData.findings || !reportData.impression) {
      alert('Findings and Impression are required');
      return;
    }

    if (reportData.isCritical && !reportData.criticalFindings) {
      alert('Please specify critical findings');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/${params.id}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reportData),
        }
      );

      if (response.ok) {
        alert('Report submitted successfully for approval');
        setShowReportForm(false);
        fetchTest();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReport = async () => {
    if (!confirm('Are you sure you want to approve this report?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/${params.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Report approved successfully');
        fetchTest();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve report');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      alert('Error approving report');
    }
  };

  const handleRejectReport = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/${params.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );

      if (response.ok) {
        alert('Report rejected');
        fetchTest();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject report');
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('Error rejecting report');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'ORDERED': 'bg-yellow-100 text-yellow-800',
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'PERFORMED': 'bg-indigo-100 text-indigo-800',
      'PENDING_REPORT': 'bg-orange-100 text-orange-800',
      'PENDING_APPROVAL': 'bg-pink-100 text-pink-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: { [key: string]: string } = {
      'ROUTINE': 'bg-gray-100 text-gray-700',
      'URGENT': 'bg-orange-100 text-orange-700',
      'EMERGENCY': 'bg-red-100 text-red-700',
      'STAT': 'bg-red-600 text-white',
    };

    return (
      <span className={`px-3 py-1 text-sm font-bold rounded ${styles[urgency] || 'bg-gray-100 text-gray-800'}`}>
        {urgency}
      </span>
    );
  };

  const canEditReport = () => {
    return ['DOCTOR'].includes(user?.role || '') && 
           ['PENDING_REPORT', 'PERFORMED'].includes(test?.status || '');
  };

  const canApproveReport = () => {
    return ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && 
           test?.status === 'PENDING_APPROVAL';
  };

  const handlePrint = () => {
    window.print();
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

  if (!test) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Test not found</h2>
              <Link href="/dashboard/radiology" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Print Styles */}
          <style jsx global>{`
            @media print {
              body {
                background: white !important;
              }
              
              .no-print {
                display: none !important;
              }
              
              .print-only {
                display: block !important;
              }
              
              .print-container {
                padding: 20mm;
                max-width: 210mm;
                margin: 0 auto;
              }
              
              .print-header {
                border-bottom: 3px solid #2563eb;
                padding-bottom: 10mm;
                margin-bottom: 10mm;
              }
              
              .print-section {
                margin-bottom: 8mm;
                page-break-inside: avoid;
              }
              
              .print-section-title {
                font-size: 14pt;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 3mm;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 2mm;
              }
              
              .print-field {
                margin-bottom: 2mm;
              }
              
              .print-field-label {
                font-weight: 600;
                color: #4b5563;
                display: inline-block;
                min-width: 30mm;
              }
              
              .print-field-value {
                color: #1f2937;
              }
              
              .print-text-content {
                white-space: pre-wrap;
                line-height: 1.6;
                color: #1f2937;
              }
              
              .print-critical-box {
                border: 2px solid #dc2626;
                background: #fef2f2;
                padding: 5mm;
                margin: 5mm 0;
                page-break-inside: avoid;
              }
              
              .print-signature-section {
                margin-top: 15mm;
                page-break-inside: avoid;
              }
              
              .print-signature-line {
                border-top: 1px solid #000;
                width: 60mm;
                margin-top: 15mm;
                padding-top: 2mm;
              }
              
              @page {
                size: A4;
                margin: 15mm;
              }
            }
            
            .print-only {
              display: none;
            }
          `}</style>

          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/radiology"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Radiology Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-600" />
                  {test.testNumber}
                </h1>
                <p className="text-gray-600 mt-2">
                  {test.modality} - {test.bodyPart}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {test.findings && test.status === 'COMPLETED' && (
                  <button
                    onClick={handlePrint}
                    className="no-print flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Printer className="h-4 w-4" />
                    Print Report
                  </button>
                )}
                {getStatusBadge(test.status)}
                {getUrgencyBadge(test.urgencyLevel)}
                {test.isCritical && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    CRITICAL
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Patient & Test Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Patient Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-900">{test.patient.user.firstName} {test.patient.user.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Patient ID:</span>
                    <p className="text-gray-900">{test.patient.patientId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Gender:</span>
                    <p className="text-gray-900">{test.patient.user.gender}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">DOB:</span>
                    <p className="text-gray-900">
                      {new Date(test.patient.user.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900">{test.patient.user.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Test Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Test Details
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Study:</span>
                    <p className="text-gray-900">{test.studyDescription || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Ordered Date:</span>
                    <p className="text-gray-900">{new Date(test.orderedDate).toLocaleString()}</p>
                  </div>
                  {test.scheduledDate && (
                    <div>
                      <span className="font-medium text-gray-700">Scheduled:</span>
                      <p className="text-gray-900">{new Date(test.scheduledDate).toLocaleString()}</p>
                    </div>
                  )}
                  {test.performedDate && (
                    <div>
                      <span className="font-medium text-gray-700">Performed:</span>
                      <p className="text-gray-900">{new Date(test.performedDate).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Ordered By:</span>
                    <p className="text-gray-900">
                      {test.orderedByUser 
                        ? `${test.orderedByUser.firstName} ${test.orderedByUser.lastName}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Contrast:</span>
                    <p className="text-gray-900">
                      {test.requiresContrast ? `Yes (${test.contrastType || 'Not specified'})` : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinical Indication */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Clinical Indication
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {test.clinicalIndication}
                </p>
                {test.specialInstructions && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Special Instructions</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {test.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Report */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Buttons */}
              {(canEditReport() || canApproveReport()) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
                    <div className="flex gap-3">
                      {canEditReport() && !showReportForm && (
                        <button
                          onClick={() => setShowReportForm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          {test.findings ? 'Edit Report' : 'Enter Report'}
                        </button>
                      )}
                      {canApproveReport() && (
                        <>
                          <button
                            onClick={handleApproveReport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve Report
                          </button>
                          <button
                            onClick={handleRejectReport}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject Report
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Status */}
              {(test.isApproved || test.rejectionReason) && (
                <div className={`rounded-lg shadow p-6 ${test.isApproved ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {test.isApproved ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <h2 className="text-lg font-semibold text-green-900">Report Approved</h2>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-600" />
                        <h2 className="text-lg font-semibold text-red-900">Report Rejected</h2>
                      </>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {test.approvedByUser && (
                      <div>
                        <span className="font-medium text-gray-700">By:</span>
                        <span className="ml-2 text-gray-900">
                          {test.approvedByUser.firstName} {test.approvedByUser.lastName}
                        </span>
                      </div>
                    )}
                    {test.approvedAt && (
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(test.approvedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {test.rejectionReason && (
                      <div>
                        <span className="font-medium text-gray-700">Reason:</span>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                          {test.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Report Form */}
              {showReportForm && (
                <form onSubmit={handleSubmitReport} className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Radiology Report</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technique
                      </label>
                      <textarea
                        value={reportData.technique}
                        onChange={(e) => setReportData({ ...reportData, technique: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Describe the imaging technique used..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Findings <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={reportData.findings}
                        onChange={(e) => setReportData({ ...reportData, findings: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={6}
                        placeholder="Detailed findings from the imaging study..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Impression <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={reportData.impression}
                        onChange={(e) => setReportData({ ...reportData, impression: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Summary and interpretation..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recommendations
                      </label>
                      <textarea
                        value={reportData.recommendations}
                        onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Clinical recommendations or follow-up suggestions..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Radiologist Notes
                      </label>
                      <textarea
                        value={reportData.radiologistNotes}
                        onChange={(e) => setReportData({ ...reportData, radiologistNotes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Internal notes (not visible to patient)..."
                      />
                    </div>

                    <div className="border-t pt-6">
                      <label className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={reportData.isCritical}
                          onChange={(e) => setReportData({ ...reportData, isCritical: e.target.checked })}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-5 w-5"
                        />
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          Critical Findings Detected
                        </span>
                      </label>

                      {reportData.isCritical && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Critical Findings Details <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={reportData.criticalFindings}
                            onChange={(e) => setReportData({ ...reportData, criticalFindings: e.target.value })}
                            className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            rows={3}
                            placeholder="Describe critical findings requiring immediate attention..."
                            required={reportData.isCritical}
                          />
                          <p className="text-xs text-red-600 mt-2">
                            Critical findings will trigger immediate notifications to the ordering physician
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            Submit for Approval
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Existing Report View */}
              {!showReportForm && test.findings && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Radiology Report</h2>
                  
                  <div className="space-y-6">
                    {test.technique && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Technique</h3>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{test.technique}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Findings</h3>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{test.findings}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Impression</h3>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{test.impression}</p>
                    </div>

                    {test.recommendations && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{test.recommendations}</p>
                      </div>
                    )}

                    {test.isCritical && test.criticalFindings && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h3 className="text-sm font-semibold text-red-900">Critical Findings</h3>
                        </div>
                        <p className="text-sm text-red-900 whitespace-pre-wrap">{test.criticalFindings}</p>
                      </div>
                    )}

                    {test.radiologistNotes && user?.role !== 'PATIENT' && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Radiologist Notes (Internal)</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{test.radiologistNotes}</p>
                      </div>
                    )}

                    {test.reportedDate && (
                      <div className="text-sm text-gray-500 flex items-center gap-2 pt-4 border-t">
                        <Clock className="h-4 w-4" />
                        Report generated on {new Date(test.reportedDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Report Yet */}
              {!showReportForm && !test.findings && (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Available</h3>
                  <p className="text-gray-600">
                    {canEditReport() 
                      ? 'Click "Enter Report" to begin documenting your findings.'
                      : 'The radiology report is pending.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Printable Report Version */}
          {test.findings && (
            <div className="print-only print-container">
              {/* Hospital Header */}
              <div className="print-header">
                <div className="text-center">
                  <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#1f2937', marginBottom: '2mm' }}>
                    Hospital Medical Center
                  </h1>
                  <p style={{ fontSize: '11pt', color: '#4b5563' }}>
                    Department of Radiology & Imaging
                  </p>
                  <p style={{ fontSize: '10pt', color: '#6b7280' }}>
                    123 Healthcare Ave, Medical District | Phone: (555) 123-4567
                  </p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '5mm' }}>
                  <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#2563eb' }}>
                    RADIOLOGY REPORT
                  </h2>
                </div>
              </div>

              {/* Report Information */}
              <div className="print-section">
                <div className="print-section-title">Report Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3mm' }}>
                  <div className="print-field">
                    <span className="print-field-label">Report Number:</span>
                    <span className="print-field-value">{test.testNumber}</span>
                  </div>
                  <div className="print-field">
                    <span className="print-field-label">Report Date:</span>
                    <span className="print-field-value">
                      {test.reportedDate ? new Date(test.reportedDate).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="print-field">
                    <span className="print-field-label">Status:</span>
                    <span className="print-field-value">{test.status.replace('_', ' ')}</span>
                  </div>
                  <div className="print-field">
                    <span className="print-field-label">Priority:</span>
                    <span className="print-field-value">{test.urgencyLevel}</span>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="print-section">
                <div className="print-section-title">Patient Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3mm' }}>
                  <div className="print-field">
                    <span className="print-field-label">Patient Name:</span>
                    <span className="print-field-value">
                      {test.patient.user.firstName} {test.patient.user.lastName}
                    </span>
                  </div>
                  <div className="print-field">
                    <span className="print-field-label">Patient ID:</span>
                    <span className="print-field-value">{test.patient.patientId}</span>
                  </div>
                  <div className="print-field">
                    <span className="print-field-label">Date of Birth:</span>
                    <span className="print-field-value">
                      {new Date(test.patient.user.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="print-field">
                    <span className="print-field-label">Gender:</span>
                    <span className="print-field-value">{test.patient.user.gender}</span>
                  </div>
                </div>
              </div>

              {/* Examination Details */}
              <div className="print-section">
                <div className="print-section-title">Examination Details</div>
                <div className="print-field">
                  <span className="print-field-label">Examination:</span>
                  <span className="print-field-value">{test.modality} - {test.bodyPart}</span>
                </div>
                {test.studyDescription && (
                  <div className="print-field">
                    <span className="print-field-label">Study Description:</span>
                    <span className="print-field-value">{test.studyDescription}</span>
                  </div>
                )}
                <div className="print-field">
                  <span className="print-field-label">Exam Date:</span>
                  <span className="print-field-value">
                    {test.performedDate ? new Date(test.performedDate).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {test.orderedByUser && (
                  <div className="print-field">
                    <span className="print-field-label">Referring Physician:</span>
                    <span className="print-field-value">
                      Dr. {test.orderedByUser.firstName} {test.orderedByUser.lastName}
                    </span>
                  </div>
                )}
              </div>

              {/* Clinical Indication */}
              <div className="print-section">
                <div className="print-section-title">Clinical Indication</div>
                <div className="print-text-content">{test.clinicalIndication}</div>
              </div>

              {/* Technique */}
              {test.technique && (
                <div className="print-section">
                  <div className="print-section-title">Technique</div>
                  <div className="print-text-content">{test.technique}</div>
                </div>
              )}

              {/* Findings */}
              <div className="print-section">
                <div className="print-section-title">Findings</div>
                <div className="print-text-content">{test.findings}</div>
              </div>

              {/* Critical Findings */}
              {test.isCritical && test.criticalFindings && (
                <div className="print-critical-box">
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#dc2626', marginBottom: '3mm' }}>
                    ⚠ CRITICAL FINDINGS
                  </div>
                  <div className="print-text-content" style={{ color: '#7f1d1d' }}>
                    {test.criticalFindings}
                  </div>
                  <div style={{ fontSize: '9pt', color: '#991b1b', marginTop: '3mm', fontStyle: 'italic' }}>
                    Note: Referring physician has been notified of critical findings.
                  </div>
                </div>
              )}

              {/* Impression */}
              <div className="print-section">
                <div className="print-section-title">Impression</div>
                <div className="print-text-content">{test.impression}</div>
              </div>

              {/* Recommendations */}
              {test.recommendations && (
                <div className="print-section">
                  <div className="print-section-title">Recommendations</div>
                  <div className="print-text-content">{test.recommendations}</div>
                </div>
              )}

              {/* Approval Status */}
              {test.isApproved && test.approvedByUser && (
                <div className="print-section" style={{ marginTop: '10mm' }}>
                  <div style={{ fontSize: '10pt', color: '#059669', fontWeight: 'bold' }}>
                    ✓ Report Approved
                  </div>
                  <div style={{ fontSize: '9pt', color: '#4b5563', marginTop: '2mm' }}>
                    Approved by: Dr. {test.approvedByUser.firstName} {test.approvedByUser.lastName}
                  </div>
                  <div style={{ fontSize: '9pt', color: '#4b5563' }}>
                    Date: {test.approvedAt ? new Date(test.approvedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              )}

              {/* Signature Section */}
              <div className="print-signature-section">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20mm' }}>
                  <div>
                    <div className="print-signature-line">
                      <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>Radiologist Signature</div>
                      <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2mm' }}>
                        {test.reportedDate ? new Date(test.reportedDate).toLocaleDateString() : '_____________'}
                      </div>
                    </div>
                  </div>
                  {test.isApproved && test.approvedByUser && (
                    <div>
                      <div className="print-signature-line">
                        <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>
                          Senior Radiologist Signature
                        </div>
                        <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2mm' }}>
                          Dr. {test.approvedByUser.firstName} {test.approvedByUser.lastName}
                        </div>
                        <div style={{ fontSize: '9pt', color: '#6b7280' }}>
                          {test.approvedAt ? new Date(test.approvedAt).toLocaleDateString() : '_____________'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ 
                marginTop: '15mm', 
                paddingTop: '5mm', 
                borderTop: '1px solid #e5e7eb',
                fontSize: '8pt',
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                <p>This is a computer-generated report. Electronic signature is valid without physical signature.</p>
                <p style={{ marginTop: '1mm' }}>
                  Report generated on {new Date().toLocaleString()} | Page 1 of 1
                </p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
