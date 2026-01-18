'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft,
  Activity, 
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  User,
  TestTube2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  results: string;
  normalRange: string | null;
  isCritical: boolean;
  isAbnormal: boolean;
  orderedDate: string;
  doctor: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface PatientInfo {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
}

interface TestStats {
  [testName: string]: {
    count: number;
    min?: number;
    max?: number;
    avg?: number;
    latest?: number;
    trend?: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
    hasNumericData?: boolean;
  };
}

interface AbnormalTrend {
  testName: string;
  consecutiveCount: number;
  latestResult: string;
  latestDate: string;
}

export default function PatientLabHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [uniqueTestNames, setUniqueTestNames] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<TestStats>({});
  const [abnormalTrends, setAbnormalTrends] = useState<AbnormalTrend[]>([]);
  
  // Filters
  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (token && params.patientId) {
      fetchLabHistory();
    }
  }, [token, params.patientId, selectedTest, startDate, endDate]);

  const fetchLabHistory = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (selectedTest && selectedTest !== 'all') {
        queryParams.append('testName', selectedTest);
      }
      if (startDate) {
        queryParams.append('startDate', startDate);
      }
      if (endDate) {
        queryParams.append('endDate', endDate);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lab-tests/patient/${params.patientId}/history?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPatient(data.data.patient);
        setLabTests(data.data.tests);
        setUniqueTestNames(data.data.uniqueTestNames);
        setStatistics(data.data.statistics);
        setAbnormalTrends(data.data.abnormalTrends);
      } else {
        console.error('Failed to fetch lab history:', data.message);
      }
    } catch (error) {
      console.error('Error fetching lab history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for selected test
  const getChartData = () => {
    if (!selectedTest || selectedTest === 'all') return [];

    const filteredTests = labTests.filter((test) => test.testName === selectedTest);
    
    return filteredTests
      .map((test) => {
        // Extract numeric value from result
        const match = test.results?.match(/[\d.]+/);
        const value = match ? parseFloat(match[0]) : null;
        
        if (value === null) return null;

        // Extract normal range bounds
        let normalRangeLow = null;
        let normalRangeHigh = null;
        if (test.normalRange) {
          const rangeMatch = test.normalRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
          if (rangeMatch) {
            normalRangeLow = parseFloat(rangeMatch[1]);
            normalRangeHigh = parseFloat(rangeMatch[2]);
          }
        }

        return {
          date: new Date(test.orderedDate).toLocaleDateString(),
          fullDate: test.orderedDate,
          value,
          normalRangeLow,
          normalRangeHigh,
          isCritical: test.isCritical,
          isAbnormal: test.isAbnormal,
          testNumber: test.testNumber,
        };
      })
      .filter((item) => item !== null)
      .reverse(); // Show oldest first for trend
  };

  const chartData = getChartData();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-green-600" />;
      case 'stable':
        return <Minus className="h-5 w-5 text-blue-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (test: LabTest) => {
    if (test.isCritical) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Critical
        </span>
      );
    }
    if (test.isAbnormal) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Abnormal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Normal
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'NURSE', 'PATIENT']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'NURSE', 'PATIENT']}>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <Link
              href="/dashboard/laboratory"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Laboratory
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-600" />
                  Lab Test History
                </h1>
                {patient && (
                  <div className="mt-3 flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    <div>
                      DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </div>
                    <div>Gender: {patient.gender}</div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{labTests.length}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
            </div>
          </div>

          {/* Abnormal Trends Alert */}
          {abnormalTrends.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">
                    ⚠️ Abnormal Trends Detected
                  </h3>
                  <div className="space-y-2">
                    {abnormalTrends.map((trend, index) => (
                      <div key={index} className="text-red-700">
                        <strong>{trend.testName}</strong>: {trend.consecutiveCount} consecutive
                        abnormal results. Latest: {trend.latestResult} on{' '}
                        {new Date(trend.latestDate).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type
                </label>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tests</option>
                  {uniqueTestNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Test Statistics */}
          {selectedTest && selectedTest !== 'all' && statistics[selectedTest] && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTest} - Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics[selectedTest].count}
                  </div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                {statistics[selectedTest].hasNumericData !== false && (
                  <>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {statistics[selectedTest].min?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Minimum</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {statistics[selectedTest].avg?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Average</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {statistics[selectedTest].max?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Maximum</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        {getTrendIcon(statistics[selectedTest].trend || 'insufficient_data')}
                        <div className="text-lg font-bold text-purple-600 capitalize">
                          {statistics[selectedTest].trend || 'N/A'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">Trend</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Trend Chart */}
          {selectedTest && selectedTest !== 'all' && chartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Trend Chart - {selectedTest}</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.testNumber}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(data.fullDate).toLocaleString()}
                            </p>
                            <p className="font-bold text-blue-600 mt-2">Value: {data.value}</p>
                            {data.normalRangeLow && data.normalRangeHigh && (
                              <p className="text-sm text-gray-600">
                                Normal: {data.normalRangeLow} - {data.normalRangeHigh}
                              </p>
                            )}
                            {data.isCritical && (
                              <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Critical
                              </span>
                            )}
                            {data.isAbnormal && !data.isCritical && (
                              <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                Abnormal
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  
                  {/* Normal range reference lines */}
                  {chartData[0]?.normalRangeLow && (
                    <ReferenceLine
                      y={chartData[0].normalRangeLow}
                      stroke="green"
                      strokeDasharray="3 3"
                      label="Low Normal"
                    />
                  )}
                  {chartData[0]?.normalRangeHigh && (
                    <ReferenceLine
                      y={chartData[0].normalRangeHigh}
                      stroke="green"
                      strokeDasharray="3 3"
                      label="High Normal"
                    />
                  )}
                  
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={payload.isCritical ? '#dc2626' : payload.isAbnormal ? '#f59e0b' : '#3b82f6'}
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>Abnormal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          )}

          {/* Test Results Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TestTube2 className="h-6 w-6 text-blue-600" />
                Test Results
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Normal Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {labTests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No test results found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    labTests.map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(test.orderedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {test.testNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{test.testName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{test.results}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {test.normalRange || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(test)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          Dr. {test.doctor.user.firstName} {test.doctor.user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/dashboard/laboratory/${test.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
