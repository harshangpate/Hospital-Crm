'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Clock,
  UserCheck,
  UserX,
  Calendar,
  Download,
  Filter,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Card3D from '@/components/ui/Card3D';
import ScrollReveal from '@/components/ui/ScrollReveal';

interface StaffMember {
  id: string;
  staffId: string;
  userId: string;
  department: string;
  designation: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY' | 'LATE';
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  staff: StaffMember;
}

interface AttendanceStats {
  totalStaff: number;
  present: number;
  absent: number;
  onLeave: number;
  lateArrivals: number;
  pending: number;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStaff: 0,
    present: 0,
    absent: 0,
    onLeave: 0,
    lateArrivals: 0,
    pending: 0,
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PRESENT' | 'ABSENT' | 'LEAVE'>('ALL');
  const [markingAttendance, setMarkingAttendance] = useState(false);

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchStaffAndAttendance();
    }
  }, [token, selectedDate]);

  const fetchStaffAndAttendance = async () => {
    try {
      setLoading(true);
      
      // Fetch all staff first
      const staffResponse = await fetch('http://localhost:5000/api/v1/staff?limit=500', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!staffResponse.ok) {
        throw new Error('Failed to fetch staff data');
      }

      const staffData = await staffResponse.json();
      const staffList = staffData.data || [];
      setStaff(staffList);

      // Fetch attendance stats
      const statsResponse = await fetch(`http://localhost:5000/api/v1/attendance/stats?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch attendance stats');
      }

      const statsData = await statsResponse.json();
      const statsInfo = statsData.data;
      
      setStats({
        totalStaff: statsInfo.totalStaff || staffList.length,
        present: statsInfo.present || 0,
        absent: statsInfo.absent || 0,
        onLeave: statsInfo.onLeave || 0,
        lateArrivals: statsInfo.late || 0,
        pending: statsInfo.notMarked || 0,
      });

      // Fetch attendance records
      const attendanceResponse = await fetch(`http://localhost:5000/api/v1/attendance?date=${selectedDate}&limit=500`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance records');
      }

      const attendanceData = await attendanceResponse.json();
      const attendanceRecords = attendanceData.data || [];

      // Create a map of staff ID to attendance record
      const attendanceMap = new Map();
      attendanceRecords.forEach((record: any) => {
        attendanceMap.set(record.staff.id, {
          id: record.id,
          staffId: record.staff.id,
          date: record.date,
          status: record.status,
          checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          workHours: record.workHours,
          staff: record.staff,
        });
      });

      // Merge staff with attendance - show ALL staff, marked or not
      const mergedAttendance: AttendanceRecord[] = staffList.map((member: StaffMember) => {
        const existingAttendance = attendanceMap.get(member.id);
        if (existingAttendance) {
          return existingAttendance;
        }
        // Create default "not marked" attendance record
        return {
          id: `temp-${member.id}`,
          staffId: member.id,
          date: selectedDate,
          status: 'PENDING' as const,
          staff: member,
        };
      });

      setAttendance(mergedAttendance);

    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (staffId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    try {
      setMarkingAttendance(true);
      
      // Check if marking present and determine if late based on current time
      let finalStatus = status;
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const reportingTime = 10; // 10 AM
      
      if (status === 'PRESENT') {
        // If marking present after 10 AM, mark as LATE
        if (currentHour > reportingTime || (currentHour === reportingTime && currentMinute > 0)) {
          finalStatus = 'LATE' as any;
          toast.info('Marked as LATE (after 10 AM reporting time)');
        }
      }
      
      // Call API to mark attendance
      const response = await fetch('http://localhost:5000/api/v1/attendance/mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId,
          date: selectedDate,
          status: finalStatus,
          checkIn: (status === 'PRESENT' || finalStatus === 'LATE') ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }

      const data = await response.json();
      
      // Refresh attendance data
      await fetchStaffAndAttendance();

      toast.success(`Attendance marked as ${finalStatus}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!confirm('Mark all staff as present for today?')) return;

    try {
      setMarkingAttendance(true);
      
      // Get all staff IDs
      const allStaffIds = attendance.map(att => att.staffId);
      
      const response = await fetch('http://localhost:5000/api/v1/attendance/mark-bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          staffIds: allStaffIds,
          status: 'PRESENT',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark bulk attendance');
      }

      // Refresh attendance data
      await fetchStaffAndAttendance();

      toast.success('All staff marked as present');
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleCheckout = async (staffId: string) => {
    try {
      setMarkingAttendance(true);
      
      const now = new Date();
      
      // Call API to update checkout time
      const response = await fetch('http://localhost:5000/api/v1/attendance/mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId,
          date: selectedDate,
          status: 'PRESENT', // Keep the same status
          checkOut: now.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark checkout');
      }

      // Refresh attendance data to show updated checkout time and work hours
      await fetchStaffAndAttendance();

      toast.success('Checkout recorded successfully');
    } catch (error) {
      console.error('Error marking checkout:', error);
      toast.error('Failed to mark checkout');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleExportAttendance = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const filteredAttendance = attendance.filter(att => {
    const matchesSearch = 
      att.staff.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.staff.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.staff.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.staff.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || att.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'ABSENT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'LEAVE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HALF_DAY':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LATE':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'PENDING':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4" />;
      case 'LEAVE':
        return <Calendar className="h-4 w-4" />;
      case 'LATE':
        return <Clock className="h-4 w-4" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                Attendance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track and manage staff attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleExportAttendance}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Export
              </button>
              <button
                onClick={handleMarkAllPresent}
                disabled={markingAttendance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="h-5 w-5" />
                Mark All Present
              </button>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.totalStaff}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-blue-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {stats.present}
                      </p>
                    </div>
                    <UserCheck className="h-10 w-10 text-green-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {stats.absent}
                      </p>
                    </div>
                    <UserX className="h-10 w-10 text-red-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">On Leave</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                        {stats.onLeave}
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-yellow-600 opacity-80" />
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                        {stats.totalStaff > 0 ? ((stats.present / stats.totalStaff) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <CalendarDays className="h-10 w-10 text-purple-600 opacity-80" />
                  </div>
                </div>
              </Card3D>
            </div>
          </ScrollReveal>

          {/* Filters and Search */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('PENDING')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'PENDING'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilterStatus('PRESENT')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'PRESENT'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => setFilterStatus('ABSENT')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'ABSENT'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    onClick={() => setFilterStatus('LEAVE')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === 'LEAVE'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Attendance Table */}
          <ScrollReveal>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  </div>
                ) : filteredAttendance.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Staff Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAttendance.map((record) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {record.staff.user.firstName[0]}{record.staff.user.lastName[0]}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {record.staff.user.firstName} {record.staff.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {record.staff.staffId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{record.staff.department}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{record.staff.designation}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.checkIn || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.checkOut || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {/* Check In Button */}
                              <button
                                onClick={() => handleMarkAttendance(record.staffId, 'PRESENT')}
                                disabled={markingAttendance || record.status === 'PRESENT' || record.status === 'LATE'}
                                className={`${
                                  record.status === 'PRESENT' || record.status === 'LATE'
                                    ? 'text-green-600'
                                    : 'text-gray-500 hover:text-green-600'
                                } disabled:text-gray-400 disabled:cursor-not-allowed transition-colors`}
                                title="Mark Present / Check In"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </button>
                              
                              {/* Check Out Button - only show if checked in */}
                              {(record.status === 'PRESENT' || record.status === 'LATE') && record.checkIn && !record.checkOut && (
                                <button
                                  onClick={() => handleCheckout(record.staffId)}
                                  disabled={markingAttendance}
                                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                  title="Check Out"
                                >
                                  <Clock className="h-5 w-5" />
                                </button>
                              )}
                              
                              {/* Absent Button */}
                              <button
                                onClick={() => handleMarkAttendance(record.staffId, 'ABSENT')}
                                disabled={markingAttendance || record.status === 'ABSENT'}
                                className={`${
                                  record.status === 'ABSENT'
                                    ? 'text-red-600'
                                    : 'text-gray-500 hover:text-red-600'
                                } disabled:text-gray-400 disabled:cursor-not-allowed transition-colors`}
                                title="Mark Absent"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                              
                              {/* Leave Button */}
                              <button
                                onClick={() => handleMarkAttendance(record.staffId, 'LEAVE')}
                                disabled={markingAttendance || record.status === 'LEAVE'}
                                className={`${
                                  record.status === 'LEAVE'
                                    ? 'text-yellow-600'
                                    : 'text-gray-500 hover:text-yellow-600'
                                } disabled:text-gray-400 disabled:cursor-not-allowed transition-colors`}
                                title="Mark Leave"
                              >
                                <Calendar className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
