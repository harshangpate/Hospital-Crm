"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  User,
  Stethoscope,
  Activity,
  Loader2,
} from "lucide-react";

interface MedicalRecord {
  id: string;
  recordType: string;
  chiefComplaint: string;
  diagnosis: string;
  createdAt: string;
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
  vitalSigns: any[];
  diagnoses: any[];
}

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    fetchMedicalRecords();
  }, [currentPage, filterType]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `http://localhost:5000/api/v1/medical-records?page=${currentPage}&limit=10`;
      if (filterType !== "ALL") {
        url += `&recordType=${filterType}`;
      }
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMedicalRecords();
  };

  const getRecordTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      CONSULTATION: "bg-blue-100 text-blue-800",
      EMERGENCY: "bg-red-100 text-red-800",
      ADMISSION: "bg-purple-100 text-purple-800",
      SURGERY: "bg-orange-100 text-orange-800",
      LAB_RESULT: "bg-green-100 text-green-800",
      IMAGING: "bg-cyan-100 text-cyan-800",
      VACCINATION: "bg-pink-100 text-pink-800",
      PRESCRIPTION: "bg-indigo-100 text-indigo-800",
      FOLLOW_UP: "bg-yellow-100 text-yellow-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
                <FileText className="h-8 w-8 text-blue-600" />
                Medical Records
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage patient medical records
              </p>
            </div>
            {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <Link
                href="/dashboard/medical-records/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                New Record
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 flex-wrap">
            <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by complaint, diagnosis, or treatment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="ADMISSION">Admission</option>
                <option value="SURGERY">Surgery</option>
                <option value="LAB_RESULT">Lab Result</option>
                <option value="IMAGING">Imaging</option>
                <option value="VACCINATION">Vaccination</option>
                <option value="PRESCRIPTION">Prescription</option>
                <option value="FOLLOW_UP">Follow Up</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No medical records found
            </h3>
            <p className="text-gray-600 mb-6">
              {userRole === "PATIENT" 
                ? "You don't have any medical records yet" 
                : "Start by creating a new medical record"
              }
            </p>
            {(userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <Link
                href="/dashboard/medical-records/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                Create New Record
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/medical-records/${record.id}`)
                }
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRecordTypeColor(
                          record.recordType
                        )}`}
                      >
                        {record.recordType.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {record.chiefComplaint}
                    </h3>
                    <p className="text-gray-700 mb-3">
                      <span className="font-medium">Diagnosis:</span>{" "}
                      {record.diagnosis}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/medical-records/${record.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-2"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Patient:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {record.patient.user.firstName}{" "}
                        {record.patient.user.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Doctor:</span>{" "}
                      <span className="font-medium text-gray-900">
                        Dr. {record.doctor.user.firstName}{" "}
                        {record.doctor.user.lastName}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">
                        ({record.doctor.specialization})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Vitals:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {record.vitalSigns?.length || 0} recorded
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
