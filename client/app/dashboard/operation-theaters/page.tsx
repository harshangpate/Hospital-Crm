'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
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
  Settings,
  X
} from 'lucide-react';
import { getOTDashboardStats, getAllOperationTheaters, updateOTStatus, createOperationTheater } from '@/lib/api/surgery';
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
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleStatusChange = async (otId: number, newStatus: string) => {
    try {
      await updateOTStatus(otId.toString(), newStatus);
      fetchData(); // Refresh data
      alert(`OT status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating OT status:', error);
      alert('Failed to update OT status');
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading Operation Theaters...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5" />
            Add OT
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = '/dashboard/surgery/schedule'}
          >
            <Plus className="w-5 h-5" />
            Schedule Surgery
          </motion.button>
        </div>
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
                    <select
                      value={ot.status}
                      onChange={(e) => handleStatusChange(ot.id, e.target.value)}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-none cursor-pointer text-sm"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="CLEANING">Cleaning</option>
                      <option value="UNDER_MAINTENANCE">Maintenance</option>
                    </select>
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

      {/* Create OT Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Operation Theater</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const otData = {
                  name: formData.get('name') as string,
                  otNumber: formData.get('otNumber') as string,
                  type: formData.get('type') as string,
                  floor: parseInt(formData.get('floor') as string),
                  building: formData.get('building') as string || undefined,
                  hasLaminairFlow: formData.get('hasLaminairFlow') === 'on',
                  hasVideoSystem: formData.get('hasVideoSystem') === 'on',
                  capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string) : 1,
                  equipment: formData.get('equipment') ? (formData.get('equipment') as string).split(',').map(s => s.trim()) : [],
                };

                await createOperationTheater(otData);
                setShowCreateModal(false);
                fetchData();
                alert('Operation Theater added successfully!');
              } catch (error) {
                console.error('Error creating OT:', error);
                alert('Failed to create Operation Theater. Please try again.');
              }
            }} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OT Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    OT Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Main OT 1"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* OT Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    OT Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="otNumber"
                    required
                    placeholder="e.g., OT-5"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Type</option>
                    <option value="GENERAL">General</option>
                    <option value="CARDIAC">Cardiac</option>
                    <option value="ORTHOPEDIC">Orthopedic</option>
                    <option value="NEUROSURGERY">Neurosurgery</option>
                    <option value="GYNECOLOGY">Gynecology</option>
                    <option value="PEDIATRIC">Pediatric</option>
                    <option value="TRAUMA">Trauma</option>
                    <option value="OPHTHALMIC">Ophthalmic</option>
                    <option value="ENT">ENT</option>
                    <option value="ENDOSCOPY">Endoscopy</option>
                  </select>
                </div>

                {/* Floor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Floor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="floor"
                    required
                    min="0"
                    placeholder="e.g., 2"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Building */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Building
                  </label>
                  <input
                    type="text"
                    name="building"
                    placeholder="e.g., Main Block"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Capacity (people)
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    placeholder="e.g., 8"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Equipment List */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Equipment List (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="equipment"
                    placeholder="e.g., Anesthesia Machine, Ventilator, Monitor"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasLaminairFlow"
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Has Laminar Flow System
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasVideoSystem"
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Has Video Recording System
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  Add Operation Theater
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
