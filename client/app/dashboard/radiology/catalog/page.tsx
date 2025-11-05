'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  X,
  Save,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface ImagingTest {
  id: string;
  testName: string;
  testCode: string;
  modality: string;
  bodyPart: string;
  studyType: string;
  description: string | null;
  indications: string | null;
  contraindications: string | null;
  preparation: string | null;
  technique: string | null;
  protocol: string | null;
  contrastRequired: boolean;
  estimatedDuration: number | null;
  basePrice: number;
  urgentPrice: number | null;
  emergencyPrice: number | null;
  reportingTime: number | null;
  urgentReportingTime: number | null;
  isActive: boolean;
  requiresApproval: boolean;
  department: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  testName: string;
  testCode: string;
  modality: string;
  bodyPart: string;
  studyType: string;
  description: string;
  indications: string;
  contraindications: string;
  preparation: string;
  technique: string;
  protocol: string;
  contrastRequired: boolean;
  estimatedDuration: number | null;
  basePrice: number;
  urgentPrice: number | null;
  emergencyPrice: number | null;
  reportingTime: number | null;
  urgentReportingTime: number | null;
  department: string;
  notes: string;
}

const MODALITY_OPTIONS = [
  'X_RAY',
  'CT',
  'MRI',
  'ULTRASOUND',
  'MAMMOGRAPHY',
  'PET_SCAN',
  'FLUOROSCOPY',
  'NUCLEAR_MEDICINE',
  'DEXA_SCAN',
];

export default function ImagingCatalogPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [imagingTests, setImagingTests] = useState<ImagingTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<ImagingTest | null>(null);
  const [formData, setFormData] = useState<FormData>({
    testName: '',
    testCode: '',
    modality: 'X_RAY',
    bodyPart: '',
    studyType: '',
    description: '',
    indications: '',
    contraindications: '',
    preparation: '',
    technique: '',
    protocol: '',
    contrastRequired: false,
    estimatedDuration: null,
    basePrice: 0,
    urgentPrice: null,
    emergencyPrice: null,
    reportingTime: null,
    urgentReportingTime: null,
    department: '',
    notes: '',
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard/radiology');
    }
    fetchImagingTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalityFilter]);

  const fetchImagingTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (modalityFilter) params.append('modality', modalityFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/imaging-catalog?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setImagingTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching imaging tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.testName || !formData.testCode || !formData.bodyPart) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const url = editingTest
        ? `${process.env.NEXT_PUBLIC_API_URL}/imaging-catalog/${editingTest.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/imaging-catalog`;

      const method = editingTest ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Imaging test ${editingTest ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        setEditingTest(null);
        resetForm();
        fetchImagingTests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save imaging test');
      }
    } catch (error) {
      console.error('Error saving imaging test:', error);
      alert('Error saving imaging test');
    }
  };

  const handleEdit = (test: ImagingTest) => {
    setEditingTest(test);
    setFormData({
      testName: test.testName,
      testCode: test.testCode,
      modality: test.modality,
      bodyPart: test.bodyPart,
      studyType: test.studyType,
      description: test.description || '',
      indications: test.indications || '',
      contraindications: test.contraindications || '',
      preparation: test.preparation || '',
      technique: test.technique || '',
      protocol: test.protocol || '',
      contrastRequired: test.contrastRequired,
      estimatedDuration: test.estimatedDuration,
      basePrice: test.basePrice,
      urgentPrice: test.urgentPrice,
      emergencyPrice: test.emergencyPrice,
      reportingTime: test.reportingTime,
      urgentReportingTime: test.urgentReportingTime,
      department: test.department || '',
      notes: test.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this imaging test?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/imaging-catalog/${testId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Imaging test deleted successfully');
        fetchImagingTests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete imaging test');
      }
    } catch (error) {
      console.error('Error deleting imaging test:', error);
      alert('Error deleting imaging test');
    }
  };

  const handleToggleStatus = async (testId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/imaging-catalog/${testId}/toggle`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchImagingTests();
      } else {
        alert('Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error toggling status');
    }
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      testCode: '',
      modality: 'X_RAY',
      bodyPart: '',
      studyType: '',
      description: '',
      indications: '',
      contraindications: '',
      preparation: '',
      technique: '',
      protocol: '',
      contrastRequired: false,
      estimatedDuration: null,
      basePrice: 0,
      urgentPrice: null,
      emergencyPrice: null,
      reportingTime: null,
      urgentReportingTime: null,
      department: '',
      notes: '',
    });
  };

  const filteredTests = imagingTests.filter(test => {
    const searchLower = searchTerm.toLowerCase();
    return (
      test.testName.toLowerCase().includes(searchLower) ||
      test.testCode.toLowerCase().includes(searchLower) ||
      test.modality.toLowerCase().includes(searchLower) ||
      test.bodyPart.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Imaging Test Catalog
              </h1>
              <p className="text-gray-600 mt-2">
                Manage imaging test definitions, modalities, and protocols
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTest(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Imaging Test
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by test name, code, modality..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Modalities</option>
                {MODALITY_OPTIONS.map(modality => (
                  <option key={modality} value={modality}>
                    {modality.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tests Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Test Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Modality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Body Part
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reporting Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No imaging tests found
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {test.testCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {test.testName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {test.modality.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.bodyPart}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-semibold">₹{test.basePrice}</span>
                            {test.urgentPrice && (
                              <span className="text-xs text-orange-600">
                                Urgent: ₹{test.urgentPrice}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.reportingTime ? `${test.reportingTime}h` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(test.id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              test.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {test.isActive ? (
                              <>
                                <Power className="h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <PowerOff className="h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(test)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(test.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingTest ? 'Edit' : 'Add'} Imaging Test
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingTest(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.testName}
                          onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.testCode}
                          onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={!!editingTest}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modality <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.modality}
                          onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          {MODALITY_OPTIONS.map(modality => (
                            <option key={modality} value={modality}>
                              {modality.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Body Part <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.bodyPart}
                          onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          placeholder="e.g., Chest, Abdomen, Head"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Study Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.studyType}
                          onChange={(e) => setFormData({ ...formData, studyType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          placeholder="e.g., With Contrast, Without Contrast"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clinical Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Clinical Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Indications
                        </label>
                        <textarea
                          value={formData.indications}
                          onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="When is this test indicated?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraindications
                        </label>
                        <textarea
                          value={formData.contraindications}
                          onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="When should this test NOT be performed?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient Preparation
                        </label>
                        <textarea
                          value={formData.preparation}
                          onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="e.g., Fasting required, Remove metal objects"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Technical Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={formData.contrastRequired}
                            onChange={(e) => setFormData({ ...formData, contrastRequired: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Requires Contrast
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reporting Time (hours)
                        </label>
                        <input
                          type="number"
                          value={formData.reportingTime || ''}
                          onChange={(e) => setFormData({ ...formData, reportingTime: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.estimatedDuration || ''}
                          onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="e.g., 30"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Technique
                        </label>
                        <textarea
                          value={formData.technique}
                          onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Imaging technique details"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Protocol
                        </label>
                        <textarea
                          value={formData.protocol}
                          onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Standard imaging protocol for this study"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Urgent Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.urgentPrice || ''}
                          onChange={(e) => setFormData({ ...formData, urgentPrice: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                          placeholder="Optional"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.emergencyPrice || ''}
                          onChange={(e) => setFormData({ ...formData, emergencyPrice: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Radiology, Imaging"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Any additional notes or instructions"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingTest(null);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save className="h-5 w-5" />
                      {editingTest ? 'Update' : 'Create'} Test
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
