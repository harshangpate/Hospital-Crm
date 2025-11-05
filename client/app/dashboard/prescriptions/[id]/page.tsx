"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  Pill,
  User,
  Calendar,
  Stethoscope,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  RefreshCw,
  Loader2,
  FileDown,
  Edit,
} from "lucide-react";

interface PrescriptionDetail {
  id: string;
  prescriptionNumber: string;
  status: string;
  diagnosis: string;
  notes: string;
  refillsAllowed: number;
  refillsUsed: number;
  validUntil: string | null;
  issuedAt: string;
  dispensedAt: string | null;
  dispensedBy: string | null;
  pharmacyNotes: string | null;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      gender: string;
    };
    allergiesList: Array<{
      id: string;
      allergen: string;
      severity: string;
      reaction: string;
    }>;
  };
  doctor: {
    specialization: string;
    qualification: string;
    licenseNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  items: Array<{
    id: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    route: string;
    instructions: string;
    medication: {
      id: string;
      name: string;
      genericName: string;
      medicationForm: string;
      strength: string;
      category: string;
      sideEffects: string;
      warnings: string;
    };
  }>;
  medicalRecord: {
    chiefComplaint: string;
    diagnosis: string;
  } | null;
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refillLoading, setRefillLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [params.id]);

  const fetchPrescriptionDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/prescriptions/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPrescription(data.data);
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPrescription = async () => {
    if (!confirm("Are you sure you want to cancel this prescription? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/prescriptions/${params.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Prescription cancelled successfully");
        fetchPrescriptionDetails();
      } else {
        alert(data.message || "Failed to cancel prescription");
      }
    } catch (error) {
      console.error("Error cancelling prescription:", error);
      alert("Failed to cancel prescription");
    }
  };

  const handleRefillRequest = async () => {
    if (!confirm("Request a refill for this prescription?")) return;

    try {
      setRefillLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/prescriptions/${params.id}/refill`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Refill requested successfully!");
        fetchPrescriptionDetails();
      } else {
        alert(data.message || "Failed to request refill");
      }
    } catch (error) {
      console.error("Error requesting refill:", error);
      alert("Failed to request refill");
    } finally {
      setRefillLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/prescriptions/${params.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${prescription?.prescriptionNumber || params.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: "bg-gray-100 text-gray-800",
      ISSUED: "bg-blue-100 text-blue-800",
      DISPENSED: "bg-green-100 text-green-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5" />;
      case "CANCELLED":
        return <XCircle className="h-5 w-5" />;
      case "DISPENSED":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      MILD: "bg-green-100 text-green-800",
      MODERATE: "bg-yellow-100 text-yellow-800",
      SEVERE: "bg-red-100 text-red-800",
      LIFE_THREATENING: "bg-red-200 text-red-900",
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!prescription) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Prescription not found
            </h1>
            <Link
              href="/dashboard/prescriptions"
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Prescriptions
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
            {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <>
                {prescription.status === "ISSUED" && (
                  <>
                    <button
                      onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}/edit`)}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleCancelPrescription}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Prescription
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prescription Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-mono mb-2">
                    {prescription.prescriptionNumber}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(
                        prescription.status
                      )}`}
                    >
                      {getStatusIcon(prescription.status)}
                      {prescription.status}
                    </span>
                    <span className="text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Issued: {formatDate(prescription.issuedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              {prescription.diagnosis && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Diagnosis
                  </h3>
                  <p className="text-blue-800">{prescription.diagnosis}</p>
                </div>
              )}

              {/* Medications List */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Pill className="h-6 w-6 text-blue-600" />
                  Medications ({prescription.items.length})
                </h2>
                <div className="space-y-4">
                  {prescription.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {index + 1}. {item.medication.name}
                          </h3>
                          {item.medication.genericName && (
                            <p className="text-sm text-gray-600">
                              Generic: {item.medication.genericName}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {item.medication.medicationForm}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Strength</p>
                          <p className="font-medium text-gray-900">
                            {item.medication.strength}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Dosage</p>
                          <p className="font-medium text-gray-900">{item.dosage}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Frequency</p>
                          <p className="font-medium text-gray-900">{item.frequency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900">{item.duration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Route</p>
                          <p className="font-medium text-gray-900">{item.route}</p>
                        </div>
                      </div>

                      {item.instructions && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm font-medium text-yellow-900">
                            Instructions:
                          </p>
                          <p className="text-sm text-yellow-800">{item.instructions}</p>
                        </div>
                      )}

                      {item.medication.warnings && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs font-semibold text-red-900 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Warnings:
                          </p>
                          <p className="text-xs text-red-800">
                            {item.medication.warnings}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {prescription.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Additional Notes
                  </h3>
                  <p className="text-gray-700 p-4 bg-gray-50 rounded-lg">
                    {prescription.notes}
                  </p>
                </div>
              )}

              {/* Dispensing Info */}
              {prescription.dispensedAt && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">
                        Dispensed on {formatDateTime(prescription.dispensedAt)}
                      </p>
                      {prescription.dispensedBy && (
                        <p className="text-sm text-green-700">
                          By: {prescription.dispensedBy}
                        </p>
                      )}
                      {prescription.pharmacyNotes && (
                        <p className="text-sm text-green-700 mt-1">
                          Notes: {prescription.pharmacyNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Refill Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Refill Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Refills Allowed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescription.refillsAllowed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Refills Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescription.refillsUsed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Refills Remaining</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {prescription.refillsAllowed - prescription.refillsUsed}
                  </p>
                </div>
                {prescription.validUntil && (
                  <div>
                    <p className="text-sm text-gray-600">Valid Until</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(prescription.validUntil)}
                    </p>
                  </div>
                )}
              </div>
              {prescription.refillsUsed < prescription.refillsAllowed &&
                prescription.status !== "CANCELLED" && (
                  <button
                    onClick={handleRefillRequest}
                    disabled={refillLoading}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {refillLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Request Refill
                      </>
                    )}
                  </button>
                )}
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Patient Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {prescription.patient.user.firstName}{" "}
                    {prescription.patient.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(prescription.patient.user.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium text-gray-900">
                    {prescription.patient.user.gender}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="text-sm text-gray-900">
                    {prescription.patient.user.email}
                  </p>
                  <p className="text-sm text-gray-900">
                    {prescription.patient.user.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Prescriber Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    Dr. {prescription.doctor.user.firstName}{" "}
                    {prescription.doctor.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Specialization</p>
                  <p className="font-medium text-gray-900">
                    {prescription.doctor.specialization}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Qualification</p>
                  <p className="font-medium text-gray-900">
                    {prescription.doctor.qualification}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">License Number</p>
                  <p className="font-medium text-gray-900">
                    {prescription.doctor.licenseNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Allergies */}
            {prescription.patient.allergiesList &&
              prescription.patient.allergiesList.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Patient Allergies
                  </h3>
                  <div className="space-y-2">
                    {prescription.patient.allergiesList.map((allergy) => (
                      <div
                        key={allergy.id}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="font-medium text-red-900">{allergy.allergen}</p>
                        <p className="text-sm text-red-700">{allergy.reaction}</p>
                        <span
                          className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                            allergy.severity
                          )}`}
                        >
                          {allergy.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Medical Record Link */}
            {prescription.medicalRecord && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Related Medical Record
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {prescription.medicalRecord.chiefComplaint}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {prescription.medicalRecord.diagnosis}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
