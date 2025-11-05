'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft,
  TrendingUp,
  PieChart,
  Clock,
  AlertTriangle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface AnalyticsData {
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  criticalFindings: number;
  averageReportingTime: number;
  testsByStatus: { status: string; count: number }[];
  testsByModality: { modality: string; count: number }[];
  testsByUrgency: { urgency: string; count: number }[];
  testsOverTime: { date: string; ordered: number; completed: number }[];
}

export default function RadiologyAnalyticsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'DOCTOR'].includes(user.role)) {
      router.push('/dashboard/radiology');
    }
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch radiology stats
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsResult = await statsResponse.json();
      
      // Fetch all tests for time range analysis
      const testsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/radiology-tests?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!testsResponse.ok) {
        throw new Error('Failed to fetch tests');
      }

      const testsResult = await testsResponse.json();
      const tests = testsResult.data || [];

      // Calculate time range data
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      const recentTests = tests.filter((test: any) => 
        new Date(test.orderedDate) >= cutoffDate
      );

      // Group by status
      const testsByStatus = recentTests.reduce((acc: any, test: any) => {
        const status = test.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Group by modality
      const testsByModality = recentTests.reduce((acc: any, test: any) => {
        const modality = test.modality;
        acc[modality] = (acc[modality] || 0) + 1;
        return acc;
      }, {});

      // Group by urgency
      const testsByUrgency = recentTests.reduce((acc: any, test: any) => {
        const urgency = test.urgencyLevel;
        acc[urgency] = (acc[urgency] || 0) + 1;
        return acc;
      }, {});

      // Calculate tests over time (daily for last 30 days or weekly for longer periods)
      const testsOverTime: { [key: string]: { ordered: number; completed: number } } = {};
      
      for (let i = timeRange - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        testsOverTime[dateKey] = { ordered: 0, completed: 0 };
      }

      recentTests.forEach((test: any) => {
        const orderedKey = new Date(test.orderedDate).toISOString().split('T')[0];
        if (testsOverTime[orderedKey]) {
          testsOverTime[orderedKey].ordered++;
        }
        
        if (test.status === 'COMPLETED' && test.reportedDate) {
          const completedKey = new Date(test.reportedDate).toISOString().split('T')[0];
          if (testsOverTime[completedKey]) {
            testsOverTime[completedKey].completed++;
          }
        }
      });

      // Calculate average reporting time
      const completedWithReportingTime = recentTests.filter(
        (test: any) => test.status === 'COMPLETED' && test.orderedDate && test.reportedDate
      );

      const averageReportingTime = completedWithReportingTime.length > 0
        ? completedWithReportingTime.reduce((sum: number, test: any) => {
            const ordered = new Date(test.orderedDate).getTime();
            const reported = new Date(test.reportedDate).getTime();
            const hours = (reported - ordered) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / completedWithReportingTime.length
        : 0;

      setAnalyticsData({
        totalTests: recentTests.length,
        completedTests: statsResult.data.completedTests || 0,
        pendingTests: (statsResult.data.orderedTests || 0) + 
                     (statsResult.data.scheduledTests || 0) + 
                     (statsResult.data.inProgressTests || 0) + 
                     (statsResult.data.pendingReportTests || 0) + 
                     (statsResult.data.pendingApprovalTests || 0),
        criticalFindings: statsResult.data.criticalTests || 0,
        averageReportingTime: Math.round(averageReportingTime),
        testsByStatus: Object.entries(testsByStatus).map(([status, count]) => ({
          status,
          count: count as number,
        })),
        testsByModality: Object.entries(testsByModality).map(([modality, count]) => ({
          modality,
          count: count as number,
        })),
        testsByUrgency: Object.entries(testsByUrgency).map(([urgency, count]) => ({
          urgency,
          count: count as number,
        })),
        testsOverTime: Object.entries(testsOverTime).map(([date, counts]) => ({
          date,
          ordered: counts.ordered,
          completed: counts.completed,
        })),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'ORDERED': '#eab308',
      'SCHEDULED': '#3b82f6',
      'IN_PROGRESS': '#8b5cf6',
      'PERFORMED': '#6366f1',
      'PENDING_REPORT': '#f97316',
      'PENDING_APPROVAL': '#ec4899',
      'COMPLETED': '#22c55e',
      'CANCELLED': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getModalityColor = (modality: string, index: number) => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', 
      '#eab308', '#22c55e', '#06b6d4', '#6366f1'
    ];
    return colors[index % colors.length];
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
          <div className="mb-8">
            <Link
              href="/dashboard/radiology"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Radiology Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  Radiology Analytics
                </h1>
                <p className="text-gray-600 mt-2">
                  Comprehensive analytics and insights for radiology operations
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                  <option value={365}>Last Year</option>
                </select>
              </div>
            </div>
          </div>

          {analyticsData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tests</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {analyticsData.totalTests}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {analyticsData.completedTests}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">
                        {analyticsData.pendingTests}
                      </p>
                    </div>
                    <Clock className="h-10 w-10 text-orange-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Critical Findings</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        {analyticsData.criticalFindings}
                      </p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-red-400" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Reporting</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {analyticsData.averageReportingTime}h
                      </p>
                    </div>
                    <Clock className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Test Volume Trend */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Test Volume Trend
                  </h2>
                  <div className="space-y-4">
                    {analyticsData.testsOverTime.slice(-14).map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {day.ordered} ordered / {day.completed} completed
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{
                                width: `${Math.max((day.ordered / Math.max(...analyticsData.testsOverTime.map(d => d.ordered))) * 100, 5)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-green-500 h-full rounded-full"
                              style={{
                                width: `${Math.max((day.completed / Math.max(...analyticsData.testsOverTime.map(d => d.completed))) * 100, 5)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-600">Ordered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Tests by Status */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <PieChart className="h-6 w-6 text-purple-600" />
                    Tests by Status
                  </h2>
                  <div className="space-y-4">
                    {analyticsData.testsByStatus
                      .sort((a, b) => b.count - a.count)
                      .map((item, index) => {
                        const total = analyticsData.testsByStatus.reduce((sum, s) => sum + s.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {item.status.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getStatusColor(item.status),
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tests by Modality */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    Tests by Modality
                  </h2>
                  <div className="space-y-4">
                    {analyticsData.testsByModality
                      .sort((a, b) => b.count - a.count)
                      .map((item, index) => {
                        const total = analyticsData.testsByModality.reduce((sum, m) => sum + m.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {item.modality.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getModalityColor(item.modality, index),
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tests by Urgency Level */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    Tests by Urgency Level
                  </h2>
                  <div className="space-y-4">
                    {analyticsData.testsByUrgency
                      .sort((a, b) => {
                        const order = ['STAT', 'EMERGENCY', 'URGENT', 'ROUTINE'];
                        return order.indexOf(a.urgency) - order.indexOf(b.urgency);
                      })
                      .map((item, index) => {
                        const total = analyticsData.testsByUrgency.reduce((sum, u) => sum + u.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        const colors: { [key: string]: string } = {
                          'STAT': '#dc2626',
                          'EMERGENCY': '#ef4444',
                          'URGENT': '#f97316',
                          'ROUTINE': '#6b7280',
                        };
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {item.urgency}
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: colors[item.urgency] || '#6b7280',
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Completion Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analyticsData.totalTests > 0 
                        ? ((analyticsData.completedTests / analyticsData.totalTests) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Critical Finding Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analyticsData.totalTests > 0 
                        ? ((analyticsData.criticalFindings / analyticsData.totalTests) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Most Common Modality</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analyticsData.testsByModality.length > 0
                        ? analyticsData.testsByModality.sort((a, b) => b.count - a.count)[0].modality.replace('_', ' ')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
