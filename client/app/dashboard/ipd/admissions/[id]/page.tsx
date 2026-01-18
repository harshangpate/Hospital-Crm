'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowLeft,
  User,
  Bed,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  IndianRupee,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Admission {
  id: string;
  admissionNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  status: string;
  admissionType: string;
  reasonForAdmission: string;
  primaryDiagnosis?: string;
  dischargeSummary?: string;
  dischargeInstructions?: string;
  estimatedDischarge?: string;
  relativeName?: string;
  relativePhone?: string;
  advancePayment?: number;
  patient: {
    id: string;
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
      city?: string;
      state?: string;
    };
  };
  bed?: {
    id: string;
    bedNumber: string;
    bedType: string;
    ward: {
      id: string;
      wardNumber: string;
      wardName: string;
      wardType: string;
      floor: number;
      chargesPerDay: number;
    };
  };
}

export default function AdmissionDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']}>
      <AdmissionDetails />
    </ProtectedRoute>
  );
}

function AdmissionDetails() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeData, setDischargeData] = useState({
    dischargeSummary: '',
    dischargeInstructions: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAdmission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    // Fetch invoice whenever admission data is loaded
    if (admission) {
      fetchInvoice();
      // Update bed charges for active admissions
      if (admission.status === 'ADMITTED') {
        updateBedCharges();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admission]);

  const fetchAdmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/admissions/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAdmission(result.data);
      } else {
        alert('Failed to fetch admission details');
        router.push('/dashboard/ipd');
      }
    } catch (error) {
      console.error('Error fetching admission:', error);
      alert('An error occurred while fetching admission details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoice = async () => {
    try {
      if (!admission) return;
      
      // Search by admission number in invoice number
      const response = await fetch(
        `http://localhost:5000/api/v1/billing?search=${admission.admissionNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data.invoices && result.data.invoices.length > 0) {
          setInvoice(result.data.invoices[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const updateBedCharges = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/v1/billing/update-bed-charges',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh invoice after updating bed charges
        setTimeout(() => {
          fetchInvoice();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating bed charges:', error);
    }
  };

  const handleDischarge = async () => {
    if (!dischargeData.dischargeSummary) {
      alert('Please provide a discharge summary');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/admissions/${params.id}/discharge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dischargeData),
        }
      );

      if (response.ok) {
        alert('Patient discharged successfully!');
        setShowDischargeModal(false);
        fetchAdmission();
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to discharge patient');
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert('An error occurred while discharging patient');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateStayDuration = () => {
    if (!admission) return 0;
    const start = new Date(admission.admissionDate);
    const end = admission.dischargeDate
      ? new Date(admission.dischargeDate)
      : new Date();
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotalCharges = () => {
    if (!admission?.bed) return 0;
    const days = calculateStayDuration();
    return days * admission.bed.ward.chargesPerDay;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'DISCHARGED':
        return 'bg-green-100 text-green-800';
      case 'TRANSFERRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!admission) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Admission Not Found</h2>
            <Link
              href="/dashboard/ipd"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Back to IPD Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stayDuration = calculateStayDuration();
  const totalCharges = calculateTotalCharges();
  const balanceDue = totalCharges - (admission.advancePayment || 0);

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/ipd"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to IPD Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admission Details</h1>
              <p className="text-gray-600 mt-1">
                Admission #{admission.admissionNumber}
              </p>
            </div>
            <div className="flex items-center space-x-3 flex-wrap">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  admission.status
                )}`}
              >
                {admission.status}
              </span>
              <Link
                href={`/dashboard/ipd/progress-notes/${admission.id}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Progress Notes</span>
              </Link>
              <button
                onClick={() => {
                  fetchAdmission();
                  if (admission) fetchInvoice();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Refresh Billing</span>
              </button>
              {admission.status === 'ADMITTED' && (
                <button
                  onClick={() => setShowDischargeModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Discharge Patient</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient & Admission Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Patient Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold text-gray-800">
                    {admission.patient.user.firstName} {admission.patient.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient ID</p>
                  <p className="font-semibold text-gray-800">{admission.patient.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    {admission.patient.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    {admission.patient.user.phone}
                  </p>
                </div>
                {admission.patient.user.gender && (
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-semibold text-gray-800">
                      {admission.patient.user.gender}
                    </p>
                  </div>
                )}
                {admission.patient.user.dateOfBirth && (
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(admission.patient.user.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {admission.patient.user.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold text-gray-800 flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-1" />
                      {admission.patient.user.address}
                      {admission.patient.user.city && `, ${admission.patient.user.city}`}
                      {admission.patient.user.state && `, ${admission.patient.user.state}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admission Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Admission Details</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Admission Date</p>
                    <p className="font-semibold text-gray-800 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      {new Date(admission.admissionDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Admission Type</p>
                    <p className="font-semibold text-gray-800">{admission.admissionType}</p>
                  </div>
                  {admission.dischargeDate && (
                    <div>
                      <p className="text-sm text-gray-600">Discharge Date</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {new Date(admission.dischargeDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {admission.estimatedDischarge && !admission.dischargeDate && (
                    <div>
                      <p className="text-sm text-gray-600">Estimated Discharge</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {new Date(admission.estimatedDischarge).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Reason for Admission</p>
                  <p className="font-semibold text-gray-800">{admission.reasonForAdmission}</p>
                </div>

                {admission.primaryDiagnosis && (
                  <div>
                    <p className="text-sm text-gray-600">Primary Diagnosis</p>
                    <p className="font-semibold text-gray-800 flex items-start">
                      <Stethoscope className="w-4 h-4 mr-2 text-gray-500 mt-1" />
                      {admission.primaryDiagnosis}
                    </p>
                  </div>
                )}

                {(admission.relativeName || admission.relativePhone) && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {admission.relativeName && (
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-semibold text-gray-800">
                            {admission.relativeName}
                          </p>
                        </div>
                      )}
                      {admission.relativePhone && (
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-semibold text-gray-800 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {admission.relativePhone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {admission.dischargeSummary && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">Discharge Summary</p>
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">
                      {admission.dischargeSummary}
                    </p>
                  </div>
                )}

                {admission.dischargeInstructions && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">Discharge Instructions</p>
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">
                      {admission.dischargeInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bed & Billing Info */}
          <div className="space-y-6">
            {/* Bed Information */}
            {admission.bed && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bed className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Bed Information</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Bed Number</p>
                    <p className="font-semibold text-gray-800 text-lg">
                      {admission.bed.bedNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bed Type</p>
                    <p className="font-semibold text-gray-800">{admission.bed.bedType}</p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">Ward</p>
                    <p className="font-semibold text-gray-800">{admission.bed.ward.wardName}</p>
                    <p className="text-sm text-gray-500">
                      {admission.bed.ward.wardNumber} • Floor {admission.bed.ward.floor}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ward Type</p>
                    <p className="font-semibold text-gray-800">{admission.bed.ward.wardType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Charges per Day</p>
                    <p className="font-semibold text-gray-800 flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {admission.bed.ward.chargesPerDay.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Billing Summary</h2>
              </div>

              {invoice ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <Link
                      href={`/dashboard/billing/${invoice.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Stay Duration</p>
                    <p className="font-semibold text-gray-800">
                      {stayDuration} {stayDuration === 1 ? 'day' : 'days'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-gray-800 flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {invoice.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-green-600">
                    <p className="text-sm">Paid Amount</p>
                    <p className="font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {invoice.paidAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-800">Balance Due</p>
                      <p
                        className={`font-bold text-lg flex items-center ${
                          invoice.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        <IndianRupee className="w-5 h-5" />
                        {invoice.balanceAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          invoice.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : invoice.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.paymentStatus.replace('_', ' ')}
                      </span>
                      <Link
                        href={`/dashboard/billing/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Invoice →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Stay Duration</p>
                    <p className="font-semibold text-gray-800">
                      {stayDuration} {stayDuration === 1 ? 'day' : 'days'}
                    </p>
                  </div>

                  {admission.bed && (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Bed Charges</p>
                        <p className="font-semibold text-gray-800 flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {totalCharges.toLocaleString()}
                        </p>
                      </div>

                      {admission.advancePayment && admission.advancePayment > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <p className="text-sm">Advance Paid</p>
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="w-4 h-4" />
                            {admission.advancePayment.toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800">
                            {balanceDue >= 0 ? 'Balance Due' : 'Excess Payment'}
                          </p>
                          <p
                            className={`font-bold text-lg flex items-center ${
                              balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            <IndianRupee className="w-5 h-5" />
                            {Math.abs(balanceDue).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {admission.status === 'ADMITTED' && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    * Charges update daily. View invoice for latest billing details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discharge Modal */}
        {showDischargeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Discharge Patient</h2>
                  <button
                    onClick={() => setShowDischargeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discharge Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={dischargeData.dischargeSummary}
                      onChange={(e) =>
                        setDischargeData({
                          ...dischargeData,
                          dischargeSummary: e.target.value,
                        })
                      }
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Provide a detailed discharge summary including condition, treatment given, and outcome..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discharge Instructions
                    </label>
                    <textarea
                      value={dischargeData.dischargeInstructions}
                      onChange={(e) =>
                        setDischargeData({
                          ...dischargeData,
                          dischargeInstructions: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Medications, follow-up appointments, activity restrictions, diet, etc..."
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Once discharged, the assigned bed will be freed and
                      made available for other patients. This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowDischargeModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDischarge}
                      disabled={submitting || !dischargeData.dischargeSummary}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{submitting ? 'Discharging...' : 'Discharge Patient'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
