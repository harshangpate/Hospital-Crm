'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
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
import { getAllUsers } from '@/lib/api/users';
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
    id: string;
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

      const [surgeriesData, otsData, doctorsData, patientsData] = await Promise.all([
        getAllSurgeries({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        getAllOperationTheaters(),
        getAllUsers({ role: 'DOCTOR', limit: 1000 }),
        getAllUsers({ role: 'PATIENT', limit: 1000 }),
      ]);

      setSurgeries(surgeriesData.data || []);
      setOperationTheaters(otsData.data || []);
      
      // Handle nested data structure from API
      const doctorsList = Array.isArray(doctorsData.data) 
        ? doctorsData.data 
        : (doctorsData.data?.users || []);
      setDoctors(doctorsList);
      
      const patientsList = Array.isArray(patientsData.data) 
        ? patientsData.data 
        : (patientsData.data?.users || []);
      setPatients(patientsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    // Start from midnight (00:00) to cover overnight surgeries
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getSurgeriesForOTAndTime = (otId: string, timeSlot: string) => {
    const filtered = surgeries.filter(surgery => {
      if (surgery.operationTheater.id !== otId) return false;
      
      const surgeryStart = new Date(surgery.scheduledStartTime);
      const surgeryEnd = new Date(surgery.scheduledEndTime);
      
      // Add 2 hours cleanup time after surgery
      const cleanupEnd = new Date(surgeryEnd);
      cleanupEnd.setHours(cleanupEnd.getHours() + 2);
      
      // Parse the time slot (e.g., "22:00")
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      
      // Create slot time for the current selected date
      const slotTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), slotHour, slotMinute, 0, 0);
      
      // Create slot end time (30 minutes later)
      const slotEndTime = new Date(slotTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);
      
      // Check if this time slot overlaps with surgery time + cleanup time
      const overlaps = slotTime < cleanupEnd && slotEndTime > surgeryStart;
      
      return overlaps;
    });
    
    // Mark if this is cleanup time vs actual surgery time
    return filtered.map(surgery => {
      const surgeryEnd = new Date(surgery.scheduledEndTime);
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), slotHour, slotMinute, 0, 0);
      
      return {
        ...surgery,
        isCleanup: slotTime >= surgeryEnd
      };
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading surgery schedule...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
      <div>
        {filteredOTs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No operation theaters available. Please add operation theaters first.</p>
          </div>
        ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header */}
              <div className="grid grid-cols-[100px_1fr] border-b border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time</p>
                </div>
                <div 
                  className="grid divide-x divide-gray-200 dark:divide-gray-700"
                  style={{ gridTemplateColumns: `repeat(${filteredOTs.length}, 1fr)` }}
                >
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
                    <div 
                      className="grid divide-x divide-gray-200 dark:divide-gray-700"
                      style={{ gridTemplateColumns: `repeat(${filteredOTs.length}, 1fr)` }}
                    >
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
                                  className={`p-3 rounded-lg ${
                                    surgery.isCleanup 
                                      ? 'bg-gray-400 dark:bg-gray-600 text-white border-2 border-dashed border-gray-500'
                                      : getPriorityColor(surgery.priority)
                                  } cursor-pointer hover:shadow-lg transition-shadow mb-2`}
                                  onClick={() => window.location.href = `/dashboard/surgery/${surgery.id}`}
                                >
                                  {surgery.isCleanup ? (
                                    <>
                                      <p className="font-semibold text-sm mb-1">🧹 Cleanup & Sterilization</p>
                                      <p className="text-xs opacity-90">
                                        Post: {surgery.surgeryName}
                                      </p>
                                      <p className="text-xs opacity-75 mt-1">
                                        OT Reserved for cleaning
                                      </p>
                                    </>
                                  ) : (
                                    <>
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
                                    </>
                                  )}
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
        )}
      </div>

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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Schedule Surgery</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const scheduledDate = formData.get('scheduledDate') as string;
                const startTimeStr = formData.get('scheduledStartTime') as string;
                const endTimeStr = formData.get('scheduledEndTime') as string;
                
                const startTime = new Date(`${scheduledDate}T${startTimeStr}`);
                let endTime = new Date(`${scheduledDate}T${endTimeStr}`);
                
                // If end time is before start time, it means surgery spans to next day
                if (endTime <= startTime) {
                  endTime.setDate(endTime.getDate() + 1);
                }
                
                const otId = formData.get('operationTheaterId') as string;
                
                // Add 2 hours cleanup time
                const cleanupEnd = new Date(endTime);
                cleanupEnd.setHours(cleanupEnd.getHours() + 2);
                
                // Check for conflicts with existing surgeries
                const hasConflict = surgeries.some(surgery => {
                  if (surgery.operationTheater.id !== otId) return false;
                  
                  const existingStart = new Date(surgery.scheduledStartTime);
                  const existingEnd = new Date(surgery.scheduledEndTime);
                  const existingCleanupEnd = new Date(existingEnd);
                  existingCleanupEnd.setHours(existingCleanupEnd.getHours() + 2);
                  
                  // Check if times overlap
                  return (startTime < existingCleanupEnd && cleanupEnd > existingStart);
                });
                
                if (hasConflict) {
                  alert('This operation theater is already booked for the selected time (including cleanup time). Please choose a different time or OT.');
                  return;
                }
                
                const surgeryData: CreateSurgeryData = {
                  patientId: formData.get('patientId') as string,
                  primarySurgeonId: formData.get('primarySurgeonId') as string,
                  operationTheaterId: otId,
                  surgeryName: formData.get('surgeryName') as string,
                  surgeryType: formData.get('surgeryType') as 'ELECTIVE' | 'EMERGENCY' | 'DAY_CARE',
                  description: formData.get('description') as string,
                  diagnosis: formData.get('diagnosis') as string,
                  scheduledDate: new Date(scheduledDate).toISOString(),
                  scheduledStartTime: startTime.toISOString(),
                  scheduledEndTime: endTime.toISOString(),
                  estimatedDuration: parseInt(formData.get('estimatedDuration') as string),
                  priority: formData.get('priority') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
                  anesthesiaType: formData.get('anesthesiaType') as 'GENERAL' | 'SPINAL' | 'EPIDURAL' | 'LOCAL' | 'REGIONAL' | 'SEDATION',
                  bloodRequirement: formData.get('bloodRequirement') as string || undefined,
                  specialEquipment: formData.get('specialEquipment') as string || undefined,
                  specialInstructions: formData.get('specialInstructions') as string || undefined,
                  estimatedCost: formData.get('estimatedCost') ? parseFloat(formData.get('estimatedCost') as string) : undefined,
                };

                await createSurgery(surgeryData);
                setShowCreateModal(false);
                
                // Update selected date to match the scheduled surgery date
                setSelectedDate(new Date(scheduledDate));
                
                alert('Surgery scheduled successfully!');
              } catch (error) {
                console.error('Error creating surgery:', error);
                alert('Failed to schedule surgery. Please try again.');
              }
            }} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="patientId"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.patient?.id}>
                        {patient.firstName} {patient.lastName} - {patient.patient?.patientId}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Surgeon Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Surgeon <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="primarySurgeonId"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Surgeon</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.doctor?.id}>
                        Dr. {doctor.firstName} {doctor.lastName} - {doctor.doctor?.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operation Theater */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Operation Theater <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="operationTheaterId"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select OT</option>
                    {operationTheaters.map((ot) => (
                      <option key={ot.id} value={ot.id}>
                        {ot.name} ({ot.type}) - {ot.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Surgery Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Surgery Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="surgeryType"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="DAY_CARE">Day Care</option>
                  </select>
                </div>

                {/* Surgery Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Surgery Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="surgeryName"
                    required
                    placeholder="e.g., Laparoscopic Cholecystectomy"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Diagnosis */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="diagnosis"
                    required
                    placeholder="e.g., Cholelithiasis"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Scheduled Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="scheduledStartTime"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="scheduledEndTime"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedDuration"
                    required
                    min="1"
                    placeholder="e.g., 120"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                {/* Anesthesia Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Anesthesia Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="anesthesiaType"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Anesthesia</option>
                    <option value="GENERAL">General</option>
                    <option value="SPINAL">Spinal</option>
                    <option value="EPIDURAL">Epidural</option>
                    <option value="LOCAL">Local</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="SEDATION">Sedation</option>
                  </select>
                </div>

                {/* Blood Requirement */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blood Requirement
                  </label>
                  <input
                    type="text"
                    name="bloodRequirement"
                    placeholder="e.g., 2 units O+"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="estimatedCost"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    placeholder="Describe the surgery procedure..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Special Equipment */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Equipment
                  </label>
                  <textarea
                    name="specialEquipment"
                    rows={2}
                    placeholder="List any special equipment required..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Special Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="specialInstructions"
                    rows={2}
                    placeholder="Any special instructions for the surgery..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Schedule Surgery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Implementation continues in next file due to length */}
    </div>
    </DashboardLayout>
  );
}
