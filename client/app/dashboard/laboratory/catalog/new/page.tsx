'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function TestCatalogFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();
  const isEdit = params?.id;

  const [loading, setLoading] = useState(isEdit ? true : false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    testCode: '',
    testName: '',
    testCategory: '',
    testSubcategory: '',
    department: 'Laboratory',
    sampleType: '',
    sampleVolume: '',
    container: '',
    normalRange: '',
    normalRangeMale: '',
    normalRangeFemale: '',
    normalRangeChild: '',
    unit: '',
    methodology: '',
    price: '',
    urgentPrice: '',
    turnAroundTime: '24 hours',
    urgentTurnAround: '',
    specialInstructions: '',
    prerequisites: '',
    requiresFasting: false,
    isActive: true,
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (isEdit) {
      fetchTestCatalog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTestCatalog = async () => {
    if (!token || !params?.id) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/test-catalog/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const test = result.data;
        setFormData({
          testCode: test.testCode || '',
          testName: test.testName || '',
          testCategory: test.testCategory || '',
          testSubcategory: test.testSubcategory || '',
          department: test.department || 'Laboratory',
          sampleType: test.sampleType || '',
          sampleVolume: test.sampleVolume || '',
          container: test.container || '',
          normalRange: test.normalRange || '',
          normalRangeMale: test.normalRangeMale || '',
          normalRangeFemale: test.normalRangeFemale || '',
          normalRangeChild: test.normalRangeChild || '',
          unit: test.unit || '',
          methodology: test.methodology || '',
          price: test.price?.toString() || '',
          urgentPrice: test.urgentPrice?.toString() || '',
          turnAroundTime: test.turnAroundTime || '24 hours',
          urgentTurnAround: test.urgentTurnAround || '',
          specialInstructions: test.specialInstructions || '',
          prerequisites: test.prerequisites || '',
          requiresFasting: test.requiresFasting || false,
          isActive: test.isActive !== undefined ? test.isActive : true,
        });
      } else {
        alert('Failed to fetch test details');
        router.push('/dashboard/laboratory/catalog');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Error fetching test details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.testCode || !formData.testName || !formData.testCategory || !formData.price) {
      alert('Please fill in all required fields: Test Code, Name, Category, and Price');
      return;
    }

    try {
      setSubmitting(true);

      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/test-catalog/${params.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/test-catalog`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Test ${isEdit ? 'updated' : 'created'} successfully!`);
        router.push('/dashboard/laboratory/catalog');
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${isEdit ? 'update' : 'create'} test`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

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
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/laboratory/catalog')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Catalog
            </button>

            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              {isEdit ? 'Edit Test' : 'Add New Test'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEdit
                ? 'Update test definition and pricing'
                : 'Create a new test entry in the catalog'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Code *
                  </label>
                  <input
                    type="text"
                    name="testCode"
                    value={formData.testCode}
                    onChange={handleChange}
                    required
                    placeholder="e.g., CBC001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    name="testName"
                    value={formData.testName}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Complete Blood Count"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="testCategory"
                    value={formData.testCategory}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Immunology">Immunology</option>
                    <option value="Serology">Serology</option>
                    <option value="Urology">Urology</option>
                    <option value="Molecular Biology">Molecular Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    name="testSubcategory"
                    value={formData.testSubcategory}
                    onChange={handleChange}
                    placeholder="e.g., Blood Test"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="e.g., cells/μL, mg/dL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sample Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sample Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sample Type
                  </label>
                  <input
                    type="text"
                    name="sampleType"
                    value={formData.sampleType}
                    onChange={handleChange}
                    placeholder="e.g., Blood, Urine"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sample Volume
                  </label>
                  <input
                    type="text"
                    name="sampleVolume"
                    value={formData.sampleVolume}
                    onChange={handleChange}
                    placeholder="e.g., 5 mL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container
                  </label>
                  <input
                    type="text"
                    name="container"
                    value={formData.container}
                    onChange={handleChange}
                    placeholder="e.g., EDTA Tube"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Normal Range Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Normal Range Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Normal Range
                  </label>
                  <input
                    type="text"
                    name="normalRange"
                    value={formData.normalRange}
                    onChange={handleChange}
                    placeholder="e.g., 4.5-11.0 x10^9/L"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Male Normal Range
                  </label>
                  <input
                    type="text"
                    name="normalRangeMale"
                    value={formData.normalRangeMale}
                    onChange={handleChange}
                    placeholder="Male-specific range"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Female Normal Range
                  </label>
                  <input
                    type="text"
                    name="normalRangeFemale"
                    value={formData.normalRangeFemale}
                    onChange={handleChange}
                    placeholder="Female-specific range"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Normal Range
                  </label>
                  <input
                    type="text"
                    name="normalRangeChild"
                    value={formData.normalRangeChild}
                    onChange={handleChange}
                    placeholder="Child-specific range"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Timing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing & Timing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="e.g., 500.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgent Price
                  </label>
                  <input
                    type="number"
                    name="urgentPrice"
                    value={formData.urgentPrice}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="e.g., 750.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Turn Around Time
                  </label>
                  <input
                    type="text"
                    name="turnAroundTime"
                    value={formData.turnAroundTime}
                    onChange={handleChange}
                    placeholder="e.g., 24 hours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgent Turn Around Time
                  </label>
                  <input
                    type="text"
                    name="urgentTurnAround"
                    value={formData.urgentTurnAround}
                    onChange={handleChange}
                    placeholder="e.g., 4 hours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Methodology
                  </label>
                  <input
                    type="text"
                    name="methodology"
                    value={formData.methodology}
                    onChange={handleChange}
                    placeholder="e.g., Automated Cell Counter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any special handling or collection instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prerequisites
                  </label>
                  <textarea
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any preparation needed before the test..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="requiresFasting"
                      checked={formData.requiresFasting}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Requires Fasting</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-5 w-5" />
                  {submitting ? 'Saving...' : isEdit ? 'Update Test' : 'Create Test'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/laboratory/catalog')}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
