'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  ArrowLeft,
  TrendingUp,
  Star,
  Plus,
  Loader2,
  Eye,
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface PerformanceReview {
  id: string;
  staffId: string;
  reviewPeriod: string;
  reviewDate: string;
  productivity?: number;
  quality?: number;
  teamwork?: number;
  communication?: number;
  punctuality?: number;
  overallRating?: number;
  strengths?: string;
  weaknesses?: string;
  goals?: string;
  comments?: string;
  staff: {
    staffId: string;
    department: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Staff {
  id: string;
  staffId: string;
  department: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function PerformancePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    staffId: '',
    reviewPeriod: '',
    reviewDate: new Date().toISOString().split('T')[0],
    productivity: 5,
    quality: 5,
    teamwork: 5,
    communication: 5,
    punctuality: 5,
    overallRating: 5,
    strengths: '',
    weaknesses: '',
    goals: '',
    comments: '',
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [reviewsRes, staffRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/performance', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/v1/staff', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [reviewsData, staffData] = await Promise.all([
        reviewsRes.json(),
        staffRes.json(),
      ]);

      setReviews(reviewsData.data || []);
      setStaffList(staffData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/v1/performance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create review');

      toast.success('Performance review created successfully');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create performance review');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.staff.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.staff.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.staff.staffId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-400';
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <button
                onClick={() => router.push('/dashboard/staff/hr')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to HR Portal
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                Performance Reviews
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Evaluate staff performance and track progress
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Review
            </button>
          </motion.div>

          {/* Search */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Reviews List */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No performance reviews found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Staff
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Review Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Productivity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Quality
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Teamwork
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Overall
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredReviews.map((review) => (
                        <motion.tr
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {review.staff.user.firstName[0]}{review.staff.user.lastName[0]}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {review.staff.user.firstName} {review.staff.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {review.staff.staffId} • {review.staff.department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-1 text-sm font-bold ${getRatingColor(review.productivity)}`}>
                              <Star className="w-4 h-4 fill-current" />
                              {review.productivity || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-1 text-sm font-bold ${getRatingColor(review.quality)}`}>
                              <Star className="w-4 h-4 fill-current" />
                              {review.quality || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-1 text-sm font-bold ${getRatingColor(review.teamwork)}`}>
                              <Star className="w-4 h-4 fill-current" />
                              {review.teamwork || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-1 text-sm font-bold ${getRatingColor(review.overallRating)}`}>
                              <Star className="h-4 w-4 fill-current" />
                              {review.overallRating || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-700 transition-colors">
                              <Eye className="h-5 w-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Create Review Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Performance Review</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Staff Member
                      </label>
                      <select
                        value={formData.staffId}
                        onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select Staff</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.staffId} - {s.user.firstName} {s.user.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Review Period
                      </label>
                      <input
                        type="text"
                        value={formData.reviewPeriod}
                        onChange={(e) => setFormData({ ...formData, reviewPeriod: e.target.value })}
                        placeholder="e.g., Q1 2024, H1 2024"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review Date
                    </label>
                    <input
                      type="date"
                      value={formData.reviewDate}
                      onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Productivity', key: 'productivity' },
                      { label: 'Quality', key: 'quality' },
                      { label: 'Teamwork', key: 'teamwork' },
                      { label: 'Communication', key: 'communication' },
                      { label: 'Punctuality', key: 'punctuality' },
                      { label: 'Overall', key: 'overallRating' }
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.label} Rating
                        </label>
                        <select
                          value={formData[field.key as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option key={rating} value={rating}>{rating} ⭐</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Strengths
                    </label>
                    <textarea
                      value={formData.strengths}
                      onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Areas for Improvement
                    </label>
                    <textarea
                      value={formData.weaknesses}
                      onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goals
                    </label>
                    <textarea
                      value={formData.goals}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Create Review
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
