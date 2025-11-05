'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Package, Search, AlertTriangle, Edit2, X, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface Medicine {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  reorderLevel: number;
  sellingPrice: number;
  unitCost: number;
  supplierName: string;
  medication: {
    name: string;
    category: string;
    manufacturer: string;
  };
}

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    reorderLevel: 0,
    unitCost: 0,
    sellingPrice: 0,
    supplierName: '',
  });
  const [addForm, setAddForm] = useState({
    medicationName: '',
    genericName: '',
    brandName: '',
    manufacturer: '',
    medicationForm: 'TABLET',
    strength: '',
    category: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    reorderLevel: 10,
    unitCost: 0,
    sellingPrice: 0,
    supplierName: '',
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchInventory();
  }, [user, router]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/pharmacy/inventory?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data || []);
      } else {
        setMedicines([]);
      }
    } catch (error) {
      setMedicines([]);
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
      m.medication.manufacturer?.toLowerCase().includes(search) ||
      m.batchNumber.toLowerCase().includes(search)
    );
  });

  const isLowStock = (quantity: number, reorderLevel: number) => quantity <= reorderLevel;
  const isExpiringSoon = (expiryDate: string) => {
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 60;
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setEditForm({
      quantity: medicine.quantity,
      reorderLevel: medicine.reorderLevel,
      unitCost: medicine.unitCost || 0,
      sellingPrice: medicine.sellingPrice,
      supplierName: medicine.supplierName || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingMedicine) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/pharmacy/inventory/${editingMedicine.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (data.success) {
        alert('Inventory updated successfully!');
        setEditingMedicine(null);
        fetchInventory();
      } else {
        alert(data.message || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Failed to update inventory');
    }
  };

  const handleAddMedicine = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First create medication
      const medResponse = await fetch('http://localhost:5000/api/v1/medications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addForm.medicationName,
          genericName: addForm.genericName,
          brandName: addForm.brandName,
          manufacturer: addForm.manufacturer,
          medicationForm: addForm.medicationForm,
          strength: addForm.strength,
          category: addForm.category,
          unitPrice: addForm.sellingPrice,
        }),
      });

      const medData = await medResponse.json();
      if (!medData.success) {
        alert(medData.message || 'Failed to create medication');
        return;
      }

      // Then add inventory
      const invResponse = await fetch('http://localhost:5000/api/v1/pharmacy/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationId: medData.data.id,
          batchNumber: addForm.batchNumber,
          expiryDate: addForm.expiryDate,
          quantity: addForm.quantity,
          reorderLevel: addForm.reorderLevel,
          unitCost: addForm.unitCost,
          sellingPrice: addForm.sellingPrice,
          supplierName: addForm.supplierName,
        }),
      });

      const invData = await invResponse.json();
      if (invData.success) {
        alert('Medicine and inventory added successfully!');
        setShowAddModal(false);
        setAddForm({
          medicationName: '',
          genericName: '',
          brandName: '',
          manufacturer: '',
          medicationForm: 'TABLET',
          strength: '',
          category: '',
          batchNumber: '',
          expiryDate: '',
          quantity: 0,
          reorderLevel: 10,
          unitCost: 0,
          sellingPrice: 0,
          supplierName: '',
        });
        fetchInventory();
      } else {
        alert(invData.message || 'Failed to add inventory');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Failed to add medicine');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage medicine stock, add new items, and update inventory
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Medicine
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, category, manufacturer, or batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No medicines found in inventory</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Medicine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expiry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMedicines.map((medicine) => (
                      <tr key={medicine.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{medicine.medication.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{medicine.medication.manufacturer}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {medicine.medication.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {medicine.batchNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <p className={`font-medium ${isExpiringSoon(medicine.expiryDate) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-300'}`}>
                              {new Date(medicine.expiryDate).toLocaleDateString()}
                            </p>
                            {isExpiringSoon(medicine.expiryDate) && (
                              <p className="text-xs text-red-500 dark:text-red-400">Expiring soon!</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <p className={`font-medium ${isLowStock(medicine.quantity, medicine.reorderLevel) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-gray-300'}`}>
                              {medicine.quantity} units
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Reorder at {medicine.reorderLevel}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                          ₹{medicine.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLowStock(medicine.quantity, medicine.reorderLevel) && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(medicine)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Edit Modal */}
          {editingMedicine && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Inventory</h3>
                  <button
                    onClick={() => setEditingMedicine(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{editingMedicine.medication.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Batch: {editingMedicine.batchNumber}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (units)
                    </label>
                    <input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={editForm.reorderLevel}
                      onChange={(e) => setEditForm({...editForm, reorderLevel: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.unitCost}
                      onChange={(e) => setEditForm({...editForm, unitCost: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.sellingPrice}
                      onChange={(e) => setEditForm({...editForm, sellingPrice: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={editForm.supplierName}
                      onChange={(e) => setEditForm({...editForm, supplierName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditingMedicine(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Medicine Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 max-h-screen overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Add New Medicine</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        value={addForm.medicationName}
                        onChange={(e) => setAddForm({...addForm, medicationName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Paracetamol"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Generic Name
                      </label>
                      <input
                        type="text"
                        value={addForm.genericName}
                        onChange={(e) => setAddForm({...addForm, genericName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={addForm.brandName}
                        onChange={(e) => setAddForm({...addForm, brandName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manufacturer *
                      </label>
                      <input
                        type="text"
                        value={addForm.manufacturer}
                        onChange={(e) => setAddForm({...addForm, manufacturer: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Form *
                      </label>
                      <select
                        value={addForm.medicationForm}
                        onChange={(e) => setAddForm({...addForm, medicationForm: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="TABLET">Tablet</option>
                        <option value="CAPSULE">Capsule</option>
                        <option value="SYRUP">Syrup</option>
                        <option value="INJECTION">Injection</option>
                        <option value="CREAM">Cream</option>
                        <option value="OINTMENT">Ointment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strength *
                      </label>
                      <input
                        type="text"
                        value={addForm.strength}
                        onChange={(e) => setAddForm({...addForm, strength: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 500mg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={addForm.category}
                        onChange={(e) => setAddForm({...addForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Analgesic"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Inventory Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch Number *
                        </label>
                        <input
                          type="text"
                          value={addForm.batchNumber}
                          onChange={(e) => setAddForm({...addForm, batchNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={addForm.expiryDate}
                          onChange={(e) => setAddForm({...addForm, expiryDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Initial Quantity *
                        </label>
                        <input
                          type="number"
                          value={addForm.quantity}
                          onChange={(e) => setAddForm({...addForm, quantity: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reorder Level *
                        </label>
                        <input
                          type="number"
                          value={addForm.reorderLevel}
                          onChange={(e) => setAddForm({...addForm, reorderLevel: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Cost (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={addForm.unitCost}
                          onChange={(e) => setAddForm({...addForm, unitCost: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={addForm.sellingPrice}
                          onChange={(e) => setAddForm({...addForm, sellingPrice: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier
                        </label>
                        <input
                          type="text"
                          value={addForm.supplierName}
                          onChange={(e) => setAddForm({...addForm, supplierName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleAddMedicine}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Medicine
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
