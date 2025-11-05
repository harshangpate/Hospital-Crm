"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Stethoscope,
  Activity,
  AlertTriangle,
  FileDown,
  Edit,
  Pill,
  Loader2,
} from "lucide-react";

interface MedicalRecordDetail {
  id: string;
  recordType: string;
  chiefComplaint: string;
  presentIllness: string;
  examination: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
  patient: {
    bloodGroup: string;
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
    medicalHistory: Array<{
      id: string;
      condition: string;
      conditionType: string;
    }>;
  };
  doctor: {
    specialization: string;
    qualification: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  vitalSigns: Array<{
    id: string;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
    weight: number;
    height: number;
    recordedAt: string;
  }>;
  diagnoses: Array<{
    id: string;
    diagnosisName: string;
    icdCode: string;
    severity: string;
    status: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    documentType: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  prescriptions: Array<{
    id: string;
    prescriptionNumber: string;
    status: string;
    items: Array<{
      medication: {
        name: string;
        dosage: string;
      };
      dosage: string;
      frequency: string;
      duration: string;
    }>;
  }>;
}

export default function MedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchRecordDetails();
  }, [params.id]);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/medical-records/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setRecord(data.data);
      }
    } catch (error) {
      console.error("Error fetching record details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!confirm("Are you sure you want to delete this medical record? This action cannot be undone and will permanently remove all associated data.")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/medical-records/${params.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Medical record deleted successfully");
        router.push("/dashboard/medical-records");
      } else {
        alert(data.message || "Failed to delete medical record");
      }
    } catch (error) {
      console.error("Error deleting medical record:", error);
      alert("Failed to delete medical record");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/medical-records/${params.id}/download`,
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
        a.download = `medical-record-${params.id}.pdf`;
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

  if (!record) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Record not found
            </h1>
            <Link
              href="/dashboard/medical-records"
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Medical Records
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
                <button
                  onClick={() => router.push(`/dashboard/medical-records/${record.id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                  Edit Record
                </button>
                <button
                  onClick={handleDeleteRecord}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Delete Record
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Record Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full mb-2">
                    {record.recordType.replace("_", " ")}
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {record.chiefComplaint}
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(record.createdAt)}
                  </p>
                </div>
              </div>

              {/* Present Illness */}
              {record.presentIllness && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Present Illness
                  </h3>
                  <p className="text-gray-700">{record.presentIllness}</p>
                </div>
              )}

              {/* Examination */}
              {record.examination && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Examination
                  </h3>
                  <p className="text-gray-700">{record.examination}</p>
                </div>
              )}

              {/* Diagnosis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Diagnosis
                </h3>
                <p className="text-gray-700 mb-3">{record.diagnosis}</p>
                {record.diagnoses && record.diagnoses.length > 0 && (
                  <div className="space-y-2">
                    {record.diagnoses.map((diag) => (
                      <div
                        key={diag.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {diag.diagnosisName}
                          </p>
                          {diag.icdCode && (
                            <p className="text-sm text-gray-600">
                              ICD-10: {diag.icdCode}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                              diag.severity
                            )}`}
                          >
                            {diag.severity}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">
                            {diag.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Treatment */}
              {record.treatment && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Treatment Plan
                  </h3>
                  <p className="text-gray-700">{record.treatment}</p>
                </div>
              )}

              {/* Notes */}
              {record.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Additional Notes
                  </h3>
                  <p className="text-gray-700">{record.notes}</p>
                </div>
              )}

              {/* Follow Up */}
              {record.followUpDate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        Follow-up Scheduled
                      </p>
                      <p className="text-sm text-blue-700">
                        {formatDate(record.followUpDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vital Signs */}
            {record.vitalSigns && record.vitalSigns.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Vital Signs
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {record.vitalSigns[0].bloodPressureSystolic && (
                    <div className="p-6 bg-linear-to-br from-red-100 to-red-200 rounded-xl border border-red-300 shadow-md">
                      <p className="text-sm font-medium text-red-800 mb-2">Blood Pressure</p>
                      <p className="text-3xl font-bold text-red-900 mb-1">
                        {record.vitalSigns[0].bloodPressureSystolic}/
                        {record.vitalSigns[0].bloodPressureDiastolic}
                      </p>
                      <p className="text-xs text-red-700 font-medium">mmHg</p>
                    </div>
                  )}
                  {record.vitalSigns[0].heartRate && (
                    <div className="p-6 bg-linear-to-br from-pink-100 to-pink-200 rounded-xl border border-pink-300 shadow-md">
                      <p className="text-sm font-medium text-pink-800 mb-2">Heart Rate</p>
                      <p className="text-3xl font-bold text-pink-900 mb-1">
                        {record.vitalSigns[0].heartRate}
                      </p>
                      <p className="text-xs text-pink-700 font-medium">bpm</p>
                    </div>
                  )}
                  {record.vitalSigns[0].temperature && (
                    <div className="p-6 bg-linear-to-br from-orange-100 to-orange-200 rounded-xl border border-orange-300 shadow-md">
                      <p className="text-sm font-medium text-orange-800 mb-2">Temperature</p>
                      <p className="text-3xl font-bold text-orange-900 mb-1">
                        {record.vitalSigns[0].temperature}
                      </p>
                      <p className="text-xs text-orange-700 font-medium">°F</p>
                    </div>
                  )}
                  {record.vitalSigns[0].oxygenSaturation && (
                    <div className="p-6 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300 shadow-md">
                      <p className="text-sm font-medium text-blue-800 mb-2">SpO2</p>
                      <p className="text-3xl font-bold text-blue-900 mb-1">
                        {record.vitalSigns[0].oxygenSaturation}
                      </p>
                      <p className="text-xs text-blue-700 font-medium">%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prescriptions */}
            {record.prescriptions && record.prescriptions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Pill className="h-6 w-6 text-blue-600" />
                  Prescriptions
                </h2>
                <div className="space-y-3">
                  {record.prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/dashboard/prescriptions/${prescription.id}`
                        )
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">
                          {prescription.prescriptionNumber}
                        </p>
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          {prescription.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {prescription.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            • {item.medication.name} - {item.dosage} -{" "}
                            {item.frequency} for {item.duration}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    {record.patient.user.firstName}{" "}
                    {record.patient.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(record.patient.user.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium text-gray-900">
                    {record.patient.user.gender}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Blood Group</p>
                  <p className="font-medium text-gray-900">
                    {record.patient.bloodGroup?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="text-sm text-gray-900">
                    {record.patient.user.email}
                  </p>
                  <p className="text-sm text-gray-900">
                    {record.patient.user.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Doctor Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    Dr. {record.doctor.user.firstName}{" "}
                    {record.doctor.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Specialization</p>
                  <p className="font-medium text-gray-900">
                    {record.doctor.specialization}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Qualification</p>
                  <p className="font-medium text-gray-900">
                    {record.doctor.qualification}
                  </p>
                </div>
              </div>
            </div>

            {/* Allergies */}
            {record.patient.allergiesList &&
              record.patient.allergiesList.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Active Allergies
                  </h3>
                  <div className="space-y-2">
                    {record.patient.allergiesList.map((allergy) => (
                      <div
                        key={allergy.id}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="font-medium text-red-900">
                          {allergy.allergen}
                        </p>
                        <p className="text-sm text-red-700">
                          {allergy.reaction}
                        </p>
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

            {/* Documents */}
            {record.documents && record.documents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documents
                </h3>
                <div className="space-y-2">
                  {record.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                      <FileDown className="h-4 w-4 text-blue-600" />
                    </a>
                  ))}
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
