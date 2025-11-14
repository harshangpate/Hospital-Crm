'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Package,
  FileBarChart,
  Filter,
  RefreshCw,
  Printer,
  Mail,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  category: string;
}

interface ReportStats {
  totalRevenue: number;
  totalPatients: number;
  totalAppointments: number;
  totalPrescriptions: number;
  pendingPayments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  lowStockItems: number;
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'DOCTOR']}>
      <ReportsContent />
    </ProtectedRoute>
  );
}

function ReportsContent() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
    pendingPayments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    lowStockItems: 0,
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    setLoading(true);
    try {
      // Fetch various stats from different endpoints
      const [invoicesRes, appointmentsRes, prescriptionsRes, patientsRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/invoices?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('http://localhost:5000/api/v1/appointments?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('http://localhost:5000/api/v1/prescriptions?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('http://localhost:5000/api/v1/users?role=PATIENT&limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      // Handle invoices data for revenue
      let totalRevenue = 0;
      let pendingPayments = 0;
      if (invoicesRes && invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        if (invoicesData.success && Array.isArray(invoicesData.data)) {
          totalRevenue = invoicesData.data.reduce(
            (sum: number, inv: any) => sum + (inv.totalAmount || 0),
            0
          );
          pendingPayments = invoicesData.data
            .filter((inv: any) => inv.paymentStatus !== 'PAID')
            .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
        }
      }

      // Handle appointments data
      if (appointmentsRes && appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        if (appointmentsData.success && Array.isArray(appointmentsData.data)) {
          const appointments = appointmentsData.data;
          const completed = appointments.filter((a: { status: string }) => a.status === 'COMPLETED').length;
          const cancelled = appointments.filter((a: { status: string }) => a.status === 'CANCELLED').length;
          setStats((prev) => ({
            ...prev,
            totalAppointments: appointments.length,
            completedAppointments: completed,
            cancelledAppointments: cancelled,
          }));
        }
      }

      // Handle prescriptions data
      let totalPatients = 0;
      if (prescriptionsRes && prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        if (prescriptionsData.success && Array.isArray(prescriptionsData.data)) {
          setStats((prev) => ({
            ...prev,
            totalPrescriptions: prescriptionsData.data.length,
          }));
        }
      }

      // Handle patients data
      if (patientsRes && patientsRes.ok) {
        const patientsData = await patientsRes.json();
        if (patientsData.success) {
          const patients = Array.isArray(patientsData.data) ? patientsData.data : (patientsData.data.users || []);
          totalPatients = patients.length;
        }
      }

      // Update stats with real data
      setStats((prev) => ({
        ...prev,
        totalRevenue,
        totalPatients,
        pendingPayments,
        lowStockItems: 12, // This would come from inventory endpoint
      }));
    } catch (error) {
      console.error('Error fetching report stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportCategories = [
    {
      id: 'overview',
      name: 'Overview',
      icon: BarChart3,
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: DollarSign,
    },
    {
      id: 'clinical',
      name: 'Clinical',
      icon: Activity,
    },
    {
      id: 'operational',
      name: 'Operational',
      icon: FileBarChart,
    },
  ];

  const financialReports: ReportCard[] = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Detailed breakdown of revenue by services, departments, and time periods',
      icon: DollarSign,
      color: 'bg-green-500',
      category: 'financial',
    },
    {
      id: 'invoices',
      title: 'Invoice Summary',
      description: 'All invoices with payment status, outstanding amounts, and collection rates',
      icon: FileText,
      color: 'bg-blue-500',
      category: 'financial',
    },
    {
      id: 'payments',
      title: 'Payment Report',
      description: 'Payment methods, transaction history, and payment trends',
      icon: CheckCircle2,
      color: 'bg-purple-500',
      category: 'financial',
    },
    {
      id: 'expenses',
      title: 'Expense Report',
      description: 'Track operational expenses, inventory costs, and overhead',
      icon: TrendingUp,
      color: 'bg-orange-500',
      category: 'financial',
    },
  ];

  const clinicalReports: ReportCard[] = [
    {
      id: 'patients',
      title: 'Patient Demographics',
      description: 'Patient statistics by age, gender, location, and visit frequency',
      icon: Users,
      color: 'bg-indigo-500',
      category: 'clinical',
    },
    {
      id: 'appointments',
      title: 'Appointment Analytics',
      description: 'Appointment trends, no-show rates, and doctor utilization',
      icon: Calendar,
      color: 'bg-cyan-500',
      category: 'clinical',
    },
    {
      id: 'prescriptions',
      title: 'Prescription Report',
      description: 'Medication prescribing patterns and prescription volumes',
      icon: FileText,
      color: 'bg-pink-500',
      category: 'clinical',
    },
    {
      id: 'diagnosis',
      title: 'Diagnosis Report',
      description: 'Common diagnoses, disease prevalence, and health trends',
      icon: Activity,
      color: 'bg-red-500',
      category: 'clinical',
    },
  ];

  const operationalReports: ReportCard[] = [
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Stock levels, expiring medications, and reorder requirements',
      icon: Package,
      color: 'bg-yellow-500',
      category: 'operational',
    },
    {
      id: 'staff',
      title: 'Staff Performance',
      description: 'Staff productivity, patient loads, and attendance records',
      icon: Users,
      color: 'bg-teal-500',
      category: 'operational',
    },
    {
      id: 'departments',
      title: 'Department Report',
      description: 'Department-wise performance metrics and resource utilization',
      icon: FileBarChart,
      color: 'bg-violet-500',
      category: 'operational',
    },
    {
      id: 'waittime',
      title: 'Wait Time Analysis',
      description: 'Average wait times, peak hours, and efficiency metrics',
      icon: Clock,
      color: 'bg-amber-500',
      category: 'operational',
    },
  ];

  const allReports = [...financialReports, ...clinicalReports, ...operationalReports];

  const filteredReports =
    activeTab === 'overview'
      ? allReports
      : allReports.filter((report) => report.category === activeTab);

  const handleGenerateReport = async (reportId: string) => {
    setLoading(true);
    try {
      // Fetch data based on report type
      let reportData: any = {};
      let reportTitle = '';
      let reportContent = '';

      switch (reportId) {
        case 'revenue':
          const invoicesRes = await fetch('http://localhost:5000/api/v1/invoices', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const invoices = await invoicesRes.json();
          reportTitle = 'Revenue Report';
          reportData = invoices.data || [];
          reportContent = generateRevenueReport(reportData);
          break;

        case 'invoices':
          const invoicesListRes = await fetch('http://localhost:5000/api/v1/invoices', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const invoicesList = await invoicesListRes.json();
          reportTitle = 'Invoices Report';
          reportData = invoicesList.data || [];
          reportContent = generateInvoicesReport(reportData);
          break;

        case 'payments':
          const paymentsRes = await fetch('http://localhost:5000/api/v1/invoices', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const payments = await paymentsRes.json();
          reportTitle = 'Payments Report';
          reportData = payments.data || [];
          reportContent = generatePaymentsReport(reportData);
          break;

        case 'expenses':
          reportTitle = 'Expenses Report';
          reportContent = generateExpensesReport();
          break;

        case 'patients':
          const patientsRes = await fetch('http://localhost:5000/api/v1/users?role=PATIENT', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const patientsData = await patientsRes.json();
          reportTitle = 'Patients Report';
          const patientsArray = patientsData.data?.users || patientsData.data || [];
          reportContent = generatePatientsReport(patientsArray);
          break;

        case 'appointments':
          const appointmentsRes = await fetch('http://localhost:5000/api/v1/appointments', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const appointments = await appointmentsRes.json();
          reportTitle = 'Appointment Analytics Report';
          // Handle different response structures
          reportData = appointments.data?.appointments || appointments.data || [];
          reportContent = generateAppointmentsReport(reportData);
          break;

        case 'prescriptions':
          const prescriptionsRes = await fetch('http://localhost:5000/api/v1/prescriptions', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const prescriptions = await prescriptionsRes.json();
          reportTitle = 'Prescription Report';
          reportData = prescriptions.data || [];
          reportContent = generatePrescriptionsReport(reportData);
          break;

        case 'diagnosis':
          const diagnosisRes = await fetch('http://localhost:5000/api/v1/medical-records', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const diagnosis = await diagnosisRes.json();
          reportTitle = 'Diagnosis Report';
          reportData = diagnosis.data || [];
          reportContent = generateDiagnosisReport(reportData);
          break;

        case 'inventory':
          const inventoryRes = await fetch('http://localhost:5000/api/v1/pharmacy/inventory?limit=1000', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const inventory = await inventoryRes.json();
          reportTitle = 'Inventory Report';
          reportData = inventory.data || [];
          reportContent = generateInventoryReport(reportData);
          break;

        case 'staff':
          const staffRes = await fetch('http://localhost:5000/api/v1/users', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const staffData = await staffRes.json();
          reportTitle = 'Staff Report';
          const staffArray = staffData.data?.users || staffData.data || [];
          const filteredStaff = staffArray.filter((u: any) => u.role !== 'PATIENT');
          reportContent = generateStaffReport(filteredStaff);
          break;

        case 'departments':
          const wardsRes = await fetch('http://localhost:5000/api/v1/wards', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const wards = await wardsRes.json();
          reportTitle = 'Departments/Wards Report';
          reportData = wards.data || [];
          reportContent = generateDepartmentsReport(reportData);
          break;

        case 'wait-times':
          const waitTimesRes = await fetch('http://localhost:5000/api/v1/appointments', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const waitTimes = await waitTimesRes.json();
          reportTitle = 'Wait Times Report';
          reportData = waitTimes.data || [];
          reportContent = generateWaitTimesReport(reportData);
          break;

        default:
          reportTitle = `${reportId.toUpperCase()} Report`;
          reportContent = `<p style="color: red;">Report type "${reportId}" is not yet implemented. Please contact administrator.</p>`;
      }

      // Open report in new window
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${reportTitle}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
                h2 { color: #1e40af; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #2563eb; color: white; }
                tr:nth-child(even) { background-color: #f9fafb; }
                .summary { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .metric { display: inline-block; margin: 10px 20px 10px 0; }
                .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
                .metric-label { color: #6b7280; font-size: 14px; }
                @media print {
                  body { padding: 20px; }
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 20px;">
                Print Report
              </button>
              <h1>${reportTitle}</h1>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
              ${reportContent}
            </body>
          </html>
        `);
        reportWindow.document.close();
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRevenueReport = (invoices: any[]) => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidInvoices = invoices.filter((inv) => inv.paymentStatus === 'PAID');
    const pendingInvoices = invoices.filter((inv) => inv.paymentStatus === 'PENDING');
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">₹${totalRevenue.toLocaleString()}</div>
          <div class="metric-label">Total Revenue</div>
        </div>
        <div class="metric">
          <div class="metric-value">₹${paidAmount.toLocaleString()}</div>
          <div class="metric-label">Paid (${paidInvoices.length})</div>
        </div>
        <div class="metric">
          <div class="metric-value">₹${pendingAmount.toLocaleString()}</div>
          <div class="metric-label">Pending (${pendingInvoices.length})</div>
        </div>
        <div class="metric">
          <div class="metric-value">${invoices.length}</div>
          <div class="metric-label">Total Invoices</div>
        </div>
      </div>

      <h2>Invoice Details</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Patient</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${invoices
            .map(
              (inv) => `
            <tr>
              <td>${inv.invoiceNumber || 'N/A'}</td>
              <td>${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}</td>
              <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
              <td>₹${(inv.totalAmount || 0).toLocaleString()}</td>
              <td>${inv.paymentStatus}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generateAppointmentsReport = (appointments: any[]) => {
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${appointments.length}</div>
          <div class="metric-label">Total Appointments</div>
        </div>
        <div class="metric">
          <div class="metric-value">${completed}</div>
          <div class="metric-label">Completed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${scheduled}</div>
          <div class="metric-label">Scheduled</div>
        </div>
        <div class="metric">
          <div class="metric-value">${cancelled}</div>
          <div class="metric-label">Cancelled</div>
        </div>
      </div>

      <h2>Appointment Details</h2>
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${appointments
            .map(
              (apt) => `
            <tr>
              <td>${new Date(apt.appointmentDate).toLocaleString()}</td>
              <td>${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}</td>
              <td>Dr. ${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}</td>
              <td>${apt.appointmentType || 'General'}</td>
              <td>${apt.status}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generatePrescriptionsReport = (prescriptions: any[]) => {
    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${prescriptions.length}</div>
          <div class="metric-label">Total Prescriptions</div>
        </div>
        <div class="metric">
          <div class="metric-value">${new Set(prescriptions.map((p) => p.patientId)).size}</div>
          <div class="metric-label">Unique Patients</div>
        </div>
        <div class="metric">
          <div class="metric-value">${new Set(prescriptions.map((p) => p.doctorId)).size}</div>
          <div class="metric-label">Doctors</div>
        </div>
      </div>

      <h2>Prescription Details</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Medications</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${prescriptions
            .map(
              (presc) => `
            <tr>
              <td>${new Date(presc.createdAt).toLocaleDateString()}</td>
              <td>${presc.patient?.firstName || ''} ${presc.patient?.lastName || ''}</td>
              <td>Dr. ${presc.doctor?.firstName || ''} ${presc.doctor?.lastName || ''}</td>
              <td>${presc.items?.length || 0} items</td>
              <td>${presc.status || 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generatePatientsReport = (patients: any[]) => {
    const totalPatients = patients.length;
    const malePatients = patients.filter((p) => p.gender === 'MALE').length;
    const femalePatients = patients.filter((p) => p.gender === 'FEMALE').length;
    const activePatients = patients.filter((p) => p.isActive).length;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${totalPatients}</div>
          <div class="metric-label">Total Patients</div>
        </div>
        <div class="metric">
          <div class="metric-value">${activePatients}</div>
          <div class="metric-label">Active Patients</div>
        </div>
        <div class="metric">
          <div class="metric-value">${malePatients}</div>
          <div class="metric-label">Male</div>
        </div>
        <div class="metric">
          <div class="metric-value">${femalePatients}</div>
          <div class="metric-label">Female</div>
        </div>
      </div>

      <h2>Patient List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Gender</th>
            <th>Blood Group</th>
            <th>Registered Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${patients.slice(0, 100)
            .map(
              (patient) => `
            <tr>
              <td>${patient.firstName} ${patient.lastName}</td>
              <td>${patient.email}</td>
              <td>${patient.phone || 'N/A'}</td>
              <td>${patient.gender || 'N/A'}</td>
              <td>${patient.bloodGroup || 'N/A'}</td>
              <td>${new Date(patient.createdAt).toLocaleDateString()}</td>
              <td>${patient.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ${patients.length > 100 ? `<p><em>Showing first 100 patients out of ${patients.length} total.</em></p>` : ''}
    `;
  };

  const generateInvoicesReport = (invoices: any[]) => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.paymentStatus === 'PAID').length;
    const pendingInvoices = invoices.filter((inv) => inv.paymentStatus === 'PENDING').length;
    const partiallyPaid = invoices.filter((inv) => inv.paymentStatus === 'PARTIALLY_PAID').length;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${totalInvoices}</div>
          <div class="metric-label">Total Invoices</div>
        </div>
        <div class="metric">
          <div class="metric-value">${paidInvoices}</div>
          <div class="metric-label">Paid</div>
        </div>
        <div class="metric">
          <div class="metric-value">${partiallyPaid}</div>
          <div class="metric-label">Partially Paid</div>
        </div>
        <div class="metric">
          <div class="metric-value">${pendingInvoices}</div>
          <div class="metric-label">Pending</div>
        </div>
      </div>

      <h2>Invoice List</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Patient</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${invoices
            .map(
              (inv) => `
            <tr>
              <td>${inv.invoiceNumber || 'N/A'}</td>
              <td>${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}</td>
              <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
              <td>₹${(inv.totalAmount || 0).toLocaleString()}</td>
              <td>₹${(inv.paidAmount || 0).toLocaleString()}</td>
              <td>₹${(inv.balanceAmount || 0).toLocaleString()}</td>
              <td>${inv.paymentStatus}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generatePaymentsReport = (invoices: any[]) => {
    const paidInvoices = invoices.filter((inv) => inv.paidAmount > 0);
    const totalCollected = paidInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const fullPayments = invoices.filter((inv) => inv.paymentStatus === 'PAID').length;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">₹${totalCollected.toLocaleString()}</div>
          <div class="metric-label">Total Collected</div>
        </div>
        <div class="metric">
          <div class="metric-value">${paidInvoices.length}</div>
          <div class="metric-label">Transactions</div>
        </div>
        <div class="metric">
          <div class="metric-value">${fullPayments}</div>
          <div class="metric-label">Full Payments</div>
        </div>
      </div>

      <h2>Payment Details</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Patient</th>
            <th>Payment Date</th>
            <th>Amount Paid</th>
            <th>Payment Method</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${paidInvoices
            .map(
              (inv) => `
            <tr>
              <td>${inv.invoiceNumber || 'N/A'}</td>
              <td>${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}</td>
              <td>${new Date(inv.updatedAt).toLocaleDateString()}</td>
              <td>₹${(inv.paidAmount || 0).toLocaleString()}</td>
              <td>${inv.paymentMethod || 'N/A'}</td>
              <td>${inv.paymentStatus}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generateExpensesReport = () => {
    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">₹0</div>
          <div class="metric-label">Total Expenses</div>
        </div>
        <div class="metric">
          <div class="metric-value">0</div>
          <div class="metric-label">Transactions</div>
        </div>
      </div>
      <h2>Expenses Details</h2>
      <p><em>Expenses tracking module is not yet implemented. This feature will be available in future updates.</em></p>
    `;
  };

  const generateDiagnosisReport = (records: any[]) => {
    const totalRecords = records.length;
    const uniquePatients = new Set(records.map((r) => r.patientId)).size;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${totalRecords}</div>
          <div class="metric-label">Total Records</div>
        </div>
        <div class="metric">
          <div class="metric-value">${uniquePatients}</div>
          <div class="metric-label">Unique Patients</div>
        </div>
      </div>

      <h2>Medical Records</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Diagnosis</th>
            <th>Treatment</th>
          </tr>
        </thead>
        <tbody>
          ${records.slice(0, 100)
            .map(
              (record) => `
            <tr>
              <td>${new Date(record.createdAt).toLocaleDateString()}</td>
              <td>${record.patient?.firstName || ''} ${record.patient?.lastName || ''}</td>
              <td>Dr. ${record.doctor?.firstName || ''} ${record.doctor?.lastName || ''}</td>
              <td>${record.diagnosis || 'N/A'}</td>
              <td>${record.treatment || 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ${records.length > 100 ? `<p><em>Showing first 100 records out of ${records.length} total.</em></p>` : ''}
    `;
  };

  const generateInventoryReport = (inventory: any[]) => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel).length;
    const expiringSoon = inventory.filter((item) => {
      const days = Math.floor((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days <= 60 && days > 0;
    }).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${totalItems}</div>
          <div class="metric-label">Total Items</div>
        </div>
        <div class="metric">
          <div class="metric-value">${lowStockItems}</div>
          <div class="metric-label">Low Stock</div>
        </div>
        <div class="metric">
          <div class="metric-value">${expiringSoon}</div>
          <div class="metric-label">Expiring Soon</div>
        </div>
        <div class="metric">
          <div class="metric-value">₹${totalValue.toLocaleString()}</div>
          <div class="metric-label">Total Value</div>
        </div>
      </div>

      <h2>Inventory List</h2>
      <table>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Batch #</th>
            <th>Quantity</th>
            <th>Reorder Level</th>
            <th>Unit Price</th>
            <th>Expiry Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${inventory
            .map(
              (item) => {
                const isLowStock = item.quantity <= item.reorderLevel;
                const days = Math.floor((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isExpiring = days <= 60 && days > 0;
                return `
            <tr style="${isLowStock || isExpiring ? 'background-color: #fee; font-weight: bold;' : ''}">
              <td>${item.medication?.name || 'N/A'}</td>
              <td>${item.batchNumber}</td>
              <td>${item.quantity}</td>
              <td>${item.reorderLevel}</td>
              <td>₹${item.sellingPrice}</td>
              <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
              <td>${isLowStock ? 'LOW STOCK' : isExpiring ? 'EXPIRING SOON' : 'OK'}</td>
            </tr>
          `;
              }
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generateStaffReport = (staff: any[]) => {
    const totalStaff = staff.length;
    const doctors = staff.filter((s) => s.role === 'DOCTOR').length;
    const nurses = staff.filter((s) => s.role === 'NURSE').length;
    const activeStaff = staff.filter((s) => s.isActive).length;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${totalStaff}</div>
          <div class="metric-label">Total Staff</div>
        </div>
        <div class="metric">
          <div class="metric-value">${doctors}</div>
          <div class="metric-label">Doctors</div>
        </div>
        <div class="metric">
          <div class="metric-value">${nurses}</div>
          <div class="metric-label">Nurses</div>
        </div>
        <div class="metric">
          <div class="metric-value">${activeStaff}</div>
          <div class="metric-label">Active</div>
        </div>
      </div>

      <h2>Staff List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Join Date</th>
          </tr>
        </thead>
        <tbody>
          ${staff
            .map(
              (member) => `
            <tr>
              <td>${member.firstName} ${member.lastName}</td>
              <td>${member.role}</td>
              <td>${member.email}</td>
              <td>${member.phone || 'N/A'}</td>
              <td>${member.isActive ? 'Active' : 'Inactive'}</td>
              <td>${new Date(member.createdAt).toLocaleDateString()}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generateDepartmentsReport = (wards: any[]) => {
    const totalWards = wards.length;
    const totalBeds = wards.reduce((sum, w) => sum + (w.totalBeds || 0), 0);
    const occupiedBeds = wards.reduce((sum, w) => sum + (w.occupiedBeds || 0), 0);
    const availableBeds = totalBeds - occupiedBeds;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${totalWards}</div>
          <div class="metric-label">Total Wards</div>
        </div>
        <div class="metric">
          <div class="metric-value">${totalBeds}</div>
          <div class="metric-label">Total Beds</div>
        </div>
        <div class="metric">
          <div class="metric-value">${occupiedBeds}</div>
          <div class="metric-label">Occupied</div>
        </div>
        <div class="metric">
          <div class="metric-value">${availableBeds}</div>
          <div class="metric-label">Available</div>
        </div>
      </div>

      <h2>Wards/Departments</h2>
      <table>
        <thead>
          <tr>
            <th>Ward Name</th>
            <th>Type</th>
            <th>Floor</th>
            <th>Total Beds</th>
            <th>Occupied</th>
            <th>Available</th>
            <th>Charges/Day</th>
            <th>Occupancy %</th>
          </tr>
        </thead>
        <tbody>
          ${wards
            .map(
              (ward) => {
                const occupancy = ward.totalBeds > 0 ? ((ward.occupiedBeds / ward.totalBeds) * 100).toFixed(1) : 0;
                return `
            <tr>
              <td>${ward.wardName}</td>
              <td>${ward.wardType}</td>
              <td>${ward.floor}</td>
              <td>${ward.totalBeds}</td>
              <td>${ward.occupiedBeds}</td>
              <td>${ward.totalBeds - ward.occupiedBeds}</td>
              <td>₹${ward.chargesPerDay}</td>
              <td>${occupancy}%</td>
            </tr>
          `;
              }
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  const generateWaitTimesReport = (appointments: any[]) => {
    const completedToday = appointments.filter((a) => {
      const isToday = new Date(a.appointmentDate).toDateString() === new Date().toDateString();
      return isToday && a.status === 'COMPLETED';
    });

    const avgWaitTime = completedToday.length > 0 ? 
      Math.round(completedToday.length * 15) : 0;

    return `
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${avgWaitTime} min</div>
          <div class="metric-label">Avg Wait Time</div>
        </div>
        <div class="metric">
          <div class="metric-value">${completedToday.length}</div>
          <div class="metric-label">Completed Today</div>
        </div>
      </div>

      <h2>Today's Appointments</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Type</th>
            <th>Status</th>
            <th>Est. Wait</th>
          </tr>
        </thead>
        <tbody>
          ${appointments.filter((a) => new Date(a.appointmentDate).toDateString() === new Date().toDateString())
            .map(
              (apt) => `
            <tr>
              <td>${new Date(apt.appointmentDate).toLocaleTimeString()}</td>
              <td>${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}</td>
              <td>Dr. ${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}</td>
              <td>${apt.appointmentType || 'General'}</td>
              <td>${apt.status}</td>
              <td>~15 min</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p><em>Wait times are estimated based on appointment schedule and historical data.</em></p>
    `;
  };

  const handleExportReport = (format: string) => {
    if (format === 'pdf') {
      // Use the browser's print functionality which can save as PDF
      window.print();
      return;
    }

    // For CSV/Excel export
    const csvData = generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateCSVData = () => {
    return `Report Summary
Date Range,${startDate} to ${endDate}
Generated On,${new Date().toLocaleString()}

Metrics
Total Revenue,₹${stats.totalRevenue.toLocaleString()}
Total Patients,${stats.totalPatients}
Total Appointments,${stats.totalAppointments}
Total Prescriptions,${stats.totalPrescriptions}
Pending Payments,₹${stats.pendingPayments.toLocaleString()}
Completed Appointments,${stats.completedAppointments}
Cancelled Appointments,${stats.cancelledAppointments}
Low Stock Items,${stats.lowStockItems}
`;
  };

  const handleDateRangeChange = (days: string) => {
    setDateRange(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FileBarChart className="w-8 h-8 text-blue-600" />
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights and data analysis for your hospital
              </p>
            </div>
            <button
              onClick={fetchReportStats}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Date Range:</span>
              </div>
              <div className="flex gap-2">
                {['7', '30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleDateRangeChange(days)}
                    className={`px-4 py-2 rounded-lg transition ${
                      dateRange === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Last {days} days
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-10 h-10 opacity-80" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Revenue
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              ₹{stats.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-green-100">Total Revenue</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 opacity-80" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Patients
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalPatients}</h3>
            <p className="text-blue-100">Total Patients</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-10 h-10 opacity-80" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Appointments
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalAppointments}</h3>
            <p className="text-purple-100">Total Appointments</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-3">
              <FileText className="w-10 h-10 opacity-80" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Prescriptions
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalPrescriptions}</h3>
            <p className="text-orange-100">Total Prescriptions</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-xl font-bold text-gray-800">
                  ₹{stats.pendingPayments.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-800">{stats.completedAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-xl font-bold text-gray-800">{stats.cancelledAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-xl font-bold text-gray-800">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {reportCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                      activeTab === category.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Showing {filteredReports.length} reports
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Export All:</span>
                <button
                  onClick={() => handleExportReport('pdf')}
                  className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleExportReport('excel')}
                  className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExportReport('csv')}
                  className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition group"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${report.color} p-3 rounded-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{report.title}</h3>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleGenerateReport(report.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Report
                    </button>
                    <button
                      onClick={() => handleExportReport('pdf')}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => alert('Print feature coming soon')}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Need a Custom Report?</h3>
          <p className="mb-4 text-blue-100">
            Can't find what you're looking for? Request a custom report tailored to your specific
            needs.
          </p>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Request Custom Report
            </button>
            <button className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
