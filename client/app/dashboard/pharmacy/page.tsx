'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { 
  Pill, 
  Clock, 
  Package, 
  AlertTriangle, 
  Eye, 
  CheckCircle2, 
  Search,
  RefreshCw,
  DollarSign,
  Printer,
  Bell,
  X,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import StatCardComponent from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface PharmacyStats {
  pendingPrescriptions: number;
  dispensedToday: number;
  lowStockItems: number;
  expiringItems: number;
  totalMedicines: number;
  totalInventoryValue: number;
  monthlyRevenue?: number;
  averageDispensingTime?: number;
  outOfStockItems?: number;
  urgentPrescriptions?: number;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    patientId: string;
  };
  doctor: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  items: Array<{
    medication: {
      genericName: string;
      brandName: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }>;
  createdAt: string;
}

export default function PharmacyPortal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PharmacyStats>({
    pendingPrescriptions: 0,
    dispensedToday: 0,
    lowStockItems: 0,
    expiringItems: 0,
    totalMedicines: 0,
    totalInventoryValue: 0,
    monthlyRevenue: 0,
    averageDispensingTime: 0,
    outOfStockItems: 0,
    urgentPrescriptions: 0,
  });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'dispensed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchStats();
    fetchPrescriptions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchPrescriptions();
    }, 30000);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
        fetchPrescriptions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, statusFilter]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/pharmacy/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching pharmacy stats:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = statusFilter === 'pending' 
        ? '/prescriptions/pending' 
        : '/prescriptions/dispensed';
      
      const response = await fetch(`http://localhost:5000/api/v1/pharmacy${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const newPrescriptions = data.data;
        
        // Check for new pending prescriptions
        if (statusFilter === 'pending' && prescriptions.length > 0) {
          const newCount = newPrescriptions.length - prescriptions.length;
          if (newCount > 0) {
            showNotificationMessage(`${newCount} new prescription${newCount > 1 ? 's' : ''} received!`);
            playNotificationSound();
          }
        }
        
        setPrescriptions(newPrescriptions);
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchPrescriptions()]);
    setRefreshing(false);
    showNotificationMessage('Data refreshed successfully!');
  };

  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const playNotificationSound = () => {
    // Play a subtle notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTgjMGHm7A7+OZURE');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleBulkDispense = async () => {
    if (selectedPrescriptions.length === 0) {
      alert('Please select prescriptions to dispense');
      return;
    }

    if (!confirm(`Are you sure you want to dispense ${selectedPrescriptions.length} prescription(s)?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const promises = selectedPrescriptions.map(id =>
        fetch(`http://localhost:5000/api/v1/pharmacy/prescriptions/${id}/dispense`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(promises);
      showNotificationMessage(`${selectedPrescriptions.length} prescription(s) dispensed successfully!`);
      setSelectedPrescriptions([]);
      fetchPrescriptions();
      fetchStats();
    } catch (error) {
      console.error('Error bulk dispensing:', error);
      alert('Failed to dispense some prescriptions');
    }
  };

  const togglePrescriptionSelection = (id: string) => {
    setSelectedPrescriptions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPrescriptions.length === filteredPrescriptions.length) {
      setSelectedPrescriptions([]);
    } else {
      setSelectedPrescriptions(filteredPrescriptions.map(p => p.id));
    }
  };

  const handleDispense = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to dispense this prescription?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        showNotificationMessage('Prescription dispensed successfully!');
        fetchPrescriptions();
        fetchStats();
      } else {
        alert(data.message || 'Failed to dispense prescription');
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      alert('Failed to dispense prescription');
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      p.prescriptionNumber.toLowerCase().includes(search) ||
      p.patient.user.firstName.toLowerCase().includes(search) ||
      p.patient.user.lastName.toLowerCase().includes(search) ||
      p.patient.patientId.toLowerCase().includes(search)
    );
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <style jsx global>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in {
            animation: slideIn 0.3s ease-out;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        <div className='min-h-screen bg-gray-50 p-6'>
          {/* Notification Toast */}
          {showNotification && (
            <div className='fixed top-4 right-4 z-50 animate-slide-in'>
              <div className='bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3'>
                <Bell className='h-5 w-5' />
                <span>{notificationMessage}</span>
                <button onClick={() => setShowNotification(false)} className='ml-2'>
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
          )}

          {/* Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white overflow-hidden mb-8"
          >
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold mb-2"
                  >
                    Pharmacy Portal 💊
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-green-100 text-lg"
                  >
                    Manage prescriptions, dispense medications, and track inventory
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className='text-xs text-green-100 mt-2'
                  >
                    Last updated: {lastFetchTime.toLocaleTimeString()}
                  </motion.p>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className='flex items-center gap-3'
              >
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className='flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all shadow-lg'
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handlePrintList}
                  className='flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg'
                >
                  <Printer className='h-4 w-4' />
                  Print
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8'>
            <StatCardComponent
              icon={<Clock className="w-6 h-6" />}
              title="Pending"
              value={stats.pendingPrescriptions.toString()}
              gradient="from-yellow-500 to-orange-600"
              delay={0.1}
              onClick={() => setStatusFilter('pending')}
            />
            <StatCardComponent
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Dispensed Today"
              value={stats.dispensedToday.toString()}
              gradient="from-green-500 to-emerald-600"
              delay={0.15}
              onClick={() => setStatusFilter('dispensed')}
            />
            <StatCardComponent
              icon={<AlertTriangle className="w-6 h-6" />}
              title="Low Stock"
              value={stats.lowStockItems.toString()}
              gradient="from-orange-500 to-red-600"
              delay={0.2}
              onClick={() => router.push('/dashboard/pharmacy/low-stock')}
            />
            <StatCardComponent
              icon={<Package className="w-6 h-6" />}
              title="Expiring Soon"
              value={stats.expiringItems.toString()}
              gradient="from-red-500 to-pink-600"
              delay={0.25}
              onClick={() => router.push('/dashboard/pharmacy/expiring')}
            />
            <StatCardComponent
              icon={<Pill className="w-6 h-6" />}
              title="Total Medicines"
              value={stats.totalMedicines.toString()}
              gradient="from-blue-500 to-indigo-600"
              delay={0.3}
              onClick={() => router.push('/dashboard/pharmacy/inventory')}
            />
          </div>

          {/* Revenue & Value Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
            <div className='bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-purple-100'>Inventory Value</p>
                  <p className='text-3xl font-bold mt-2'>₹{stats.totalInventoryValue.toLocaleString()}</p>
                  <p className='text-xs text-purple-100 mt-2'>Total stock worth</p>
                </div>
                <Package className='h-12 w-12 text-purple-200 opacity-80' />
              </div>
            </div>

            <div className='bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-green-100'>Monthly Revenue</p>
                  <p className='text-3xl font-bold mt-2'>₹{(stats.monthlyRevenue || 0).toLocaleString()}</p>
                  <p className='text-xs text-green-100 mt-2'>From dispensed medicines</p>
                </div>
                <DollarSign className='h-12 w-12 text-green-200 opacity-80' />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className='bg-white rounded-lg shadow p-4 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
              <div className='md:col-span-2 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search by prescription number, patient name, or ID...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'pending' | 'dispensed')}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='pending'>Pending Prescriptions</option>
                <option value='dispensed'>Dispensed Prescriptions</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='today'>Today</option>
                <option value='week'>This Week</option>
                <option value='month'>This Month</option>
                <option value='all'>All Time</option>
              </select>
            </div>
            
            {/* Bulk Actions */}
            {statusFilter === 'pending' && selectedPrescriptions.length > 0 && (
              <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <span className='text-sm text-blue-700 font-medium'>
                  {selectedPrescriptions.length} prescription(s) selected
                </span>
                <div className='flex gap-2'>
                  <button
                    onClick={handleBulkDispense}
                    className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors'
                  >
                    <CheckSquare className='h-4 w-4' />
                    Dispense Selected
                  </button>
                  <button
                    onClick={() => setSelectedPrescriptions([])}
                    className='px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors'
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prescriptions List */}
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <div className='overflow-x-auto'>
              {loading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className='text-center py-12'>
                  <Pill className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600'>No {statusFilter} prescriptions found</p>
                </div>
              ) : (
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      {statusFilter === 'pending' && (
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          <input
                            type='checkbox'
                            checked={selectedPrescriptions.length === filteredPrescriptions.length && filteredPrescriptions.length > 0}
                            onChange={toggleSelectAll}
                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          />
                        </th>
                      )}
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Prescription
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Patient
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Doctor
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Medications
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription.id} className='hover:bg-gray-50'>
                        {statusFilter === 'pending' && (
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <input
                              type='checkbox'
                              checked={selectedPrescriptions.includes(prescription.id)}
                              onChange={() => togglePrescriptionSelection(prescription.id)}
                              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                          </td>
                        )}
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <span className='text-sm font-medium text-blue-600'>
                              {prescription.prescriptionNumber}
                            </span>
                            <p className='text-xs text-gray-400 mt-1'>
                              {getTimeAgo(prescription.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center'>
                            <div className='shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold'>
                              {prescription.patient.user.firstName[0]}{prescription.patient.user.lastName[0]}
                            </div>
                            <div className='ml-3'>
                              <p className='text-sm font-medium text-gray-900'>
                                {prescription.patient.user.firstName} {prescription.patient.user.lastName}
                              </p>
                              <p className='text-xs text-gray-500'>{prescription.patient.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <p className='text-sm text-gray-900'>
                            Dr. {prescription.doctor.user.firstName} {prescription.doctor.user.lastName}
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            {prescription.items?.map((item, idx) => (
                              <div key={idx} className='mb-1'>
                                <span className='font-medium'>
                                  {item.medication.brandName || item.medication.genericName}
                                </span>
                                <span className='text-gray-500 text-xs ml-2'>
                                  ({item.dosage} - {item.frequency} - {item.duration})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            prescription.status === 'ISSUED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {prescription.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => router.push(`/dashboard/pharmacy/${prescription.id}`)}
                              className='text-blue-600 hover:text-blue-900 font-medium'
                            >
                              <Eye className='h-4 w-4 inline mr-1' />
                              View
                            </button>
                            {prescription.status === 'ISSUED' && (
                              <button
                                onClick={() => handleDispense(prescription.id)}
                                className='text-green-600 hover:text-green-900 font-medium'
                              >
                                <CheckCircle2 className='h-4 w-4 inline mr-1' />
                                Dispense
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-8'>
            <button
              onClick={() => router.push('/dashboard/pharmacy/inventory')}
              className='bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left'
            >
              <Package className='h-10 w-10 text-blue-600 mb-3' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Manage Inventory</h3>
              <p className='text-sm text-gray-600'>View and update medicine stock levels</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/pharmacy/low-stock')}
              className='bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left'
            >
              <AlertTriangle className='h-10 w-10 text-orange-600 mb-3' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Low Stock Alerts</h3>
              <p className='text-sm text-gray-600'>{stats.lowStockItems} items need restocking</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/pharmacy/expiring')}
              className='bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left'
            >
              <Clock className='h-10 w-10 text-red-600 mb-3' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Expiring Items</h3>
              <p className='text-sm text-gray-600'>{stats.expiringItems} items expiring soon</p>
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
