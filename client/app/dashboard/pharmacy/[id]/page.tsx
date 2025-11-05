'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Pill, User, FileText, Package, AlertCircle } from 'lucide-react';

interface PrescriptionItem {
  id: string;
  medication: {
    id: string;
    genericName: string;
    brandName: string;
    currentStock: number;
  };
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route: string;
  instructions: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: string;
  diagnosis: string;
  notes: string;
  issuedAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
  patient: {
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  doctor: {
    specialization: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  items: PrescriptionItem[];
}

export default function PrescriptionDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'PHARMACIST']}>
      <PrescriptionDetail />
    </ProtectedRoute>
  );
}

function PrescriptionDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [pharmacistName, setPharmacistName] = useState('');

  useEffect(() => {
    fetchPrescription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/prescriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPrescription(data.data);
      } else {
        alert('Failed to load prescription');
        router.push('/dashboard/pharmacy');
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      alert('Error loading prescription');
      router.push('/dashboard/pharmacy');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!pharmacistName.trim()) {
      alert('Please enter pharmacist name');
      return;
    }

    // Check if all medications have sufficient stock
    const insufficientStock = prescription?.items.filter(
      (item) => item.medication.currentStock < item.quantity
    );

    if (insufficientStock && insufficientStock.length > 0) {
      alert(
        `Insufficient stock for: ${insufficientStock.map((item) => item.medication.brandName || item.medication.genericName).join(', ')}`
      );
      return;
    }

    if (!confirm('Are you sure you want to dispense this prescription?')) {
      return;
    }

    try {
      setDispensing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/pharmacy/prescriptions/${id}/dispense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dispensedBy: pharmacistName }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Prescription dispensed successfully!');
        router.push('/dashboard/pharmacy');
      } else {
        alert(data.message || 'Failed to dispense prescription');
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      alert('Error dispensing prescription');
    } finally {
      setDispensing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading prescription...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!prescription) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Prescription Not Found</h2>
            <button
              onClick={() => router.push('/dashboard/pharmacy')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Pharmacy
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isDispensed = prescription.status === 'DISPENSED';

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/pharmacy')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Pharmacy
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Prescription Details
              </h1>
              <p className="text-gray-600 mt-1">
                {prescription.prescriptionNumber}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                isDispensed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {prescription.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient & Doctor Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">
                    {prescription.patient.user.firstName} {prescription.patient.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-medium text-gray-800">{prescription.patient.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{prescription.patient.user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{prescription.patient.user.email}</p>
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Prescribed By</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="font-medium text-gray-800">
                    Dr. {prescription.doctor.user.firstName} {prescription.doctor.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="font-medium text-gray-800">{prescription.doctor.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issued Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(prescription.issuedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Dispensing Information */}
            {isDispensed && (
              <div className="bg-green-50 rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Package className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">Dispensing Information</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Dispensed By</p>
                    <p className="font-medium text-gray-800">{prescription.dispensedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dispensed At</p>
                    <p className="font-medium text-gray-800">
                      {prescription.dispensedAt
                        ? new Date(prescription.dispensedAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Prescription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diagnosis & Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Clinical Information</h2>
              <div className="space-y-4">
                {prescription.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                    <p className="text-gray-800">{prescription.diagnosis}</p>
                  </div>
                )}
                {prescription.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-800">{prescription.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Medications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Pill className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Medications</h2>
              </div>
              <div className="space-y-4">
                {prescription.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${
                      item.medication.currentStock < item.quantity
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {index + 1}. {item.medication.brandName || item.medication.genericName}
                        </h3>
                        {item.medication.brandName && (
                          <p className="text-sm text-gray-500">
                            Generic: {item.medication.genericName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Current Stock</p>
                        <p
                          className={`font-semibold ${
                            item.medication.currentStock < item.quantity
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {item.medication.currentStock} units
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Dosage</p>
                        <p className="font-medium text-gray-800">{item.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Frequency</p>
                        <p className="font-medium text-gray-800">{item.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium text-gray-800">{item.duration}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="font-medium text-gray-800">{item.quantity} units</p>
                      </div>
                    </div>
                    {item.route && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Route</p>
                        <p className="text-sm text-gray-800">{item.route}</p>
                      </div>
                    )}
                    {item.instructions && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Instructions</p>
                        <p className="text-sm text-gray-800">{item.instructions}</p>
                      </div>
                    )}
                    {item.medication.currentStock < item.quantity && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Insufficient stock! Need {item.quantity - item.medication.currentStock} more units
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dispense Section */}
            {!isDispensed && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Dispense Prescription</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pharmacist Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pharmacistName}
                      onChange={(e) => setPharmacistName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <button
                    onClick={handleDispense}
                    disabled={dispensing || !pharmacistName.trim()}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {dispensing ? 'Dispensing...' : 'Dispense Prescription'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
