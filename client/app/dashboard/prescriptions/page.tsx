"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Pill,
  Search,
  Plus,
  Eye,
  Calendar,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: string;
  issuedAt: string;
  diagnosis: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  doctor: {
    specialization: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  items: Array<{
    medication: {
      name: string;
      medicationForm: string;
      strength: string;
    };
    dosage: string;
    frequency: string;
  }>;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState<string>("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [currentPage, filterStatus, debouncedSearchTerm]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `http://localhost:5000/api/v1/prescriptions?page=${currentPage}&limit=10`;
      if (filterStatus !== "ALL") {
        url += `&status=${filterStatus}`;
      }
      if (debouncedSearchTerm) {
        url += `&search=${debouncedSearchTerm}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
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
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      case "DISPENSED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Pill className="h-8 w-8 text-blue-600" />
                Prescriptions
              </h1>
              <p className="text-gray-600 mt-1">
                Manage patient prescriptions and medications
              </p>
            </div>
            {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <Link
                href="/dashboard/prescriptions/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                New Prescription
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by patient name, email, prescription number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="DISPENSED">Dispensed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No prescriptions found
            </h3>
            <p className="text-gray-600 mb-6">
              {userRole === "PATIENT" 
                ? "You don't have any prescriptions yet"
                : "Start by creating a new prescription"
              }
            </p>
            {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <Link
                href="/dashboard/prescriptions/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                Create New Prescription
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/prescriptions/${prescription.id}`)
                }
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-lg font-semibold text-gray-900">
                        {prescription.prescriptionNumber}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                          prescription.status
                        )}`}
                      >
                        {getStatusIcon(prescription.status)}
                        {prescription.status}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(prescription.issuedAt)}
                      </span>
                    </div>
                    {prescription.diagnosis && (
                      <p className="text-gray-700 mb-3">
                        <span className="font-medium">Diagnosis:</span>{" "}
                        {prescription.diagnosis}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/prescriptions/${prescription.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-2"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>

                {/* Medications */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Medications ({prescription.items.length})
                  </h4>
                  <div className="space-y-2">
                    {prescription.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Pill className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.medication.name}
                          </p>
                          <p className="text-gray-600">
                            {item.dosage} • {item.frequency} •{" "}
                            {item.medication.medicationForm} {item.medication.strength}
                          </p>
                        </div>
                      </div>
                    ))}
                    {prescription.items.length > 3 && (
                      <p className="text-sm text-blue-600">
                        +{prescription.items.length - 3} more medications
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Patient:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {prescription.patient.user.firstName}{" "}
                        {prescription.patient.user.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Doctor:</span>{" "}
                      <span className="font-medium text-gray-900">
                        Dr. {prescription.doctor.user.firstName}{" "}
                        {prescription.doctor.user.lastName}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">
                        ({prescription.doctor.specialization})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
