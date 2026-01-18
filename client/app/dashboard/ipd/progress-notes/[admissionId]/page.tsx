'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  ArrowLeft,
  FileText,
  Plus,
  Edit,
  Trash2,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface ProgressNote {
  id: string;
  admissionId: string;
  patientId: string;
  doctorId: string;
  noteDate: string;
  subjective: string | null;
  objective: string | null;
  assessment: string;
  plan: string;
  noteType: string;
  priority: string;
  isPrivate: boolean;
  tags: string | null;
  createdAt: string;
  createdBy: string;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
}

interface Admission {
  admissionNumber: string;
  admissionDate: string;
  status: string;
  patientId: string;
  patient: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function ProgressNotesPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([]);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<ProgressNote | null>(null);
  
  // Filters
  const [noteTypeFilter, setNoteTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Form fields
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [noteType, setNoteType] = useState('DAILY');
  const [priority, setPriority] = useState('ROUTINE');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token && params.admissionId) {
      fetchAdmission();
      fetchProgressNotes();
    }
  }, [token, params.admissionId, noteTypeFilter, priorityFilter]);

  const fetchAdmission = async () => {
    try {
      console.log('Fetching admission:', params.admissionId);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/admissions/${params.admissionId}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admissions/${params.admissionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setAdmission(data.data);
        console.log('Admission loaded successfully:', data.data);
      } else {
        console.error('Failed to fetch admission:', data.message);
        alert(`Failed to load admission: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching admission:', error);
      alert('Failed to load admission data. Please check console for details.');
    }
  };

  const fetchProgressNotes = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (noteTypeFilter) queryParams.append('noteType', noteTypeFilter);
      if (priorityFilter) queryParams.append('priority', priorityFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/progress-notes/admission/${params.admissionId}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setProgressNotes(data.data);
      } else {
        console.error('Failed to fetch progress notes:', data.message);
      }
    } catch (error) {
      console.error('Error fetching progress notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assessment || !plan) {
      alert('Assessment and Plan are required (SOAP format)');
      return;
    }

    if (!admission?.patientId) {
      alert('Patient information not loaded. Please refresh the page.');
      return;
    }

    try {
      setSubmitting(true);

      const url = editingNote
        ? `${process.env.NEXT_PUBLIC_API_URL}/progress-notes/${editingNote.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/progress-notes`;

      const method = editingNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admissionId: params.admissionId,
          patientId: admission.patientId,
          subjective: subjective || null,
          objective: objective || null,
          assessment,
          plan,
          noteType,
          priority,
          isPrivate,
          tags: tags || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingNote ? 'Progress note updated successfully!' : 'Progress note created successfully!');
        resetForm();
        setShowForm(false);
        setEditingNote(null);
        fetchProgressNotes();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error submitting progress note:', error);
      alert('Failed to submit progress note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (note: ProgressNote) => {
    setEditingNote(note);
    setSubjective(note.subjective || '');
    setObjective(note.objective || '');
    setAssessment(note.assessment);
    setPlan(note.plan);
    setNoteType(note.noteType);
    setPriority(note.priority);
    setTags(note.tags || '');
    setIsPrivate(note.isPrivate);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this progress note?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/progress-notes/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Progress note deleted successfully!');
        fetchProgressNotes();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting progress note:', error);
      alert('Failed to delete progress note');
    }
  };

  const resetForm = () => {
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setNoteType('DAILY');
    setPriority('ROUTINE');
    setTags('');
    setIsPrivate(false);
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      ROUTINE: 'bg-blue-100 text-blue-800',
      URGENT: 'bg-yellow-100 text-yellow-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || colors.ROUTINE;
  };

  const getNoteTypeBadge = (type: string) => {
    const colors = {
      DAILY: 'bg-green-100 text-green-800',
      ADMISSION: 'bg-purple-100 text-purple-800',
      DISCHARGE: 'bg-orange-100 text-orange-800',
      CONSULTATION: 'bg-teal-100 text-teal-800',
      EMERGENCY: 'bg-red-100 text-red-800',
    };
    return colors[type as keyof typeof colors] || colors.DAILY;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <Link
              href={`/dashboard/ipd/admissions/${params.admissionId}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Admission
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  Progress Notes (SOAP Format)
                </h1>
                <p className="text-gray-600 mt-2">
                  Subjective, Objective, Assessment, Plan - Daily patient progress documentation
                </p>
                {admission && (
                  <p className="text-sm text-gray-500 mt-1">
                    Patient: {admission.patient.user.firstName} {admission.patient.user.lastName} | 
                    Admission: {admission.admissionNumber}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  if (showForm) {
                    resetForm();
                    setEditingNote(null);
                  }
                }}
                disabled={!admission}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={!admission ? 'Loading admission data...' : 'Add new progress note'}
              >
                <Plus className="h-5 w-5" />
                {showForm ? 'Cancel' : 'Add New Note'}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingNote ? 'Edit Progress Note' : 'New Progress Note'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Type *
                  </label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="ADMISSION">Admission</option>
                    <option value="DISCHARGE">Discharge</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* SOAP Format Fields */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-gray-900">SOAP Format</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjective (S) - Patient's complaints, symptoms
                  </label>
                  <textarea
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    rows={3}
                    placeholder="What the patient says... complaints, symptoms, feelings"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objective (O) - Observable findings, examination results
                  </label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={3}
                    placeholder="Physical examination findings, vital signs, lab results, imaging..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment (A) - Doctor's diagnosis, analysis * REQUIRED
                  </label>
                  <textarea
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    rows={3}
                    required
                    placeholder="Diagnosis, clinical impression, analysis of condition..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan (P) - Treatment plan, orders * REQUIRED
                  </label>
                  <textarea
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    rows={3}
                    required
                    placeholder="Treatment plan, medications, procedures, follow-up instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., fever, pneumonia, follow-up"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Mark as private (restricted access)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                    setEditingNote(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Type
                </label>
                <select
                  value={noteTypeFilter}
                  onChange={(e) => setNoteTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="DAILY">Daily</option>
                  <option value="ADMISSION">Admission</option>
                  <option value="DISCHARGE">Discharge</option>
                  <option value="CONSULTATION">Consultation</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Progress Notes Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Notes Timeline</h2>
            
            {progressNotes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No progress notes found for this admission.</p>
                <p className="text-sm mt-2">Click "Add New Note" to create the first progress note.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {progressNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNoteTypeBadge(note.noteType)}`}>
                              {note.noteType}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(note.priority)}`}>
                              {note.priority}
                            </span>
                            {note.isPrivate && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Private
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(note.noteDate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(note)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Edit note"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete note"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* SOAP Format Display */}
                    <div className="space-y-4">
                      {note.subjective && (
                        <div className="relative">
                          <div className="text-sm font-bold text-sky-700 dark:text-sky-400 mb-2 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-2.5 py-1 rounded-md shadow-sm font-semibold">S</span>
                            Subjective - Patient's Complaints
                          </div>
                          <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-l-4 border-sky-500 dark:border-sky-400 p-4 rounded-lg shadow-sm">
                            {note.subjective}
                          </div>
                        </div>
                      )}

                      {note.objective && (
                        <div className="relative">
                          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2.5 py-1 rounded-md shadow-sm font-semibold">O</span>
                            Objective - Clinical Findings
                          </div>
                          <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-l-4 border-emerald-500 dark:border-emerald-400 p-4 rounded-lg shadow-sm">
                            {note.objective}
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <div className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-2.5 py-1 rounded-md shadow-sm font-semibold">A</span>
                          Assessment - Diagnosis
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-l-4 border-orange-500 dark:border-orange-400 p-4 rounded-lg shadow-sm">
                          {note.assessment}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="text-sm font-bold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-2.5 py-1 rounded-md shadow-sm font-semibold">P</span>
                          Plan - Treatment & Orders
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-l-4 border-violet-500 dark:border-violet-400 p-4 rounded-lg shadow-sm">
                          {note.plan}
                        </div>
                      </div>
                    </div>

                    {note.tags && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Tags:</span>
                        {note.tags.split(',').map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {note.lastEditedAt && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last edited: {new Date(note.lastEditedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
