'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  X,
  User,
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { 
  getAllSurgeries, 
  createSurgery, 
  getAllOperationTheaters,
  getOTAvailability,
  CreateSurgeryData 
} from '@/lib/api/surgery';
import { getAllDoctors } from '@/lib/api/users';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';

interface Surgery {
  id: string;
  surgeryNumber: string;
  surgeryName: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  priority: string;
  surgeryType: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  primarySurgeon: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  operationTheater: {
    name: string;
    otNumber: string;
  };
}

export default function SurgerySchedulerPage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [operationTheaters, setOperationTheaters] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [filterOT, setFilterOT] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const [surgeriesData, otsData, doctorsData] = await Promise.all([
        getAllSurgeries({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        getAllOperationTheaters(),
        getAllDoctors(),
      ]);

      setSurgeries(surgeriesData.data || []);
      setOperationTheaters(otsData.data || []);
      setDoctors(doctorsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getSurgeriesForOTAndTime = (otId: string, timeSlot: string) => {
    return surgeries.filter(surgery => {
      const surgeryStart = new Date(surgery.scheduledStartTime);
      const surgeryHour = surgeryStart.getHours();
      const surgeryMinute = surgeryStart.getMinutes();
      const surgeryTime = `${surgeryHour.toString().padStart(2, '0')}:${surgeryMinute.toString().padStart(2, '0')}`;
      
      return surgery.operationTheater.id === otId && surgeryTime === timeSlot;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const filteredOTs = filterOT === 'all' 
    ? operationTheaters 
    : operationTheaters.filter(ot => ot.id === filterOT);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading surgery schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Surgery Scheduler
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Schedule and manage operation theater bookings
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-5 h-5" />
          Schedule Surgery
        </motion.button>
      </motion.div>

      {/* Controls */}
      <ScrollReveal variant="fadeInUp">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {surgeries.length} surgeries scheduled
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Today
              </button>
              
              <select
                value={filterOT}
                onChange={(e) => setFilterOT(e.target.value)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Operation Theaters</option>
                {operationTheaters.map(ot => (
                  <option key={ot.id} value={ot.id}>
                    {ot.name} ({ot.otNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Schedule Grid */}
      <ScrollReveal variant="fadeInUp" delay={0.2}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header */}
              <div className="grid grid-cols-[100px_1fr] border-b border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time</p>
                </div>
                <div className={`grid grid-cols-${filteredOTs.length} divide-x divide-gray-200 dark:divide-gray-700`}>
                  {filteredOTs.map(ot => (
                    <div key={ot.id} className="p-4 bg-gray-50 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ot.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {ot.otNumber} • {ot.type}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {getTimeSlots().map((timeSlot, index) => (
                  <div 
                    key={timeSlot}
                    className={`grid grid-cols-[100px_1fr] ${
                      index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'
                    }`}
                  >
                    <div className="p-4 border-r border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {timeSlot}
                      </p>
                    </div>
                    <div className={`grid grid-cols-${filteredOTs.length} divide-x divide-gray-200 dark:divide-gray-700`}>
                      {filteredOTs.map(ot => {
                        const slotSurgeries = getSurgeriesForOTAndTime(ot.id, timeSlot);
                        return (
                          <div key={ot.id} className="p-2 min-h-[80px] relative">
                            {slotSurgeries.length > 0 ? (
                              slotSurgeries.map(surgery => (
                                <motion.div
                                  key={surgery.id}
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className={`p-3 rounded-lg ${getPriorityColor(surgery.priority)} cursor-pointer hover:shadow-lg transition-shadow mb-2`}
                                  onClick={() => window.location.href = `/dashboard/surgery/${surgery.id}`}
                                >
                                  <p className="font-semibold text-sm mb-1">{surgery.surgeryName}</p>
                                  <p className="text-xs opacity-90">
                                    {surgery.patient.user.firstName} {surgery.patient.user.lastName}
                                  </p>
                                  <p className="text-xs opacity-75 mt-1">
                                    Dr. {surgery.primarySurgeon.user.firstName} {surgery.primarySurgeon.user.lastName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs">
                                      {new Date(surgery.scheduledStartTime).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <button
                                onClick={() => {
                                  // Pre-fill modal with selected OT and time
                                  setShowCreateModal(true);
                                }}
                                className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
                              >
                                <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Summary Cards */}
      <ScrollReveal variant="fadeInUp" delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card3D>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Surgeries</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {surgeries.length}
                  </h3>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card3D>

          <Card3D>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                  <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {surgeries.filter(s => s.priority === 'CRITICAL').length}
                  </h3>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card3D>

          <Card3D>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Emergency</p>
                  <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                    {surgeries.filter(s => s.surgeryType === 'EMERGENCY').length}
                  </h3>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </Card3D>

          <Card3D>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Elective</p>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {surgeries.filter(s => s.surgeryType === 'ELECTIVE').length}
                  </h3>
                </div>
                <CalendarIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card3D>
        </div>
      </ScrollReveal>

      {/* Create Surgery Modal would go here */}
      {/* Implementation continues in next file due to length */}
    </div>
  );
}
