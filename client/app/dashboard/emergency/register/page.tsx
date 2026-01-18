'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Search,
  UserPlus,
  Ambulance,
  User,
  AlertCircle,
  Clock,
  Phone,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { registerEmergencyVisit } from '@/lib/api/emergency';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function EmergencyRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [registrationType, setRegistrationType] = useState<'existing' | 'new'>('existing');

  const [formData, setFormData] = useState({
    // Patient details (for new patient)
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    phone: '',
    email: '',
    address: '',
    
    // Emergency specific
    modeOfArrival: 'WALK_IN' as 'WALK_IN' | 'AMBULANCE' | 'POLICE' | 'REFERRED' | 'OTHER',
    chiefComplaint: '',
    briefHistory: '',
    accompanyingPerson: '',
    accompanyingContact: '',
    referredBy: '',
  });

  // Search existing patients
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { query: searchQuery, role: 'PATIENT' },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search patients');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chiefComplaint.trim()) {
      alert('Chief complaint is required');
      return;
    }

    if (registrationType === 'existing' && !selectedPatient) {
      alert('Please select a patient');
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        modeOfArrival: formData.modeOfArrival,
        chiefComplaint: formData.chiefComplaint,
        briefHistory: formData.briefHistory,
        accompanyingPerson: formData.accompanyingPerson,
        accompanyingContact: formData.accompanyingContact,
        referredBy: formData.referredBy,
      };

      if (registrationType === 'existing') {
        data.patientId = selectedPatient.patient.id;
      } else {
        data.firstName = formData.firstName;
        data.lastName = formData.lastName;
        data.dateOfBirth = formData.dateOfBirth;
        data.gender = formData.gender;
        data.phone = formData.phone;
        data.email = formData.email;
        data.address = formData.address;
      }

      const response = await registerEmergencyVisit(data);

      alert('Emergency visit registered successfully!');
      router.push(`/dashboard/emergency/triage/${response.data.data.id}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Failed to register emergency visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-600" />
            Emergency Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quick patient registration for emergency department
          </p>
        </motion.div>

        {/* Registration Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setRegistrationType('existing');
                setSelectedPatient(null);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                registrationType === 'existing'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <User className="w-5 h-5 inline-block mr-2" />
              Existing Patient
            </button>
            <button
              onClick={() => {
                setRegistrationType('new');
                setSelectedPatient(null);
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                registrationType === 'new'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <UserPlus className="w-5 h-5 inline-block mr-2" />
              New Patient
            </button>
          </div>

          {/* Existing Patient Search */}
          {registrationType === 'existing' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, phone, or patient ID..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map((result: any) => (
                    <div
                      key={result.id}
                      onClick={() => handleSelectPatient(result)}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {result.firstName} {result.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {result.patient?.patientId} • {result.phone || 'No phone'} • {result.gender}
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Patient */}
              {selectedPatient && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-300">
                        Selected Patient
                      </p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedPatient.patient?.patientId} • {selectedPatient.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Patient Form */}
          {registrationType === 'new' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Emergency Details Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              Emergency Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mode of Arrival *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['WALK_IN', 'AMBULANCE', 'POLICE', 'REFERRED', 'OTHER'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleInputChange('modeOfArrival', mode)}
                    className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                      formData.modeOfArrival === mode
                        ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-red-400'
                    }`}
                  >
                    {mode === 'AMBULANCE' && <Ambulance className="w-5 h-5 mx-auto mb-1" />}
                    <span className="text-sm">{mode.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chief Complaint *
              </label>
              <input
                type="text"
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                required
                placeholder="e.g., Chest pain, Shortness of breath, Trauma..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brief History
              </label>
              <textarea
                value={formData.briefHistory}
                onChange={(e) => handleInputChange('briefHistory', e.target.value)}
                rows={3}
                placeholder="Brief description of the condition..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accompanying Person
                </label>
                <input
                  type="text"
                  value={formData.accompanyingPerson}
                  onChange={(e) => handleInputChange('accompanyingPerson', e.target.value)}
                  placeholder="Name of relative/friend"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.accompanyingContact}
                  onChange={(e) => handleInputChange('accompanyingContact', e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referred By
              </label>
              <input
                type="text"
                value={formData.referredBy}
                onChange={(e) => handleInputChange('referredBy', e.target.value)}
                placeholder="Doctor/Hospital name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Register & Start Triage
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
}
