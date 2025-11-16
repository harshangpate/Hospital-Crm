'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Settings,
  Trash2,
  Edit,
} from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';

interface Equipment {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  location: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  calibrationDate?: string;
  usageCount: number;
  cost: number;
}

interface OperationTheater {
  id: string;
  name: string;
  otNumber: string;
}

export default function EquipmentManagementPage() {
  const searchParams = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [operationTheaters, setOperationTheaters] = useState<OperationTheater[]>([]);

  useEffect(() => {
    fetchEquipment();
    fetchOperationTheaters();
  }, []);

  // Handle edit query parameter
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && equipment.length > 0) {
      const equipmentToEdit = equipment.find(e => e.id === editId);
      if (equipmentToEdit) {
        setEditingEquipment(equipmentToEdit);
        setShowEditModal(true);
      }
    }
  }, [searchParams, equipment]);

  const fetchOperationTheaters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/operation-theaters', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setOperationTheaters(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching operation theaters:', error);
    }
  };

  const handleScheduleMaintenance = async (equipmentId: string) => {
    const maintenanceType = prompt('Enter maintenance type (e.g., Calibration, Repair, Inspection):');
    if (!maintenanceType) return;
    
    const performedBy = prompt('Enter technician name:');
    if (!performedBy) return;
    
    if (!confirm('Schedule maintenance for this equipment?')) return;
    
    try {
      const { scheduleMaintenance } = await import('@/lib/api/equipment');
      await scheduleMaintenance(equipmentId, {
        maintenanceType,
        performedBy,
        description: 'Scheduled maintenance',
        performedAt: new Date().toISOString(),
        nextMaintenanceAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      });
      
      alert('Maintenance scheduled successfully!');
      fetchEquipment(); // Refresh list
    } catch (error: any) {
      console.error('Error scheduling maintenance:', error);
      alert(`Failed to schedule maintenance: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (equipmentId: string) => {
    const equipmentToEdit = equipment.find(e => e.id === equipmentId);
    if (equipmentToEdit) {
      setEditingEquipment(equipmentToEdit);
      setShowEditModal(true);
    }
  };

  const handleDelete = async (equipmentId: string, equipmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { deleteEquipment } = await import('@/lib/api/equipment');
      await deleteEquipment(equipmentId);
      alert('Equipment deleted successfully!');
      fetchEquipment(); // Refresh list
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      alert(`Failed to delete equipment: ${error?.response?.data?.message || error.message}`);
    }
  };

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const { getAllEquipment } = await import('@/lib/api/equipment');
      const response = await getAllEquipment({ limit: 100 });
      
      // Transform API data to match component interface
      const transformedData = response.data.equipment.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        manufacturer: item.manufacturer || '',
        model: item.model || '',
        serialNumber: item.equipmentCode,
        status: item.status,
        location: item.location || (item.operationTheater?.name || 'Unassigned'),
        purchaseDate: item.purchaseDate || new Date().toISOString(),
        warrantyExpiry: item.warrantyExpiry,
        lastMaintenanceDate: item.maintenanceLogs?.[0]?.performedAt,
        nextMaintenanceDate: item.maintenanceDue || item.maintenanceLogs?.[0]?.nextMaintenanceAt,
        calibrationDate: item.lastCalibration,
        usageCount: item.usageCount || 0,
        cost: 0, // Not stored in database
      }));
      
      setEquipment(transformedData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      IN_USE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      OUT_OF_SERVICE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="w-4 h-4" />;
      case 'IN_USE':
        return <Clock className="w-4 h-4" />;
      case 'UNDER_MAINTENANCE':
        return <Wrench className="w-4 h-4" />;
      case 'OUT_OF_SERVICE':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const isMaintenanceDue = (nextMaintenanceDate?: string) => {
    if (!nextMaintenanceDate) return false;
    const daysUntil = Math.floor(
      (new Date(nextMaintenanceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30;
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: equipment.length,
    available: equipment.filter((e) => e.status === 'AVAILABLE').length,
    inUse: equipment.filter((e) => e.status === 'IN_USE').length,
    maintenance: equipment.filter((e) => e.status === 'UNDER_MAINTENANCE').length,
    maintenanceDue: equipment.filter((e) => isMaintenanceDue(e.nextMaintenanceDate)).length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading equipment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wrench className="w-8 h-8 text-blue-600" />
            Equipment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and maintain surgical equipment inventory
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Equipment
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <ScrollReveal variant="fadeInUp">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Equipment',
              value: stats.total,
              icon: Package,
              color: 'bg-blue-500',
            },
            {
              label: 'Available',
              value: stats.available,
              icon: CheckCircle,
              color: 'bg-green-500',
            },
            {
              label: 'In Use',
              value: stats.inUse,
              icon: Clock,
              color: 'bg-purple-500',
            },
            {
              label: 'Under Maintenance',
              value: stats.maintenance,
              icon: Wrench,
              color: 'bg-yellow-500',
            },
            {
              label: 'Maintenance Due',
              value: stats.maintenanceDue,
              icon: AlertTriangle,
              color: 'bg-red-500',
            },
          ].map((stat, index) => (
            <Card3D key={stat.label} intensity={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </Card3D>
          ))}
        </div>
      </ScrollReveal>

      {/* Search & Filters */}
      <ScrollReveal variant="fadeInUp" delay={0.2}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, serial number, or type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Equipment Grid/List */}
      <ScrollReveal variant="fadeInUp" delay={0.3}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item, index) => (
              <Card3D key={item.id} intensity={8}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.type}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {getStatusIcon(item.status)}
                      {item.status.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Serial Number:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.serialNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.location}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Manufacturer:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.manufacturer}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Usage Count:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.usageCount}
                      </span>
                    </div>
                  </div>

                  {/* Maintenance Alert */}
                  {isMaintenanceDue(item.nextMaintenanceDate) && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                          Maintenance Due
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          {new Date(item.nextMaintenanceDate!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleScheduleMaintenance(item.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Maintenance</span>
                    </button>
                    <button 
                      onClick={() => handleEdit(item.id)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Edit Equipment"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete Equipment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </Card3D>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Next Maintenance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.serialNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusIcon(item.status)}
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.usageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.nextMaintenanceDate ? (
                        <div className={isMaintenanceDue(item.nextMaintenanceDate) ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-gray-900 dark:text-white'}>
                          {new Date(item.nextMaintenanceDate).toLocaleDateString()}
                          {isMaintenanceDue(item.nextMaintenanceDate) && (
                            <span className="ml-2">⚠️</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleScheduleMaintenance(item.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Schedule Maintenance"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(item.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit Equipment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollReveal>

      {/* Empty State */}
      {filteredEquipment.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No equipment found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first piece of equipment to get started'}
          </p>
        </motion.div>
      )}

      {/* Add Equipment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Add New Equipment
                </h2>
              </div>
              
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                try {
                  const { createEquipment } = await import('@/lib/api/equipment');
                  await createEquipment({
                    name: formData.get('name') as string,
                    type: formData.get('type') as string,
                    manufacturer: formData.get('manufacturer') as string,
                    model: formData.get('model') as string,
                    serialNumber: formData.get('serialNumber') as string,
                    operationTheaterId: formData.get('operationTheaterId') as string || undefined,
                    purchaseDate: formData.get('purchaseDate') as string,
                    warrantyExpiry: formData.get('warrantyExpiry') as string || undefined,
                    status: formData.get('status') as any,
                  });
                  
                  alert('Equipment added successfully!');
                  setShowAddModal(false);
                  fetchEquipment(); // Refresh list
                } catch (error: any) {
                  console.error('Error adding equipment:', error);
                  alert(`Failed to add equipment: ${error?.response?.data?.message || error.message}`);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter equipment name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Anesthesia">Anesthesia</option>
                      <option value="Surgical">Surgical</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter manufacturer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      name="model"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      name="serialNumber"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Operation Theater
                    </label>
                    <select
                      name="operationTheaterId"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Unassigned)</option>
                      {operationTheaters.map((ot) => (
                        <option key={ot.id} value={ot.id}>
                          {ot.name} ({ot.otNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost *
                    </label>
                    <input
                      type="number"
                      name="cost"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter cost"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      name="warrantyExpiry"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_USE">In Use</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Equipment
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Equipment Modal */}
      <AnimatePresence>
        {showEditModal && editingEquipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Equipment
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                try {
                  const { updateEquipment } = await import('@/lib/api/equipment');
                  await updateEquipment(editingEquipment.id, {
                    name: formData.get('name') as string,
                    type: formData.get('type') as string,
                    manufacturer: formData.get('manufacturer') as string,
                    model: formData.get('model') as string,
                    serialNumber: formData.get('serialNumber') as string,
                    operationTheaterId: formData.get('operationTheaterId') as string || undefined,
                    purchaseDate: formData.get('purchaseDate') as string,
                    warrantyExpiry: formData.get('warrantyExpiry') as string || undefined,
                    status: formData.get('status') as any,
                  });
                  
                  alert('Equipment updated successfully!');
                  setShowEditModal(false);
                  setEditingEquipment(null);
                  fetchEquipment(); // Refresh list
                } catch (error: any) {
                  console.error('Error updating equipment:', error);
                  alert(`Failed to update equipment: ${error?.response?.data?.message || error.message}`);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingEquipment.name}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter equipment name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      required
                      defaultValue={editingEquipment.type}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Anesthesia">Anesthesia</option>
                      <option value="Surgical">Surgical</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Imaging">Imaging</option>
                      <option value="Sterilization">Sterilization</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      required
                      defaultValue={editingEquipment.manufacturer}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter manufacturer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      name="model"
                      required
                      defaultValue={editingEquipment.model}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      name="serialNumber"
                      required
                      defaultValue={editingEquipment.serialNumber}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Operation Theater
                    </label>
                    <select
                      name="operationTheaterId"
                      defaultValue={editingEquipment.location || ''}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Unassigned)</option>
                      {operationTheaters.map((ot) => (
                        <option key={ot.id} value={ot.id}>
                          {ot.name} ({ot.otNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      required
                      defaultValue={editingEquipment.purchaseDate ? new Date(editingEquipment.purchaseDate).toISOString().split('T')[0] : ''}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      name="warrantyExpiry"
                      defaultValue={editingEquipment.warrantyExpiry ? new Date(editingEquipment.warrantyExpiry).toISOString().split('T')[0] : ''}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      required
                      defaultValue={editingEquipment.status}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_USE">In Use</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEquipment(null);
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Update Equipment
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </DashboardLayout>
  );
}
