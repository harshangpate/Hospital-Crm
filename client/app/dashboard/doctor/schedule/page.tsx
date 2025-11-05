'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAppointments, updateAppointmentStatus } from '@/lib/api/appointments';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Search,
  Filter,
  Loader2,
  Save,
  Coffee,
  Scissors,
  AlertTriangle,
  Users as UsersIcon,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3
} from 'lucide-react';

function ScheduleContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view') || 'day';
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Month view state
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [monthAppointments, setMonthAppointments] = useState<any[]>([]);
  const [monthBlockedSlots, setMonthBlockedSlots] = useState<any[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);
  
  // Modal states for viewing details
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await getAppointments({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      limit: 50
    });

    if (response.success) {
      const sortedAppointments = (response.data.appointments || []).sort((a: any, b: any) => {
        return a.appointmentTime.localeCompare(b.appointmentTime);
      });
      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Load month data when in month view
  useEffect(() => {
    if (viewParam !== 'month') return;

    const loadMonth = async () => {
      setMonthLoading(true);
      try {
        const start = new Date(monthStart);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setHours(0, 0, 0, 0);

        // Fetch appointments for month
        const apptRes = await getAppointments({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          limit: 1000,
        });

        if (apptRes.success) {
          setMonthAppointments(apptRes.data.appointments || []);
        }

        // Fetch blocked slots for month
        try {
          const token = localStorage.getItem('token');
          const blockedRes = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/blocked-slots?startDate=${encodeURIComponent(
            start.toISOString()
          )}&endDate=${encodeURIComponent(end.toISOString())}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (blockedRes.ok) {
            const data = await blockedRes.json();
            if (data.success) setMonthBlockedSlots(data.data || []);
          }
        } catch (err) {
          console.error('Failed to load blocked slots for month', err);
        }
      } catch (err) {
        console.error('Failed to load month data', err);
      } finally {
        setMonthLoading(false);
      }
    };

    loadMonth();
  }, [viewParam, monthStart]);

  // Helpers for calendar grid and events
  const generateMonthMatrix = (startDate: Date) => {
    const matrix: { date: Date; inMonth: boolean }[] = [];
    const firstOfMonth = new Date(startDate);
    firstOfMonth.setDate(1);
    const startDay = firstOfMonth.getDay();
    const firstCell = new Date(firstOfMonth);
    firstCell.setDate(firstOfMonth.getDate() - startDay);

    for (let i = 0; i < 42; i++) {
      const d = new Date(firstCell);
      d.setDate(firstCell.getDate() + i);
      matrix.push({ date: d, inMonth: d.getMonth() === startDate.getMonth() });
    }

    return matrix;
  };

  const eventsForDay = (date: Date, appointmentsList: any[], blockedList: any[]) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const blocks = (blockedList || []).filter((b: any) => {
      const bDate = new Date(b.date);
      return bDate >= dayStart && bDate < dayEnd;
    }).map((b: any) => ({ 
      type: 'BLOCK', 
      subType: b.type,
      label: `${b.type?.replace('_', ' ')}`,
      time: `${b.startTime}-${b.endTime}`,
      data: b
    }));

    const appts = (appointmentsList || []).filter((a: any) => {
      const aDate = new Date(a.appointmentDate);
      return aDate >= dayStart && aDate < dayEnd;
    }).map((a: any) => ({ 
      type: 'APPT', 
      subType: a.status,
      label: `${a.patient?.user?.firstName || ''} ${a.patient?.user?.lastName || ''}`,
      time: formatTime(a.appointmentTime),
      data: a
    }));

    return [...blocks, ...appts];
  };

  const getBlockTypeIcon = (blockType: string) => {
    const icons: { [key: string]: any } = {
      BREAK: Coffee,
      SURGERY: Scissors,
      EMERGENCY: AlertTriangle,
      MEETING: UsersIcon,
      LEAVE: X,
    };
    const Icon = icons[blockType] || Coffee;
    return <Icon className="w-3 h-3" />;
  };

  const getBlockTypeColor = (blockType: string) => {
    const colors: { [key: string]: string } = {
      BREAK: 'bg-amber-100 text-amber-800 border-amber-300',
      SURGERY: 'bg-red-100 text-red-800 border-red-300',
      EMERGENCY: 'bg-orange-100 text-orange-800 border-orange-300',
      MEETING: 'bg-blue-100 text-blue-800 border-blue-300',
      LEAVE: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[blockType] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  useEffect(() => {
    let filtered = appointments;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt => {
        const patientName = `${apt.patient.user.firstName} ${apt.patient.user.lastName}`.toLowerCase();
        const patientId = apt.patient.patientId.toLowerCase();
        const search = searchTerm.toLowerCase();
        return patientName.includes(search) || patientId.includes(search);
      });
    }

    setFilteredAppointments(filtered);
  }, [searchTerm, statusFilter, appointments]);

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    const response = await updateAppointmentStatus(appointmentId, {
      status: newStatus as any,
      doctorNotes: ''
    });

    if (response.success) {
      loadSchedule();
    }
  };

  const openNotesModal = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDoctorNotes(appointment.doctorNotes || '');
    setShowNotesModal(true);
  };

  const saveNotes = async () => {
    if (!selectedAppointment) return;

    setSaving(true);
    const response = await updateAppointmentStatus(selectedAppointment.id, {
      status: selectedAppointment.status,
      doctorNotes
    });

    if (response.success) {
      setShowNotesModal(false);
      loadSchedule();
    }

    setSaving(false);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
      CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[status] || colors.SCHEDULED;
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      SCHEDULED: <Clock className="w-4 h-4" />,
      CONFIRMED: <CheckCircle className="w-4 h-4" />,
      IN_PROGRESS: <PlayCircle className="w-4 h-4" />,
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
      NO_SHOW: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || icons.SCHEDULED;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getNextStatus = (currentStatus: string) => {
    const workflow: { [key: string]: string } = {
      SCHEDULED: 'CONFIRMED',
      CONFIRMED: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED'
    };
    return workflow[currentStatus];
  };

  const canProgress = (status: string) => {
    return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(status);
  };

  if (loading) {
    // If month view is requested, show month loader instead
    if (viewParam === 'month') {
      return (
        <ProtectedRoute allowedRoles={["DOCTOR"]}>
          <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading calendar...</p>
                </div>
              </div>
            </div>
          </DashboardLayout>
        </ProtectedRoute>
      );
    }

    return (
      <ProtectedRoute allowedRoles={["DOCTOR"]}>
        <DashboardLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading schedule...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{viewParam === 'month' ? 'Calendar' : "Today's Schedule"}</h1>
              <p className="text-gray-600">Manage your appointments and patient consultations</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => window.location.href = '/dashboard/doctor/schedule'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewParam !== 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/doctor/schedule?view=month'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewParam === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  Month
                </button>
              </div>

              {/* Month Navigation */}
              {viewParam === 'month' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const d = new Date(monthStart);
                      d.setMonth(d.getMonth() - 1);
                      setMonthStart(d);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      today.setDate(1);
                      today.setHours(0, 0, 0, 0);
                      setMonthStart(today);
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(monthStart);
                      d.setMonth(d.getMonth() + 1);
                      setMonthStart(d);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* If month view, render enhanced calendar grid */}
          {viewParam === 'month' ? (
            <>
              {/* Legend */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Legend:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">Appointments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee className="w-3 h-3 text-amber-600" />
                    <span className="text-sm text-gray-600">Break</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3 h-3 text-red-600" />
                    <span className="text-sm text-gray-600">Surgery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span className="text-sm text-gray-600">Emergency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-3 h-3 text-blue-600" />
                    <span className="text-sm text-gray-600">Meeting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-3 h-3 text-gray-600" />
                    <span className="text-sm text-gray-600">Leave</span>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {monthLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7">
                    {/* Day Headers */}
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => (
                      <div key={d} className="bg-gray-50 border-b border-r last:border-r-0 text-center font-semibold text-sm text-gray-700 py-3">
                        <span className="hidden md:inline">{d}</span>
                        <span className="md:hidden">{d.slice(0, 3)}</span>
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {generateMonthMatrix(monthStart).map((day: any, idx: number) => {
                      const events = eventsForDay(day.date, monthAppointments, monthBlockedSlots);
                      const isTodayDate = isToday(day.date);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`min-h-32 border-b border-r last:border-r-0 p-2 transition-colors hover:bg-gray-50 ${
                            day.inMonth ? 'bg-white' : 'bg-gray-50'
                          } ${isTodayDate ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                        >
                          {/* Date Number */}
                          <div className="flex items-center justify-between mb-2">
                            <div className={`text-sm font-semibold ${
                              isTodayDate 
                                ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                                : day.inMonth ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {day.date.getDate()}
                            </div>
                            {events.length > 0 && (
                              <span className="text-xs text-gray-500 font-medium">
                                {events.length}
                              </span>
                            )}
                          </div>

                          {/* Events */}
                          <div className="space-y-1">
                            {events.slice(0, 3).map((ev: any, i: number) => (
                              <div 
                                key={i} 
                                className={`group relative px-2 py-1 rounded text-xs cursor-pointer transition-all hover:shadow-md ${
                                  ev.type === 'BLOCK' 
                                    ? getBlockTypeColor(ev.subType)
                                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                                }`}
                                title={`${ev.time} - ${ev.label}`}
                                onClick={() => {
                                  setSelectedEvent(ev);
                                  setShowEventModal(true);
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  {ev.type === 'BLOCK' && getBlockTypeIcon(ev.subType)}
                                  <span className="font-medium truncate flex-1">{ev.time}</span>
                                </div>
                                <div className="text-xs truncate">{ev.label}</div>
                                
                                {/* Hover tooltip */}
                                <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                  {ev.time} - {ev.label}
                                </div>
                              </div>
                            ))}
                            
                            {events.length > 3 && (
                              <div className="text-xs text-gray-500 font-medium pl-2">
                                +{events.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'ALL' 
                      ? 'Try adjusting your filters' 
                      : 'No appointments scheduled for today'}
                  </p>
                </div>
              ) : (
                filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Time & Status */}
                      <div className="lg:w-48 shrink-0">
                        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-2">
                          <Clock className="w-6 h-6 text-blue-600" />
                          {formatTime(appointment.appointmentTime)}
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {appointment.patient.patientId}
                              </span>
                              {appointment.patient.user.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {appointment.patient.user.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {appointment.patient.user.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Type</p>
                            <p className="font-medium text-gray-900">
                              {appointment.type?.replace('_', ' ') || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Appointment #</p>
                            <p className="font-medium text-gray-900">{appointment.appointmentNumber}</p>
                          </div>
                          {appointment.reason && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600 mb-1">Reason</p>
                              <p className="text-gray-900">{appointment.reason}</p>
                            </div>
                          )}
                          {appointment.doctorNotes && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600 mb-1">Doctor Notes</p>
                              <p className="text-gray-900">{appointment.doctorNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {canProgress(appointment.status) && (
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, getNextStatus(appointment.status))}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <PlayCircle className="w-4 h-4" />
                              {getNextStatus(appointment.status) === 'CONFIRMED' && 'Confirm Appointment'}
                              {getNextStatus(appointment.status) === 'IN_PROGRESS' && 'Start Consultation'}
                              {getNextStatus(appointment.status) === 'COMPLETED' && 'Complete'}
                            </button>
                          )}

                          {['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(appointment.status) && (
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'NO_SHOW')}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              <AlertCircle className="w-4 h-4" />
                              Mark No Show
                            </button>
                          )}

                          <button
                            onClick={() => openNotesModal(appointment)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            {appointment.doctorNotes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Doctor Notes - {selectedAppointment?.patient.user.firstName} {selectedAppointment?.patient.user.lastName}
              </h3>
              
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={8}
                placeholder="Enter your clinical notes, observations, diagnosis, treatment plan..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Notes
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowNotesModal(false)}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedEvent.type === 'BLOCK' ? 'Blocked Slot Details' : 'Appointment Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedEvent.type === 'BLOCK' ? (
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${getBlockTypeColor(selectedEvent.subType)}`}>
                    {getBlockTypeIcon(selectedEvent.subType)}
                    <div>
                      <p className="font-semibold">{selectedEvent.subType?.replace('_', ' ')}</p>
                      <p className="text-sm">{selectedEvent.time}</p>
                    </div>
                  </div>
                  {selectedEvent.data.reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                      <p className="text-gray-900">{selectedEvent.data.reason}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Date:</p>
                    <p className="text-gray-900">{new Date(selectedEvent.data.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedEvent.label}</p>
                      <p className="text-sm text-gray-600">{selectedEvent.time}</p>
                    </div>
                  </div>
                  {selectedEvent.data.reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reason for Visit:</p>
                      <p className="text-gray-900">{selectedEvent.data.reason}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Type:</p>
                      <p className="text-gray-900">{selectedEvent.data.type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Status:</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(selectedEvent.subType)}`}>
                        {selectedEvent.subType}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowEventModal(false);
                        openNotesModal(selectedEvent.data);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View/Edit Full Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function DoctorSchedulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
