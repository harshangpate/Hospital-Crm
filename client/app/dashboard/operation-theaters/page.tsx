'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Plus,
  Eye,
  Settings
} from 'lucide-react';
import { getOTDashboardStats, getAllOperationTheaters } from '@/lib/api/surgery';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';

interface OTStats {
  totalOTs: number;
  availableOTs: number;
  occupiedOTs: number;
  underMaintenance: number;
  todaysSurgeries: number;
  inProgressSurgeries: number;
  completedToday: number;
  upcomingSurgeries: number;
  utilizationRate: string;
}

interface OperationTheater {
  id: string;
  name: string;
  otNumber: string;
  type: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'CLEANING' | 'RESERVED';
  floor?: number;
  building?: string;
  isActive: boolean;
  hasLaminairFlow: boolean;
  hasVideoSystem: boolean;
  _count?: {
    surgeries: number;
    equipmentList: number;
  };
}

export default function OTDashboardPage() {
  const [stats, setStats] = useState<OTStats | null>(null);
  const [theaters, setTheaters] = useState<OperationTheater[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, theatersData] = await Promise.all([
        getOTDashboardStats(),
        getAllOperationTheaters(),
      ]);
      
      setStats(statsData.data);
      setTheaters(theatersData.data);
    } catch (error) {
      console.error('Error fetching OT data:', error);
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
      case 'CLEANING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'UNDER_MAINTENANCE':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTheaters = filter === 'all' 
    ? theaters 
    : theaters.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Operation Theaters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Operation Theaters
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring and management
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => window.location.href = '/dashboard/surgery/schedule'}
        >
          <Plus className="w-5 h-5" />
          Schedule Surgery
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <ScrollReveal variant="fadeInUp">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          {stats && (
            <>
              <motion.div variants={staggerItem}>
                <Card3D intensity={5}>
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total OTs</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                          {stats.totalOTs}
                        </h3>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {stats.availableOTs} Available
                      </span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {stats.occupiedOTs} Occupied
                      </span>
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D intensity={5}>
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Today's Surgeries</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                          {stats.todaysSurgeries}
                        </h3>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.completedToday} Completed
                      </span>
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D intensity={5}>
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                          {stats.inProgressSurgeries}
                        </h3>
                      </div>
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Activity className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-1" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Live surgeries
                      </span>
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D intensity={5}>
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Utilization Rate</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                          {stats.utilizationRate}%
                        </h3>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.utilizationRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            </>
          )}
        </motion.div>
      </ScrollReveal>

      {/* Filter Buttons */}
      <ScrollReveal variant="fadeInUp" delay={0.2}>
        <div className="flex flex-wrap gap-2">
          {['all', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'UNDER_MAINTENANCE'].map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-600'
              }`}
            >
              {status === 'all' ? 'All OTs' : status.replace('_', ' ')}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                  {theaters.filter(t => t.status === status).length}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </ScrollReveal>

      {/* OT Grid */}
      <ScrollReveal variant="fadeInUp" delay={0.3}>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
        >
          {filteredTheaters.map((ot) => (
            <motion.div key={ot.id} variants={staggerItem}>
              <Card3D intensity={8}>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {ot.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ot.otNumber} • {ot.type}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ot.status)}`}>
                      {ot.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {ot.floor && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4 mr-2" />
                        Floor {ot.floor}{ot.building && `, ${ot.building}`}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {ot.hasLaminairFlow && (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Laminar Flow
                        </span>
                      )}
                      {ot.hasVideoSystem && (
                        <span className="flex items-center text-blue-600 dark:text-blue-400">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Video System
                        </span>
                      )}
                    </div>
                    {ot._count && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{ot._count.surgeries} surgeries scheduled</span>
                        <span>•</span>
                        <span>{ot._count.equipmentList} equipment items</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => window.location.href = `/dashboard/operation-theaters/${ot.id}`}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Status Indicator */}
                  {ot.status === 'OCCUPIED' && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Surgery in progress
                    </div>
                  )}
                  {ot.status === 'UNDER_MAINTENANCE' && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg flex items-center text-sm text-gray-700 dark:text-gray-400">
                      <Wrench className="w-4 h-4 mr-2" />
                      Under maintenance
                    </div>
                  )}
                </div>
              </Card3D>
            </motion.div>
          ))}
        </motion.div>
      </ScrollReveal>

      {filteredTheaters.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Operation Theaters Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' 
              ? 'No operation theaters are currently registered.' 
              : `No operation theaters with status "${filter.replace('_', ' ')}"`}
          </p>
        </div>
      )}
    </div>
  );
}
