'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Activity,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  getSurgeryById, 
  updateSurgeryStatus,
  getPreOpChecklist,
  getIntraOpRecord,
  getPostOpRecord
} from '@/lib/api/surgery';
import ScrollReveal from '@/components/ui/ScrollReveal';
import PreOpChecklistComponent from '@/components/surgery/PreOpChecklist';
import IntraOpRecordComponent from '@/components/surgery/IntraOpRecord';
import PostOpRecordComponent from '@/components/surgery/PostOpRecord';
import SurgeryBillingComponent from '@/components/surgery/SurgeryBilling';

export default function SurgeryDetailsPage() {
  const params = useParams();
  const surgeryId = params?.id as string;
  
  const [surgery, setSurgery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'pre-op' | 'intra-op' | 'post-op' | 'billing'>('details');

  useEffect(() => {
    if (surgeryId) {
      fetchSurgeryDetails();
    }
  }, [surgeryId]);

  const fetchSurgeryDetails = async () => {
    try {
      setLoading(true);
      const response = await getSurgeryById(surgeryId);
      setSurgery(response.data);
    } catch (error) {
      console.error('Error fetching surgery details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      PRE_OP: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      POST_OP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      POSTPONED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-500 text-white',
      HIGH: 'bg-orange-500 text-white',
      MEDIUM: 'bg-yellow-500 text-white',
      LOW: 'bg-green-500 text-white',
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading surgery details...</p>
        </div>
      </div>
    );
  }

  if (!surgery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Surgery Not Found
          </h2>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {surgery.surgeryName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Surgery #{surgery.surgeryNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(surgery.status)}`}>
            {surgery.status.replace('_', ' ')}
          </span>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPriorityColor(surgery.priority)}`}>
            {surgery.priority} PRIORITY
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <ScrollReveal variant="fadeInUp">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'pre-op', label: 'Pre-Operative', icon: CheckCircle },
              { id: 'intra-op', label: 'Intra-Operative', icon: Activity },
              { id: 'post-op', label: 'Post-Operative', icon: User },
              { id: 'billing', label: 'Billing', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Patient Name</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.patient.user.firstName} {surgery.patient.user.lastName}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Patient ID</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.patient.patientId}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Blood Group</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.patient.bloodGroup || 'Not specified'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.patient.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Surgery Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Surgery Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Surgery Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.surgeryType}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled Date</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {new Date(surgery.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {new Date(surgery.scheduledStartTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.estimatedDuration} minutes
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Operation Theater</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.operationTheater.name}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Anesthesia Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {surgery.anesthesiaType || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Surgical Team */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Surgical Team
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Primary Surgeon</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        Dr. {surgery.primarySurgeon.user.firstName} {surgery.primarySurgeon.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {surgery.primarySurgeon.specialization}
                      </p>
                    </div>
                    {surgery.surgicalTeam && surgery.surgicalTeam.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {surgery.surgicalTeam.map((member: any) => (
                          <div key={member.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.role.replace('_', ' ')}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                              {member.name}
                            </p>
                            {member.specialization && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {member.specialization}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {(surgery.diagnosis || surgery.description || surgery.specialInstructions) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Additional Information
                    </h3>
                    <div className="space-y-4">
                      {surgery.diagnosis && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Diagnosis</p>
                          <p className="text-gray-900 dark:text-white">{surgery.diagnosis}</p>
                        </div>
                      )}
                      {surgery.description && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                          <p className="text-gray-900 dark:text-white">{surgery.description}</p>
                        </div>
                      )}
                      {surgery.specialInstructions && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                            Special Instructions
                          </p>
                          <p className="text-gray-900 dark:text-white">{surgery.specialInstructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pre-op' && (
              <PreOpChecklistComponent surgeryId={surgeryId} />
            )}

            {activeTab === 'intra-op' && (
              <IntraOpRecordComponent surgeryId={surgeryId} />
            )}

            {activeTab === 'post-op' && (
              <PostOpRecordComponent surgeryId={surgeryId} />
            )}

            {activeTab === 'billing' && (
              <SurgeryBillingComponent surgeryId={surgeryId} surgeryDetails={surgery} />
            )}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
