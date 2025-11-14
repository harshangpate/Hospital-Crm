'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import {
  IndianRupee,
  FileText,
  User,
  Calendar,
  CreditCard,
  ArrowLeft,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Receipt,
  Info,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceDate: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  notes: string | null;
  patient: {
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  invoiceItems: InvoiceItem[];
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  paymentDate: string;
  notes: string | null;
}

export default function InvoiceDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <InvoiceDetails />
    </ProtectedRoute>
  );
}

function InvoiceDetails() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/billing/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setInvoice(result.data);
      } else {
        alert('Failed to load invoice');
        router.push('/dashboard/billing');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (invoice && amount > invoice.balanceAmount) {
      toast.error(`Payment amount cannot exceed balance amount of ₹${invoice.balanceAmount.toLocaleString()}`);
      return;
    }

    if (paymentMethod === 'CASH' && cashReceived) {
      const received = parseFloat(cashReceived);
      if (received < amount) {
        toast.error('Cash received cannot be less than payment amount');
        return;
      }
    }

    if (paymentMethod !== 'CASH' && !transactionId) {
      toast.error('Transaction ID is required for non-cash payments');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`http://localhost:5000/api/v1/billing/${params.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          transactionId: transactionId || undefined,
          notes: paymentNotes || undefined,
          paymentDate,
        }),
      });

      if (response.ok) {
        toast.success('Payment recorded successfully!');
        setShowPaymentModal(false);
        // Reset form
        setPaymentAmount('');
        setCashReceived('');
        setTransactionId('');
        setPaymentNotes('');
        setPaymentMethod('CASH');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        fetchInvoice();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateChange = () => {
    if (!cashReceived || !paymentAmount) return 0;
    const received = parseFloat(cashReceived);
    const amount = parseFloat(paymentAmount);
    return received > amount ? received - amount : 0;
  };

  const setFullPayment = () => {
    if (invoice) {
      setPaymentAmount(invoice.balanceAmount.toString());
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800';
    if (status === 'PENDING') return 'bg-red-100 text-red-800';
    if (status === 'PARTIALLY_PAID') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PAID') return <CheckCircle2 className="w-5 h-5" />;
    if (status === 'PENDING') return <AlertCircle className="w-5 h-5" />;
    if (status === 'PARTIALLY_PAID') return <Clock className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/billing')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Invoice Details</h1>
              <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            {invoice.paymentStatus !== 'PAID' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Invoice Information</h2>
                </div>
                <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(invoice.paymentStatus)}`}>
                  {getStatusIcon(invoice.paymentStatus)}
                  <span>{invoice.paymentStatus.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoice Date</p>
                  <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Patient Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">
                    {invoice.patient.user.firstName} {invoice.patient.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-medium">{invoice.patient.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{invoice.patient.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{invoice.patient.user.phone}</p>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Invoice Items</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.invoiceItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium">{item.itemName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.serviceDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(item.serviceDate).toLocaleDateString()}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">₹{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{(invoice.totalAmount - invoice.taxAmount + invoice.discountAmount).toLocaleString()}</span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{invoice.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{invoice.taxAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>₹{invoice.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>Paid Amount</span>
                  <span className="font-semibold">₹{invoice.paidAmount.toLocaleString()}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-red-600">
                    <span>Balance Due</span>
                    <span>₹{invoice.balanceAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {invoice.paymentStatus !== 'PAID' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Outstanding Balance</h3>
                <p className="text-sm text-blue-700 mb-4">
                  ₹{invoice.balanceAmount.toLocaleString()} remaining to be paid
                </p>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Record Payment</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice: {invoice?.invoiceNumber}</p>
                </div>
              </div>
            </div>

            {/* Balance Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ₹{invoice?.balanceAmount.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={setFullPayment}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Pay Full
                </button>
              </div>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="space-y-5">
                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Amount *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {paymentAmount && parseFloat(paymentAmount) > (invoice?.balanceAmount || 0) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>Amount exceeds balance</span>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'CASH', label: 'Cash', icon: Wallet },
                      { value: 'CARD', label: 'Card', icon: CreditCard },
                      { value: 'UPI', label: 'UPI', icon: Receipt },
                      { value: 'ONLINE', label: 'Online', icon: CreditCard },
                      { value: 'CHEQUE', label: 'Cheque', icon: FileText },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                          paymentMethod === method.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <method.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Received and Change */}
                {paymentMethod === 'CASH' && paymentAmount && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Cash Received
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          step="0.01"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {cashReceived && calculateChange() > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800 dark:text-green-300">Change to Return:</span>
                          <span className="text-lg font-bold text-green-900 dark:text-green-200">
                            ₹{calculateChange().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction ID for non-cash */}
                {paymentMethod !== 'CASH' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Transaction ID / Reference Number *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter transaction/reference number"
                      required
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Notes
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Additional notes (optional)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setCashReceived('');
                    setTransactionId('');
                    setPaymentNotes('');
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Record Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
