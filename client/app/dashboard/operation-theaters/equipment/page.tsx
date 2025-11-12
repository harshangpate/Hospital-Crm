'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockEquipment: Equipment[] = [
        {
          id: '1',
          name: 'Anesthesia Machine',
          type: 'Anesthesia',
          manufacturer: 'Dräger',
          model: 'Fabius GS',
          serialNumber: 'AN-2024-001',
          status: 'AVAILABLE',
          location: 'OT-1',
          purchaseDate: '2023-01-15',
          warrantyExpiry: '2026-01-15',
          lastMaintenanceDate: '2024-12-01',
          nextMaintenanceDate: '2025-03-01',
          calibrationDate: '2024-12-01',
          usageCount: 245,
          cost: 150000,
        },
        {
          id: '2',
          name: 'Surgical Table',
          type: 'Surgical',
          manufacturer: 'Maquet',
          model: 'Alphamaxx',
          serialNumber: 'ST-2024-002',
          status: 'IN_USE',
          location: 'OT-2',
          purchaseDate: '2023-03-20',
          warrantyExpiry: '2028-03-20',
          lastMaintenanceDate: '2024-11-15',
          nextMaintenanceDate: '2025-02-15',
          usageCount: 312,
          cost: 85000,
        },
        {
          id: '3',
          name: 'Patient Monitor',
          type: 'Monitoring',
          manufacturer: 'Philips',
          model: 'IntelliVue MX450',
          serialNumber: 'PM-2024-003',
          status: 'AVAILABLE',
          location: 'OT-1',
          purchaseDate: '2023-06-10',
          warrantyExpiry: '2026-06-10',
          lastMaintenanceDate: '2024-12-05',
          nextMaintenanceDate: '2025-06-05',
          calibrationDate: '2024-12-05',
          usageCount: 189,
          cost: 35000,
        },
        {
          id: '4',
          name: 'Electrosurgical Unit',
          type: 'Surgical',
          manufacturer: 'Valleylab',
          model: 'FT10 Energy Platform',
          serialNumber: 'ES-2024-004',
          status: 'UNDER_MAINTENANCE',
          location: 'Maintenance Room',
          purchaseDate: '2023-08-25',
          warrantyExpiry: '2026-08-25',
          lastMaintenanceDate: '2025-01-10',
          nextMaintenanceDate: '2025-01-20',
          usageCount: 156,
          cost: 42000,
        },
        {
          id: '5',
          name: 'Surgical Lights',
          type: 'Lighting',
          manufacturer: 'Skytron',
          model: 'Harmony LED',
          serialNumber: 'SL-2024-005',
          status: 'AVAILABLE',
          location: 'OT-3',
          purchaseDate: '2023-02-14',
          warrantyExpiry: '2033-02-14',
          lastMaintenanceDate: '2024-11-20',
          nextMaintenanceDate: '2025-05-20',
          usageCount: 298,
          cost: 55000,
        },
        {
          id: '6',
          name: 'Ventilator',
          type: 'Anesthesia',
          manufacturer: 'Hamilton Medical',
          model: 'C6',
          serialNumber: 'VT-2024-006',
          status: 'AVAILABLE',
          location: 'OT-2',
          purchaseDate: '2023-09-30',
          warrantyExpiry: '2026-09-30',
          lastMaintenanceDate: '2024-12-08',
          nextMaintenanceDate: '2025-03-08',
          calibrationDate: '2024-12-08',
          usageCount: 134,
          cost: 95000,
        },
      ];
      setEquipment(mockEquipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading equipment...</p>
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
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Maintenance</span>
                    </button>
                    <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
                        <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
    </div>
  );
}
