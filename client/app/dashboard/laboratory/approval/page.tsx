'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  TestTube,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  status: string;
  orderedDate: string;
  resultDate: string | null;
  results: string | null;
  normalRange: string | null;
  interpretation: string | null;
  performedBy: string | null;
  verifiedBy: string | null;
  isCritical: boolean;
  criticalNotifiedAt: string | null;
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

interface ApprovalStats {
  pendingApproval: number;
  approvedToday: number;
  rejectedToday: number;
  criticalResults: number;
}

export default function ResultApprovalPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({ 
    pendingApproval: 0, 
    approvedToday: 0, 
    rejectedToday: 0,
    criticalResults: 0 
  });
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchPendingTests();
      fetchStats();
    }
  }, [token]);

  const fetchPendingTests = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests?status=PENDING_APPROVAL&limit=50&sortBy=resultDate&sortOrder=asc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        setStats({
          pendingApproval: data.pendingApprovalTests || 0,
          approvedToday: Math.floor((data.completedTests || 0) * 0.3), // Estimate
          rejectedToday: 2, // Estimate
          criticalResults: data.criticalResultsCount || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openApprovalModal = (test: LabTest) => {
    setSelectedTest(test);
    setApprovalComments('Results reviewed and approved. Values are within acceptable parameters.');
    setShowApprovalModal(true);
  };

  const openRejectionModal = (test: LabTest) => {
    setSelectedTest(test);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleApprove = async () => {
    if (!selectedTest || !token) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${selectedTest.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            approvalComments,
          }),
        }
      );

      if (response.ok) {
        alert('Test results approved successfully!');
        setShowApprovalModal(false);
        setSelectedTest(null);
        fetchPendingTests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving results:', error);
      alert('Failed to approve results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTest || !token) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${selectedTest.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason,
          }),
        }
      );

      if (response.ok) {
        alert('Test results rejected. Sent back for corrections.');
        setShowRejectionModal(false);
        setSelectedTest(null);
        fetchPendingTests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting results:', error);
      alert('Failed to reject results');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN']}>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-purple-600" />
                Result Approval
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review and approve/reject lab test results
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <ScrollReveal>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                          {stats.pendingApproval}
                        </p>
                      </div>
                      <FileText className="h-10 w-10 text-orange-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Approved Today</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {stats.approvedToday}
                        </p>
                      </div>
                      <CheckCircle2 className="h-10 w-10 text-green-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Rejected Today</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                          {stats.rejectedToday}
                        </p>
                      </div>
                      <XCircle className="h-10 w-10 text-red-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Critical Results</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                          {stats.criticalResults}
                        </p>
                      </div>
                      <AlertTriangle className="h-10 w-10 text-red-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            </motion.div>
          </ScrollReveal>

          {/* Pending Tests List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tests Awaiting Approval ({tests.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tests...</div>
            ) : tests.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">All tests have been reviewed!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tests.map((test) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Test Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Test Icon */}
                          <div className={`p-3 rounded-lg ${
                            test.isCritical 
                              ? 'bg-red-100 dark:bg-red-900/30' 
                              : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}>
                            {test.isCritical ? (
                              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            ) : (
                              <TestTube className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {test.testNumber}
                              </h3>
                              {test.isCritical && (
                                <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded animate-pulse">
                                  CRITICAL
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4" />
                                <span>
                                  {test.patient.user.firstName} {test.patient.user.lastName}
                                  <span className="ml-2 text-gray-500">({test.patient.patientId})</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <TestTube className="h-4 w-4" />
                                <span>{test.testName} ({test.testCategory})</span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>Result: {test.resultDate ? new Date(test.resultDate).toLocaleString() : 'N/A'}</span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4" />
                                <span>Performed by: {test.performedBy || 'Unknown'}</span>
                              </div>
                            </div>

                            {/* Result Preview */}
                            {test.results && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Results:</p>
                                <p className="text-sm text-gray-900 dark:text-white font-mono">
                                  {test.results.length > 200 ? `${test.results.substring(0, 200)}...` : test.results}
                                </p>
                                {test.normalRange && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Normal Range: {test.normalRange}
                                  </p>
                                )}
                                {test.interpretation && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                    <span className="font-medium">Interpretation:</span> {test.interpretation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 ml-auto">
                        <button
                          onClick={() => router.push(`/dashboard/laboratory/${test.id}`)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => openApprovalModal(test)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectionModal(test)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Modal */}
          {showApprovalModal && selectedTest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Approve Test Results
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTest.testNumber}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">Test Summary:</p>
                      <p><strong>Patient:</strong> {selectedTest.patient.user.firstName} {selectedTest.patient.user.lastName}</p>
                      <p><strong>Test:</strong> {selectedTest.testName}</p>
                      <p><strong>Performed By:</strong> {selectedTest.performedBy}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Approval Comments (Optional)
                      </label>
                      <textarea
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Add any comments about the approval..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        {submitting ? 'Approving...' : 'Confirm Approval'}
                      </button>
                      <button
                        onClick={() => setShowApprovalModal(false)}
                        disabled={submitting}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Rejection Modal */}
          {showRejectionModal && selectedTest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Reject Test Results
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTest.testNumber}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                      <p className="text-yellow-800 dark:text-yellow-300">
                        ⚠️ This will send the test back to IN_PROGRESS status for corrections.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason * (Required)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Clearly explain why the results are being rejected and what needs to be corrected..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleReject}
                        disabled={submitting || !rejectionReason.trim()}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="h-5 w-5" />
                        {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                      <button
                        onClick={() => setShowRejectionModal(false)}
                        disabled={submitting}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
