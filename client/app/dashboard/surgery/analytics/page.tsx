'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';

export default function SurgeryAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock analytics data
      const mockData = {
        overview: {
          totalSurgeries: 487,
          surgeryChange: 12.5,
          completedSurgeries: 456,
          completionRate: 93.6,
          cancelledSurgeries: 31,
          cancellationRate: 6.4,
          averageDuration: 145,
          durationChange: -5.2,
        },
        otUtilization: {
          averageUtilization: 78.5,
          utilizationChange: 8.3,
          totalOTHours: 2340,
          surgeryHours: 1837,
          idleHours: 503,
          otStats: [
            { name: 'OT-1', utilization: 85.2, surgeries: 124 },
            { name: 'OT-2', utilization: 82.7, surgeries: 118 },
            { name: 'OT-3', utilization: 75.3, surgeries: 98 },
            { name: 'OT-4', utilization: 71.9, surgeries: 89 },
            { name: 'OT-5', utilization: 68.4, surgeries: 58 },
          ],
        },
        surgeryTypes: [
          { type: 'Orthopedic', count: 142, percentage: 29.2, avgDuration: 135 },
          { type: 'General', count: 98, percentage: 20.1, avgDuration: 95 },
          { type: 'Cardiac', count: 87, percentage: 17.9, avgDuration: 285 },
          { type: 'Neurosurgery', count: 65, percentage: 13.3, avgDuration: 245 },
          { type: 'Gynecology', count: 52, percentage: 10.7, avgDuration: 85 },
          { type: 'Others', count: 43, percentage: 8.8, avgDuration: 115 },
        ],
        clinicalMetrics: {
          complicationRate: 3.8,
          infectionRate: 1.2,
          reoperationRate: 2.5,
          mortalityRate: 0.4,
          averageRecoveryDays: 5.2,
        },
        financialMetrics: {
          totalRevenue: 45680000,
          revenueChange: 15.7,
          averageRevenuePerSurgery: 93782,
          totalCost: 32450000,
          profit: 13230000,
          profitMargin: 28.9,
        },
        monthlyTrend: [
          { month: 'Jan', surgeries: 72, revenue: 6750000, utilization: 75 },
          { month: 'Feb', surgeries: 68, revenue: 6380000, utilization: 72 },
          { month: 'Mar', surgeries: 81, revenue: 7590000, utilization: 78 },
          { month: 'Apr', surgeries: 76, revenue: 7120000, utilization: 76 },
          { month: 'May', surgeries: 85, revenue: 7970000, utilization: 82 },
          { month: 'Jun', surgeries: 105, revenue: 9850000, utilization: 88 },
        ],
        priorityDistribution: [
          { priority: 'CRITICAL', count: 24, percentage: 4.9 },
          { priority: 'HIGH', count: 87, percentage: 17.9 },
          { priority: 'MEDIUM', count: 234, percentage: 48.1 },
          { priority: 'LOW', count: 142, percentage: 29.1 },
        ],
      };
      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
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
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Surgery Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </motion.button>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <ScrollReveal variant="fadeInUp">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Surgeries',
              value: data.overview.totalSurgeries,
              change: data.overview.surgeryChange,
              icon: Activity,
              color: 'bg-blue-500',
            },
            {
              label: 'Completion Rate',
              value: `${data.overview.completionRate}%`,
              change: 2.1,
              icon: TrendingUp,
              color: 'bg-green-500',
            },
            {
              label: 'Avg Duration',
              value: `${data.overview.averageDuration}m`,
              change: data.overview.durationChange,
              icon: Clock,
              color: 'bg-purple-500',
            },
            {
              label: 'Total Revenue',
              value: `₹${(data.financialMetrics.totalRevenue / 10000000).toFixed(1)}Cr`,
              change: data.financialMetrics.revenueChange,
              icon: DollarSign,
              color: 'bg-yellow-500',
            },
          ].map((stat, index) => (
            <Card3D key={stat.label} intensity={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </motion.div>
            </Card3D>
          ))}
        </div>
      </ScrollReveal>

      {/* OT Utilization */}
      <ScrollReveal variant="fadeInUp" delay={0.2}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              OT Utilization Overview
            </h2>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{data.otUtilization.averageUtilization}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Utilization</p>
            </div>
          </div>
          <div className="space-y-4">
            {data.otUtilization.otStats.map((ot: any, index: number) => (
              <div key={ot.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {ot.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {ot.surgeries} surgeries · {ot.utilization}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ot.utilization}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`h-full rounded-full ${
                      ot.utilization >= 80
                        ? 'bg-green-500'
                        : ot.utilization >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Surgery Types & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surgery Types */}
        <ScrollReveal variant="fadeInUp" delay={0.3}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Surgery Types Distribution
              </h2>
            </div>
            <div className="space-y-3">
              {data.surgeryTypes.map((type: any, index: number) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{type.type}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {type.count} ({type.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${type.percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Avg Duration: {type.avgDuration} minutes
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Priority Distribution */}
        <ScrollReveal variant="fadeInUp" delay={0.4}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Priority Distribution
              </h2>
            </div>
            <div className="space-y-4">
              {data.priorityDistribution.map((priority: any, index: number) => {
                const colors: Record<string, string> = {
                  CRITICAL: 'bg-red-500',
                  HIGH: 'bg-orange-500',
                  MEDIUM: 'bg-yellow-500',
                  LOW: 'bg-green-500',
                };
                return (
                  <div
                    key={priority.priority}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[priority.priority]}`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {priority.priority}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {priority.count}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {priority.percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Clinical Metrics */}
      <ScrollReveal variant="fadeInUp" delay={0.5}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Clinical Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Complication Rate', value: `${data.clinicalMetrics.complicationRate}%`, status: 'warning' },
              { label: 'Infection Rate', value: `${data.clinicalMetrics.infectionRate}%`, status: 'good' },
              { label: 'Re-operation Rate', value: `${data.clinicalMetrics.reoperationRate}%`, status: 'warning' },
              { label: 'Mortality Rate', value: `${data.clinicalMetrics.mortalityRate}%`, status: 'good' },
              { label: 'Avg Recovery', value: `${data.clinicalMetrics.averageRecoveryDays} days`, status: 'good' },
            ].map((metric) => (
              <div key={metric.label} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.label}</p>
                <p
                  className={`text-2xl font-bold ${
                    metric.status === 'good' ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Financial Metrics */}
      <ScrollReveal variant="fadeInUp" delay={0.6}>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Financial Performance
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{(data.financialMetrics.totalRevenue / 10000000).toFixed(2)} Cr
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                +{data.financialMetrics.revenueChange}% from last period
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Profit</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{(data.financialMetrics.profit / 10000000).toFixed(2)} Cr
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {data.financialMetrics.profitMargin}% margin
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Revenue/Surgery</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{(data.financialMetrics.averageRevenuePerSurgery / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Per procedure</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Monthly Trend */}
      <ScrollReveal variant="fadeInUp" delay={0.7}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Monthly Trend
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Month
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Surgeries
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.monthlyTrend.map((month: any) => (
                  <tr key={month.month} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {month.month}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {month.surgeries}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ₹{(month.revenue / 100000).toFixed(1)}L
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          month.utilization >= 80
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : month.utilization >= 60
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {month.utilization}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
