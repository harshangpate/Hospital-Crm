'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  MapPin,
  Wind,
  Video,
  Package,
  Stethoscope,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

interface Surgery {
  id: string;
  surgeryNumber: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  primarySurgeon: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  surgeryType: string;
  surgeryName: string;
  status: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  estimatedDuration: number;
}

interface Equipment {
  id: string;
  name: string;
  equipmentCode: string;
  type: string;
  status: string;
  manufacturer?: string;
  model?: string;
  lastCalibration?: string;
  nextCalibration?: string;
  maintenanceDue?: string;
}

interface OperationTheater {
  id: string;
  name: string;
  otNumber: string;
  type: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'CLEANING' | 'RESERVED';
  floor?: number;
  building?: string;
  capacity?: number;
  hasLaminairFlow: boolean;
  hasVideoSystem: boolean;
  isActive: boolean;
  surgeries: Surgery[];
  equipmentList: Equipment[];
}

export default function OperationTheaterDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR']}>
      <OTDetails />
    </ProtectedRoute>
  );
}

function OTDetails() {
  const params = useParams();
  const router = useRouter();
  const [ot, setOT] = useState<OperationTheater | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'surgeries' | 'equipment'>('surgeries');

  useEffect(() => {
    if (params.id) {
      fetchOTDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchOTDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/operation-theaters/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setOT(result.data);
      } else {
        console.error('Failed to fetch OT details');
      }
    } catch (error) {
      console.error('Error fetching OT details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceClick = async (equipmentId: string) => {
    const maintenanceType = prompt('Enter maintenance type (Calibration/Repair/Inspection):', 'Calibration');
    if (!maintenanceType) return;

    const technician = prompt('Enter technician name:', 'Maintenance Team');
    if (!technician) return;

    try {
      const token = localStorage.getItem('token');
      const nextMaintenanceDate = new Date();
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90); // 90 days later

      const response = await fetch(
        `http://localhost:5000/api/v1/equipment/${equipmentId}/maintenance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            maintenanceType,
            performedBy: technician,
            nextMaintenanceAt: nextMaintenanceDate.toISOString(),
          }),
        }
      );

      if (response.ok) {
        alert('Maintenance scheduled successfully!');
        fetchOTDetails(); // Refresh data
      } else {
        const result = await response.json();
        alert(`Failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Failed to schedule maintenance');
    }
  };

  const handleEditEquipment = (equipmentId: string) => {
    router.push(`/dashboard/operation-theaters/equipment?edit=${equipmentId}`);
  };

  const handleDeleteEquipment = async (equipmentId: string, equipmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/equipment/${equipmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Equipment deleted successfully');
        fetchOTDetails(); // Refresh data
      } else {
        const result = await response.json();
        alert(`Failed to delete: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Failed to delete equipment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'OCCUPIED':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'RESERVED':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'CLEANING':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'UNDER_MAINTENANCE':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSurgeryStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-green-600';
      case 'IN_USE':
        return 'text-yellow-600';
      case 'UNDER_MAINTENANCE':
        return 'text-orange-600';
      case 'OUT_OF_SERVICE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading operation theater details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ot) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Operation Theater Not Found</h2>
          <p className="text-gray-600 mb-6">The operation theater you are looking for does not exist.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const todaysSurgeries = ot.surgeries.filter(s => {
    const surgeryDate = new Date(s.scheduledDate);
    const today = new Date();
    return surgeryDate.toDateString() === today.toDateString();
  });

  const upcomingSurgeries = ot.surgeries.filter(s => 
    s.status === 'SCHEDULED' && new Date(s.scheduledDate) >= new Date()
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Operation Theaters
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-8 h-8 text-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{ot.name}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(ot.status)}`}>
                    {ot.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mt-2">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>OT {ot.otNumber}</span>
                  </div>
                  {ot.building && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{ot.building} • Floor {ot.floor}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>{ot.type}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/operation-theaters/${ot.id}/edit`)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Edit OT"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Wind className={`w-5 h-5 ${ot.hasLaminairFlow ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {ot.hasLaminairFlow ? 'Laminar Flow' : 'No Laminar Flow'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Video className={`w-5 h-5 ${ot.hasVideoSystem ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {ot.hasVideoSystem ? 'Video System' : 'No Video System'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Capacity: {ot.capacity || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <CheckCircle2 className={`w-5 h-5 ${ot.isActive ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {ot.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Surgeries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {ot.surgeries.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Surgeries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {todaysSurgeries.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {upcomingSurgeries.length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {ot.equipmentList.length}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('surgeries')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'surgeries'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Surgeries ({ot.surgeries.length})
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'equipment'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Equipment ({ot.equipmentList.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'surgeries' ? (
              ot.surgeries.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No surgeries scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ot.surgeries.map((surgery) => (
                    <div
                      key={surgery.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {surgery.surgeryType}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSurgeryStatusColor(surgery.status)}`}>
                              {surgery.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>Patient: {surgery.patient?.user?.firstName || 'N/A'} {surgery.patient?.user?.lastName || ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4" />
                              <span>Surgeon: Dr. {surgery.primarySurgeon?.user?.firstName || 'N/A'} {surgery.primarySurgeon?.user?.lastName || ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(surgery.scheduledDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(surgery.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {surgery.scheduledEndTime && `- ${new Date(surgery.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/surgery/${surgery.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              ot.equipmentList.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No equipment assigned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ot.equipmentList.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {equipment.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getEquipmentStatusColor(equipment.status)}`}>
                          {equipment.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <p>Code: {equipment.equipmentCode}</p>
                        <p>Type: {equipment.type}</p>
                        {equipment.manufacturer && <p>Manufacturer: {equipment.manufacturer}</p>}
                        {equipment.model && <p>Model: {equipment.model}</p>}
                      </div>
                      {equipment.lastCalibration && (
                        <p className="text-xs text-gray-500 mb-3">
                          Last Calibration: {new Date(equipment.lastCalibration).toLocaleDateString()}
                        </p>
                      )}
                      {equipment.nextCalibration && (
                        <p className="text-xs text-gray-500 mb-3">
                          Next Calibration: {new Date(equipment.nextCalibration).toLocaleDateString()}
                        </p>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleMaintenanceClick(equipment.id)}
                          className="flex-1 px-3 py-2 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center justify-center gap-1"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="w-3 h-3" />
                          Maintenance
                        </button>
                        <button
                          onClick={() => handleEditEquipment(equipment.id)}
                          className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Edit Equipment"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(equipment.id, equipment.name)}
                          className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
