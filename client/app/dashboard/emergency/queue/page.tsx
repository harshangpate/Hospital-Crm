'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Clock,
  AlertTriangle,
  User,
  Stethoscope,
  Bed,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getEmergencyQueue } from '@/lib/api/emergency';

const TRIAGE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  LEVEL_1_RESUSCITATION: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    label: 'Level 1',
  },
  LEVEL_2_EMERGENT: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500',
    label: 'Level 2',
  },
  LEVEL_3_URGENT: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-500',
    label: 'Level 3',
  },
  LEVEL_4_LESS_URGENT: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-500',
    label: 'Level 4',
  },
  LEVEL_5_NON_URGENT: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500',
    label: 'Level 5',
  },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  REGISTERED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
  WAITING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  IN_TREATMENT: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  UNDER_OBSERVATION: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  AWAITING_RESULTS: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
  READY_FOR_DISPOSITION: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
};

export default function EmergencyQueuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    triageLevel: '',
    searchQuery: '',
  });

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.triageLevel) params.triageLevel = filters.triageLevel;

      const response = await getEmergencyQueue(params);
      let data = response.data.data || [];

      // Client-side search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        data = data.filter((visit: any) => {
          const patientName = `${visit.patient?.user?.firstName} ${visit.patient?.user?.lastName}`.toLowerCase();
          const visitNumber = visit.visitNumber.toLowerCase();
          return patientName.includes(query) || visitNumber.includes(query);
        });
      }

      setQueue(data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleVisitClick = (visitId: string) => {
    router.push(`/dashboard/emergency/assess/${visitId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-red-600" />
              Emergency Queue
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time patient queue • {queue.length} patients waiting
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search by name or visit number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="WAITING">Waiting</option>
              <option value="IN_TREATMENT">In Treatment</option>
              <option value="UNDER_OBSERVATION">Under Observation</option>
              <option value="AWAITING_RESULTS">Awaiting Results</option>
              <option value="READY_FOR_DISPOSITION">Ready for Disposition</option>
            </select>

            <select
              value={filters.triageLevel}
              onChange={(e) => setFilters((prev) => ({ ...prev, triageLevel: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Triage Levels</option>
              <option value="LEVEL_1_RESUSCITATION">Level 1 - Resuscitation</option>
              <option value="LEVEL_2_EMERGENT">Level 2 - Emergent</option>
              <option value="LEVEL_3_URGENT">Level 3 - Urgent</option>
              <option value="LEVEL_4_LESS_URGENT">Level 4 - Less Urgent</option>
              <option value="LEVEL_5_NON_URGENT">Level 5 - Non-Urgent</option>
            </select>
          </div>
        </motion.div>

        {/* Queue List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading queue...</p>
            </div>
          </div>
        ) : queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center"
          >
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Patients in Queue
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The emergency queue is currently empty
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {queue.map((visit, index) => {
              const triageColor = visit.triageLevel ? TRIAGE_COLORS[visit.triageLevel] : null;
              const statusColor = STATUS_COLORS[visit.status] || STATUS_COLORS.WAITING;

              return (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleVisitClick(visit.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-l-4 ${
                    triageColor?.border || 'border-gray-300'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {visit.patient?.user?.firstName} {visit.patient?.user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {visit.visitNumber} • {visit.patient?.user?.gender} •{' '}
                        {visit.patient?.user?.phone}
                      </p>
                    </div>
                    {triageColor && (
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${triageColor.bg} ${triageColor.text}`}
                      >
                        {triageColor.label}
                      </div>
                    )}
                  </div>

                  {/* Chief Complaint */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Chief Complaint:
                    </p>
                    <p className="text-gray-900 dark:text-white">{visit.chiefComplaint}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Clock className="w-4 h-4" />
                        Waiting Time
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatWaitingTime(visit.totalWaitingMinutes || 0)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Activity className="w-4 h-4" />
                        Mode of Arrival
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {visit.modeOfArrival.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Status & Assignment */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
                    >
                      {visit.status.replace(/_/g, ' ')}
                    </div>
                    {visit.assignedDoctor ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Stethoscope className="w-4 h-4" />
                        Dr. {visit.assignedDoctor.user?.firstName} {visit.assignedDoctor.user?.lastName}
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600 dark:text-orange-400">
                        No doctor assigned
                      </div>
                    )}
                  </div>

                  {visit.bed && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Bed className="w-4 h-4" />
                      Bed: {visit.bed.bedNumber}
                    </div>
                  )}

                  {/* Warning for long wait */}
                  {visit.totalWaitingMinutes > 120 && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm text-orange-700 dark:text-orange-400">
                        Long waiting time - Priority attention needed
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
