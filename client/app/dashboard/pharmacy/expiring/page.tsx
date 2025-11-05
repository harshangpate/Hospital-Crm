'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Clock, Package, Search, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface Medicine {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  sellingPrice: number;
  medication: {
    name: string;
    category: string;
    manufacturer: string;
  };
}

export default function ExpiringPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchExpiringItems();
  }, [user, router]);

  const fetchExpiringItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/pharmacy/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const expiring = data.data.filter((m: Medicine) => {
          const daysUntilExpiry = Math.floor(
            (new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry <= 60 && daysUntilExpiry >= 0;
        });
        setMedicines(expiring.sort((a: Medicine, b: Medicine) => 
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        ));
      }
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(m => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      m.medication.name.toLowerCase().includes(search) ||
      m.medication.category?.toLowerCase().includes(search) ||
      m.medication.manufacturer?.toLowerCase().includes(search)
    );
  });

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number) => {
    if (days <= 0) return { color: 'red', label: 'Expired', bgClass: 'bg-red-100 text-red-800' };
    if (days <= 30) return { color: 'red', label: 'Critical', bgClass: 'bg-red-100 text-red-800' };
    return { color: 'orange', label: 'Expiring Soon', bgClass: 'bg-orange-100 text-orange-800' };
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="h-8 w-8 text-red-600" />
              Expiring Medicines
            </h1>
            <p className="text-gray-600 mt-2">
              Medicines expiring within the next 60 days
            </p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">
                <span className="font-semibold">{medicines.length} items</span> are expiring within 60 days
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, category, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No expiring items found</p>
                  <p className="text-sm text-gray-500 mt-1">All medicines have good expiry dates!</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMedicines.map((medicine) => {
                      const daysLeft = getDaysUntilExpiry(medicine.expiryDate);
                      const status = getExpiryStatus(daysLeft);
                      const totalValue = medicine.quantity * medicine.sellingPrice;
                      
                      return (
                        <tr key={medicine.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{medicine.medication.name}</p>
                              <p className="text-xs text-gray-500">{medicine.medication.manufacturer}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {medicine.medication.category || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {medicine.batchNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className={`text-sm font-medium ${status.color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>
                              {new Date(medicine.expiryDate).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className={`text-sm font-bold ${status.color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>
                              {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {medicine.quantity} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.bgClass} flex items-center gap-1 w-fit`}>
                              <AlertTriangle className="h-3 w-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{totalValue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
