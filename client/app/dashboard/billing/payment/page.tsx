'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/lib/auth-store';
import { Search, CreditCard, Banknote, IndianRupee, CheckCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  patient: {
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
}

export default function CollectPaymentPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <CollectPayment />
    </ProtectedRoute>
  );
}

function CollectPayment() {
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment details
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchInvoices();
    } else {
      setInvoices([]);
    }
  }, [searchTerm]);

  const searchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/billing?search=${searchTerm}&status=PENDING,PARTIALLY_PAID&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const result = await response.json();
        setInvoices(result.data.invoices || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAmount(invoice.balanceAmount); // Default to full balance
    setInvoices([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice) {
      alert('Please select an invoice');
      return;
    }

    if (amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (amount > selectedInvoice.balanceAmount) {
      alert('Payment amount cannot exceed balance amount');
      return;
    }

    if (paymentMethod !== 'CASH' && !transactionId) {
      alert('Please enter transaction ID for non-cash payments');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/billing/${selectedInvoice.id}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            paymentMethod,
            transactionId: transactionId || undefined,
            notes,
          }),
        }
      );

      if (response.ok) {
        alert('Payment recorded successfully!');
        // Reset form
        setSelectedInvoice(null);
        setAmount(0);
        setPaymentMethod('CASH');
        setTransactionId('');
        setNotes('');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Collect Payment</h1>
          <p className="text-gray-600 mt-1">Record payment for pending invoices</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Select Invoice
              </h2>

              {selectedInvoice ? (
                <div className="bg-gray-800 dark:bg-gray-700 border border-gray-600 dark:border-gray-500 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-white dark:text-gray-100 text-lg">
                        {selectedInvoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-300 dark:text-gray-400 mt-1">
                        Patient: {selectedInvoice.patient.user.firstName}{' '}
                        {selectedInvoice.patient.user.lastName}
                      </p>
                      <p className="text-sm text-gray-300 dark:text-gray-400">
                        ID: {selectedInvoice.patient.patientId}
                      </p>
                      <p className="text-sm text-gray-300 dark:text-gray-400">
                        Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                      </p>
                      
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Total Amount</p>
                          <p className="text-lg font-bold text-white dark:text-gray-100">
                            ₹{selectedInvoice.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Paid</p>
                          <p className="text-lg font-bold text-green-400">
                            ₹{selectedInvoice.paidAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Balance Due</p>
                          <p className="text-lg font-bold text-red-400">
                            ₹{selectedInvoice.balanceAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(null)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by invoice number, patient name, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {loading && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg p-4 text-center z-10">
                      Searching...
                    </div>
                  )}

                  {invoices.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto z-10">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          onClick={() => selectInvoice(invoice)}
                          className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-sm text-gray-600">
                                {invoice.patient.user.firstName}{' '}
                                {invoice.patient.user.lastName} ({invoice.patient.patientId})
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-red-600">
                                ₹{invoice.balanceAmount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">Balance Due</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && searchTerm.length >= 2 && invoices.length === 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 z-10">
                      No pending invoices found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Details */}
            {selectedInvoice && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Payment Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount (₹) *
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        min="0"
                        max={selectedInvoice.balanceAmount}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ₹{selectedInvoice.balanceAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card (Debit/Credit)</option>
                      <option value="UPI">UPI</option>
                      <option value="NET_BANKING">Net Banking</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="INSURANCE">Insurance</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction ID / Reference Number *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter transaction/cheque/reference number"
                        required={paymentMethod !== 'CASH'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Any additional notes about this payment..."
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-semibold text-red-600">
                      ₹{selectedInvoice.balanceAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="font-semibold text-blue-600">
                      -₹{amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Remaining Balance:</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{(selectedInvoice.balanceAmount - amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(null);
                      setAmount(0);
                      setPaymentMethod('CASH');
                      setTransactionId('');
                      setNotes('');
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitting ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
