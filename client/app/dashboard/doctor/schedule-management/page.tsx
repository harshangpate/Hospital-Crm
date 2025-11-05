'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Calendar, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Coffee,
  Scissors,
  AlertTriangle,
  Users,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const BLOCK_TYPES = [
  { value: 'BREAK', label: 'Break', icon: Coffee, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'SURGERY', label: 'Surgery', icon: Scissors, color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'EMERGENCY', label: 'Emergency', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'MEETING', label: 'Meeting', icon: Users, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'LEAVE', label: 'Leave/Off', icon: X, color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

interface WeeklySchedule {
  id?: string;
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface BlockedSlot {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  reason?: string;
  isRecurring: boolean;
}

export default function ScheduleManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Weekly Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  
  // Blocked Slots State
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [newBlock, setNewBlock] = useState<BlockedSlot>({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'BREAK',
    reason: '',
    isRecurring: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadWeeklySchedule(), loadBlockedSlots()]);
    setLoading(false);
  };

  const loadWeeklySchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/weekly-schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setWeeklySchedule(data.data);
        } else {
          // Initialize with default schedule
          setWeeklySchedule(DAYS_OF_WEEK.map(day => ({
            dayOfWeek: day.value,
            isAvailable: day.value >= 1 && day.value <= 5, // Mon-Fri by default
            startTime: '09:00',
            endTime: '17:00',
          })));
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Failed to load weekly schedule');
    }
  };

  const loadBlockedSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/blocked-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBlockedSlots(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading blocked slots:', error);
    }
  };

  const handleSaveWeeklySchedule = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/weekly-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedules: weeklySchedule }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Weekly schedule saved successfully');
        } else {
          toast.error(data.message || 'Failed to save schedule');
        }
      } else {
        toast.error('Failed to save weekly schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save weekly schedule');
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (dayOfWeek: number, field: string, value: any) => {
    setWeeklySchedule(prev => {
      const existing = prev.find(s => s.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.map(s => 
          s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
        );
      } else {
        return [...prev, { dayOfWeek, isAvailable: true, startTime: '09:00', endTime: '17:00', [field]: value }];
      }
    });
  };

  const handleAddBlockedSlot = async () => {
    if (!newBlock.date || !newBlock.startTime || !newBlock.endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/blocked-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBlock),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Blocked slot added successfully');
          setShowAddBlockModal(false);
          setNewBlock({
            date: '',
            startTime: '09:00',
            endTime: '10:00',
            type: 'BREAK',
            reason: '',
            isRecurring: false,
          });
          loadBlockedSlots();
        } else {
          toast.error(data.message || 'Failed to add blocked slot');
        }
      } else {
        toast.error('Failed to add blocked slot');
      }
    } catch (error) {
      console.error('Error adding blocked slot:', error);
      toast.error('Failed to add blocked slot');
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blocked slot?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/doctors/blocked-slots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Blocked slot deleted successfully');
        loadBlockedSlots();
      } else {
        toast.error('Failed to delete blocked slot');
      }
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
      toast.error('Failed to delete blocked slot');
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaySchedule = (dayOfWeek: number): WeeklySchedule => {
    return weeklySchedule.find(s => s.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
    };
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['DOCTOR']}>
        <DashboardLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Management</h1>
            <p className="text-gray-600">
              Manage your weekly working hours and blocked time slots
            </p>
          </div>

          {/* Weekly Schedule Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
                  <p className="text-sm text-gray-600">Set your working hours for each day</p>
                </div>
              </div>
              <button
                onClick={handleSaveWeeklySchedule}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Schedule
              </button>
            </div>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map(day => {
                const schedule = getDaySchedule(day.value);
                return (
                  <div key={day.value} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-32">
                      <span className="font-medium text-gray-900">{day.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={schedule.isAvailable}
                        onChange={(e) => updateDaySchedule(day.value, 'isAvailable', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Available</span>
                    </div>

                    {schedule.isAvailable && (
                      <>
                        <select
                          value={schedule.startTime}
                          onChange={(e) => updateDaySchedule(day.value, 'startTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {generateTimeOptions().map(time => (
                            <option key={time} value={time}>{formatTime(time)}</option>
                          ))}
                        </select>
                        
                        <span className="text-gray-500">to</span>
                        
                        <select
                          value={schedule.endTime}
                          onChange={(e) => updateDaySchedule(day.value, 'endTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {generateTimeOptions().map(time => (
                            <option key={time} value={time}>{formatTime(time)}</option>
                          ))}
                        </select>
                      </>
                    )}

                    {!schedule.isAvailable && (
                      <span className="text-gray-500 italic">Not available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blocked Slots Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Blocked Time Slots</h2>
                  <p className="text-sm text-gray-600">Add breaks, surgeries, emergencies, and leaves</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBlockModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
                Add Blocked Slot
              </button>
            </div>

            {blockedSlots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No blocked slots added yet</p>
                <p className="text-sm text-gray-500 mt-1">Add breaks, surgeries, or time off</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedSlots.map(slot => {
                  const blockType = BLOCK_TYPES.find(t => t.value === slot.type);
                  const Icon = blockType?.icon || AlertCircle;
                  
                  return (
                    <div key={slot.id} className={`flex items-center justify-between p-4 border rounded-lg ${blockType?.color}`}>
                      <div className="flex items-center gap-4">
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{blockType?.label || slot.type}</span>
                            <span className="text-sm">
                              {new Date(slot.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="text-sm">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                          </div>
                          {slot.reason && (
                            <p className="text-sm mt-1 opacity-90">{slot.reason}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlockedSlot(slot.id!)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Blocked Slot Modal */}
          {showAddBlockModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Blocked Time Slot</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newBlock.type}
                      onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {BLOCK_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newBlock.date}
                      onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <select
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {generateTimeOptions().map(time => (
                          <option key={time} value={time}>{formatTime(time)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <select
                        value={newBlock.endTime}
                        onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {generateTimeOptions().map(time => (
                          <option key={time} value={time}>{formatTime(time)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                    <textarea
                      value={newBlock.reason}
                      onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                      placeholder="e.g., Lunch break, Emergency surgery, Conference"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddBlockModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBlockedSlot}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Add Blocked Slot
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How It Works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Set your working hours for each day of the week</li>
                  <li>• Add blocked slots for breaks, surgeries, emergencies, or time off</li>
                  <li>• Patients can only book appointments during available time slots</li>
                  <li>• Blocked slots automatically prevent double bookings</li>
                  <li>• Changes take effect immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
