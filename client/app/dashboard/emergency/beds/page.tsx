'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Bed,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  User,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface EmergencyBed {
  id: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  location: string;
  equipment?: string[];
  currentPatient?: {
    name: string;
    triageLevel: string;
    admittedAt: string;
  };
}

export default function EmergencyBedsPage() {
  const router = useRouter();
  const [beds, setBeds] = useState<EmergencyBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchBeds();
  }, []);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // Mock data for now
      const mockBeds: EmergencyBed[] = [
        {
          id: '1',
          bedNumber: 'ER-01',
          status: 'OCCUPIED',
          location: 'Emergency Room A',
          equipment: ['Monitor', 'Ventilator', 'IV Stand'],
          currentPatient: {
            name: 'John Doe',
            triageLevel: 'LEVEL_1_RESUSCITATION',
            admittedAt: new Date().toISOString(),
          },
        },
        {
          id: '2',
          bedNumber: 'ER-02',
          status: 'AVAILABLE',
          location: 'Emergency Room A',
          equipment: ['Monitor', 'IV Stand'],
        },
        {
          id: '3',
          bedNumber: 'ER-03',
          status: 'RESERVED',
          location: 'Emergency Room B',
          equipment: ['Monitor', 'Ventilator', 'IV Stand', 'Defibrillator'],
        },
        {
          id: '4',
          bedNumber: 'ER-04',
          status: 'AVAILABLE',
          location: 'Emergency Room B',
          equipment: ['Monitor', 'IV Stand'],
        },
        {
          id: '5',
          bedNumber: 'ER-05',
          status: 'OCCUPIED',
          location: 'Trauma Bay',
          equipment: ['Monitor', 'Ventilator', 'IV Stand', 'Defibrillator', 'Infusion Pump'],
          currentPatient: {
            name: 'Jane Smith',
            triageLevel: 'LEVEL_2_EMERGENT',
            admittedAt: new Date(Date.now() - 3600000).toISOString(),
          },
        },
        {
          id: '6',
          bedNumber: 'ER-06',
          status: 'MAINTENANCE',
          location: 'Trauma Bay',
          equipment: ['Monitor'],
        },
      ];
      setBeds(mockBeds);
    } catch (error) {
      console.error('Error fetching beds:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'OCCUPIED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'MAINTENANCE':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="w-5 h-5" />;
      case 'OCCUPIED':
        return <User className="w-5 h-5" />;
      case 'RESERVED':
        return <Clock className="w-5 h-5" />;
      case 'MAINTENANCE':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case 'LEVEL_1_RESUSCITATION':
        return 'bg-red-500 text-white';
      case 'LEVEL_2_EMERGENT':
        return 'bg-orange-500 text-white';
      case 'LEVEL_3_URGENT':
        return 'bg-yellow-500 text-white';
      case 'LEVEL_4_LESS_URGENT':
        return 'bg-green-500 text-white';
      case 'LEVEL_5_NON_URGENT':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const filteredBeds = filter === 'ALL' ? beds : beds.filter(bed => bed.status === filter);

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'AVAILABLE').length,
    occupied: beds.filter(b => b.status === 'OCCUPIED').length,
    reserved: beds.filter(b => b.status === 'RESERVED').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading emergency beds...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Bed className="w-8 h-8 text-red-600" />
                Emergency Bed Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time emergency bed status and availability
              </p>
            </div>
          </div>
          <button
            onClick={fetchBeds}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Beds</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Bed className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.available}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Occupied</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.occupied}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <User className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reserved</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.reserved}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-2">
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Beds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBeds.map((bed, index) => (
            <motion.div
              key={bed.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700"
            >
              {/* Bed Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Bed className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{bed.bedNumber}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{bed.location}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${getStatusColor(bed.status)}`}>
                  {getStatusIcon(bed.status)}
                  {bed.status}
                </div>
              </div>

              {/* Current Patient (if occupied) */}
              {bed.currentPatient && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Patient</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTriageColor(bed.currentPatient.triageLevel)}`}>
                      {bed.currentPatient.triageLevel.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{bed.currentPatient.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Admitted: {new Date(bed.currentPatient.admittedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Equipment */}
              {bed.equipment && bed.equipment.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-2">
                    {bed.equipment.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredBeds.length === 0 && (
          <div className="text-center py-12">
            <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No beds found with the selected filter</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
