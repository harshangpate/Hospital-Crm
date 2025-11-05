'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/auth-store';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Building, Plus, Edit2, Trash2, X, Search, BedDouble } from 'lucide-react';

interface Ward {
  id: string;
  wardNumber: string;
  wardName: string;
  floor: number;
  wardType: 'General' | 'Private' | 'ICU' | 'Emergency';
  capacity: number;
  occupiedBeds: number;
  chargesPerDay: number;
  facilities?: string;
  isActive?: boolean;
  createdAt: string;
}

interface WardFormData {
  wardNumber: string;
  name: string;
  floor: string;
  type: 'GENERAL' | 'PRIVATE' | 'SEMI_PRIVATE' | 'ICU' | 'EMERGENCY';
  totalBeds: number;
  charges: number;
}

export default function WardManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <WardManagement />
    </ProtectedRoute>
  );
}

function WardManagement() {
  const { token } = useAuthStore();
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredWards, setFilteredWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState<WardFormData>({
    wardNumber: '',
    name: '',
    floor: '',
    type: 'GENERAL',
    totalBeds: 0,
    charges: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterWards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wards, searchTerm, selectedType]);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/ipd/wards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWards(data.data);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWards = () => {
    let filtered = [...wards];

    if (searchTerm) {
      filtered = filtered.filter(
        (ward) =>
          ward.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ward.wardNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter((ward) => ward.wardType === selectedType);
    }

    setFilteredWards(filtered);
  };

  const handleOpenForm = (ward?: Ward) => {
    if (ward) {
      setEditingWard(ward);
      setFormData({
        wardNumber: ward.wardNumber,
        name: ward.wardName,
        floor: ward.floor.toString(),
        type: ward.wardType.toUpperCase() as 'GENERAL' | 'PRIVATE' | 'SEMI_PRIVATE' | 'ICU' | 'EMERGENCY',
        totalBeds: ward.capacity,
        charges: ward.chargesPerDay,
      });
    } else {
      setEditingWard(null);
      setFormData({
        wardNumber: '',
        name: '',
        floor: '',
        type: 'GENERAL',
        totalBeds: 0,
        charges: 0,
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWard(null);
    setFormData({
      wardNumber: '',
      name: '',
      floor: '',
      type: 'GENERAL',
      totalBeds: 0,
      charges: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingWard
        ? `http://localhost:5000/api/v1/ipd/wards/${editingWard.id}`
        : 'http://localhost:5000/api/v1/ipd/wards';

      const method = editingWard ? 'PUT' : 'POST';

      // Map frontend field names to backend field names
      const payload = {
        wardNumber: formData.wardNumber,
        wardName: formData.name,
        wardType: formData.type,
        floor: parseInt(formData.floor),
        capacity: formData.totalBeds,
        chargesPerDay: formData.charges,
        facilities: null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchWards();
        handleCloseForm();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save ward');
      }
    } catch (error) {
      console.error('Error saving ward:', error);
      alert('An error occurred while saving the ward');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (wardId: string) => {
    if (!confirm('Are you sure you want to delete this ward? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/v1/ipd/wards/${wardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchWards();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete ward');
      }
    } catch (error) {
      console.error('Error deleting ward:', error);
      alert('An error occurred while deleting the ward');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'GENERAL':
        return 'bg-blue-100 text-blue-800';
      case 'PRIVATE':
        return 'bg-purple-100 text-purple-800';
      case 'SEMI_PRIVATE':
        return 'bg-indigo-100 text-indigo-800';
      case 'ICU':
        return 'bg-red-100 text-red-800';
      case 'EMERGENCY':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Ward Management</h1>
                <p className="text-sm text-gray-600">Manage hospital wards and bed allocation</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ward</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search wards by name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="GENERAL">General</option>
              <option value="PRIVATE">Private</option>
              <option value="SEMI_PRIVATE">Semi-Private</option>
              <option value="ICU">ICU</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
        </div>

        {/* Ward Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredWards.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No wards found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating a new ward'}
            </p>
            {!searchTerm && selectedType === 'all' && (
              <button
                onClick={() => handleOpenForm()}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Ward
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWards.map((ward) => {
              const availableBeds = ward.capacity - ward.occupiedBeds;
              const occupancyPercentage = ((ward.occupiedBeds / ward.capacity) * 100).toFixed(0);

              return (
                <div
                  key={ward.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="p-5">
                    {/* Ward Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{ward.wardName}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                              ward.wardType
                            )}`}
                          >
                            {ward.wardType}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Ward No:</span> {ward.wardNumber}
                          </p>
                          <p>
                            <span className="font-medium">Floor:</span> {ward.floor}
                          </p>
                          <p>
                            <span className="font-medium">Charges:</span> ₹{ward.chargesPerDay}/day
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bed Statistics */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <BedDouble className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Bed Status</span>
                        </div>
                        <span
                          className={`text-sm font-semibold ${getOccupancyColor(
                            availableBeds,
                            ward.capacity
                          )}`}
                        >
                          {occupancyPercentage}% occupied
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-gray-600">Total Beds</p>
                          <p className="font-semibold text-gray-800">{ward.capacity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Available</p>
                          <p className="font-semibold text-green-600">{availableBeds}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Occupied</p>
                          <p className="font-semibold text-red-600">{ward.occupiedBeds}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenForm(ward)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ward.id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ward Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingWard ? 'Edit Ward' : 'Add New Ward'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ward Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ward Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.wardNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, wardNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., W-101"
                      />
                    </div>

                    {/* Ward Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ward Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., General Ward A"
                      />
                    </div>

                    {/* Floor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Ground Floor, 1st Floor"
                      />
                    </div>

                    {/* Ward Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ward Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as WardFormData['type'],
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="GENERAL">General</option>
                        <option value="PRIVATE">Private</option>
                        <option value="SEMI_PRIVATE">Semi-Private</option>
                        <option value="ICU">ICU</option>
                        <option value="EMERGENCY">Emergency</option>
                      </select>
                    </div>

                    {/* Total Beds */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Beds <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.totalBeds}
                        onChange={(e) =>
                          setFormData({ ...formData, totalBeds: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 10"
                      />
                    </div>

                    {/* Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Charges per Day (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.charges}
                        onChange={(e) =>
                          setFormData({ ...formData, charges: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 1000"
                      />
                    </div>
                  </div>

                  {/* Info Note */}
                  {!editingWard && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Note:</span> Beds will be automatically
                        created based on the total beds count. You can manage individual beds from
                        the Bed Management page.
                      </p>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : editingWard ? 'Update Ward' : 'Create Ward'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
