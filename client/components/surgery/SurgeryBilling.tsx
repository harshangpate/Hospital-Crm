'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Trash2, Save, Download, Calculator } from 'lucide-react';
import { createInvoice } from '@/lib/api/invoices';
import { useAuthStore } from '@/lib/auth-store';

interface BillingItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BillingData {
  surgeryId: string;
  items: BillingItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  insuranceCoverage: number;
  total: number;
  patientCopay: number;
}

const BILLING_CATEGORIES = [
  'OT Charges',
  'Surgeon Fee',
  'Anesthesia Fee',
  'Assistant Surgeon Fee',
  'Nursing Charges',
  'Equipment Charges',
  'Consumables',
  'Implants',
  'Medications',
  'Lab Tests',
  'Imaging',
  'Recovery Room',
  'ICU Charges',
  'Miscellaneous',
];

export default function SurgeryBilling({ surgeryId, surgeryDetails }: { surgeryId: string; surgeryDetails?: any }) {
  const { token } = useAuthStore();
  const [billingData, setBillingData] = useState<BillingData>({
    surgeryId,
    items: [],
    subtotal: 0,
    discount: 0,
    discountType: 'percentage',
    tax: 0,
    taxRate: 5,
    insuranceCoverage: 0,
    total: 0,
    patientCopay: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingInvoice, setHasExistingInvoice] = useState(false);
  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState<string>('');

  useEffect(() => {
    if (surgeryDetails) {
      checkExistingInvoice();
      generateAutoBilling();
    }
  }, [surgeryDetails]);

  const checkExistingInvoice = async () => {
    try {
      if (!surgeryDetails?.patient?.id) return;
      
      const { getInvoices } = await import('@/lib/api/invoices');
      const response = await getInvoices({ patientId: surgeryDetails.patient.id });
      
      // Check if any invoice has notes mentioning this surgery number
      const existingInvoice = response.data.invoices?.find((inv: any) => 
        inv.notes?.includes(surgeryDetails.surgeryNumber)
      );
      
      if (existingInvoice) {
        setHasExistingInvoice(true);
        setExistingInvoiceNumber(existingInvoice.invoiceNumber);
      }
    } catch (error) {
      console.error('Error checking existing invoice:', error);
    }
  };

  const generateAutoBilling = () => {
    const autoItems: BillingItem[] = [];

    // OT Charges based on duration and OT type
    if (surgeryDetails?.estimatedDuration && surgeryDetails?.operationTheater) {
      const duration = surgeryDetails.estimatedDuration;
      const otType = surgeryDetails.operationTheater.type;
      let otRate = 5000;
      
      if (otType === 'CARDIAC') otRate = 15000;
      else if (otType === 'NEURO') otRate = 12000;
      else if (otType === 'ORTHO') otRate = 8000;

      autoItems.push({
        id: `item-${Date.now()}-1`,
        category: 'OT Charges',
        description: `${otType} OT - ${duration} minutes`,
        quantity: Math.ceil(duration / 60),
        unitPrice: otRate,
        total: Math.ceil(duration / 60) * otRate,
      });
    }

    // Surgeon Fee based on surgery type and priority
    if (surgeryDetails?.surgeryType && surgeryDetails?.primarySurgeon) {
      let surgeonFee = 25000;
      if (surgeryDetails.priority === 'CRITICAL') surgeonFee = 50000;
      else if (surgeryDetails.priority === 'HIGH') surgeonFee = 35000;

      autoItems.push({
        id: `item-${Date.now()}-2`,
        category: 'Surgeon Fee',
        description: `Primary Surgeon - Dr. ${surgeryDetails.primarySurgeon.user.firstName} ${surgeryDetails.primarySurgeon.user.lastName}`,
        quantity: 1,
        unitPrice: surgeonFee,
        total: surgeonFee,
      });
    }

    // Anesthesia Fee based on type and duration
    if (surgeryDetails?.anesthesiaType && surgeryDetails?.estimatedDuration) {
      const duration = surgeryDetails.estimatedDuration;
      let anesthesiaRate = 3000;
      
      if (surgeryDetails.anesthesiaType === 'GENERAL') anesthesiaRate = 5000;
      else if (surgeryDetails.anesthesiaType === 'EPIDURAL') anesthesiaRate = 4000;

      autoItems.push({
        id: `item-${Date.now()}-3`,
        category: 'Anesthesia Fee',
        description: `${surgeryDetails.anesthesiaType} Anesthesia`,
        quantity: Math.ceil(duration / 60),
        unitPrice: anesthesiaRate,
        total: Math.ceil(duration / 60) * anesthesiaRate,
      });
    }

    // Surgical Team
    if (surgeryDetails?.surgicalTeam && surgeryDetails.surgicalTeam.length > 0) {
      surgeryDetails.surgicalTeam.forEach((member: any, index: number) => {
        let fee = 5000;
        if (member.role === 'ASSISTANT_SURGEON') fee = 15000;
        else if (member.role === 'ANESTHESIOLOGIST') fee = 10000;

        autoItems.push({
          id: `item-${Date.now()}-${4 + index}`,
          category: member.role === 'ASSISTANT_SURGEON' ? 'Assistant Surgeon Fee' : 'Nursing Charges',
          description: `${member.role.replace('_', ' ')} - ${member.name}`,
          quantity: 1,
          unitPrice: fee,
          total: fee,
        });
      });
    }

    // Standard consumables
    autoItems.push({
      id: `item-${Date.now()}-consumables`,
      category: 'Consumables',
      description: 'Surgical consumables and disposables',
      quantity: 1,
      unitPrice: 8000,
      total: 8000,
    });

    setBillingData((prev) => {
      const updatedData = {
        ...prev,
        items: autoItems,
      };
      calculateTotals(autoItems, prev.discount, prev.discountType, prev.taxRate, prev.insuranceCoverage);
      return updatedData;
    });
  };

  const calculateTotals = (
    items: BillingItem[],
    discount: number,
    discountType: 'percentage' | 'fixed',
    taxRate: number,
    insuranceCoverage: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;
    const patientCopay = total - insuranceCoverage;

    setBillingData((prev) => ({
      ...prev,
      items,
      subtotal,
      discount, // Store the original discount value, not the calculated amount
      discountType,
      tax: taxAmount,
      total,
      patientCopay: Math.max(0, patientCopay),
    }));
  };

  const addBillingItem = () => {
    const newItem: BillingItem = {
      id: `item-${Date.now()}`,
      category: 'Miscellaneous',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    const newItems = [...billingData.items, newItem];
    setBillingData((prev) => ({ ...prev, items: newItems }));
  };

  const updateBillingItem = (id: string, field: keyof BillingItem, value: any) => {
    const newItems = billingData.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    setBillingData((prev) => ({ ...prev, items: newItems }));
    calculateTotals(newItems, billingData.discount, billingData.discountType, billingData.taxRate, billingData.insuranceCoverage);
  };

  const removeBillingItem = (id: string) => {
    const newItems = billingData.items.filter((item) => item.id !== id);
    setBillingData((prev) => ({ ...prev, items: newItems }));
    calculateTotals(newItems, billingData.discount, billingData.discountType, billingData.taxRate, billingData.insuranceCoverage);
  };

  const handleDiscountChange = (value: number, type: 'percentage' | 'fixed') => {
    setBillingData((prev) => ({ ...prev, discount: value, discountType: type }));
    calculateTotals(billingData.items, value, type, billingData.taxRate, billingData.insuranceCoverage);
  };

  const handleTaxRateChange = (value: number) => {
    setBillingData((prev) => ({ ...prev, taxRate: value }));
    calculateTotals(billingData.items, billingData.discount, billingData.discountType, value, billingData.insuranceCoverage);
  };

  const handleInsuranceChange = (value: number) => {
    setBillingData((prev) => ({ ...prev, insuranceCoverage: value }));
    calculateTotals(billingData.items, billingData.discount, billingData.discountType, billingData.taxRate, value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!token) {
        alert('Please login to save billing');
        return;
      }

      if (!surgeryDetails?.patient?.id) {
        alert('Patient information is required');
        return;
      }

      // Prepare invoice data (send as 'any' to bypass TypeScript interface mismatch)
      const discountAmount = billingData.discountType === 'percentage' 
        ? (billingData.subtotal * billingData.discount / 100)
        : billingData.discount;
      const taxAmount = (billingData.subtotal - discountAmount) * billingData.taxRate / 100;
      
      const invoiceData: any = {
        patientId: surgeryDetails.patient.id,
        invoiceItems: billingData.items.map(item => ({
          itemType: item.category,
          itemName: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
        // Backend expects discount and tax as amounts
        discount: discountAmount,
        tax: taxAmount,
        notes: `Surgery: ${surgeryDetails.surgeryName} (${surgeryDetails.surgeryNumber})`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };

      console.log('Creating invoice with data:', invoiceData);
      const response = await createInvoice(invoiceData);
      setHasExistingInvoice(true);
      setExistingInvoiceNumber(response.data.invoiceNumber);
      alert(`Invoice created successfully! Invoice Number: ${response.data.invoiceNumber}`);
    } catch (error: any) {
      console.error('Error saving billing:', error);
      console.error('Error response:', error?.response?.data);
      alert(`Failed to save billing: ${error?.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoice = () => {
    alert('Invoice generation feature coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Surgery Billing
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Itemized billing breakdown and invoice generation
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateAutoBilling}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Auto Calculate
          </motion.button>
        </div>
      </div>

      {/* Billing Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {billingData.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <select
                      value={item.category}
                      onChange={(e) => updateBillingItem(item.id, 'category', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    >
                      {BILLING_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateBillingItem(item.id, 'description', e.target.value)}
                      placeholder="Enter description..."
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateBillingItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.1"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateBillingItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeBillingItem(item.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Item Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={addBillingItem}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustments */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Adjustments
          </h4>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={billingData.discount}
                onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0, billingData.discountType)}
                min="0"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <select
                value={billingData.discountType}
                onChange={(e) => handleDiscountChange(billingData.discount, e.target.value as 'percentage' | 'fixed')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="percentage">%</option>
                <option value="fixed">₹</option>
              </select>
            </div>
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={billingData.taxRate}
              onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Insurance Coverage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Insurance Coverage (₹)
            </label>
            <input
              type="number"
              value={billingData.insuranceCoverage}
              onChange={(e) => handleInsuranceChange(parseFloat(e.target.value) || 0)}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Billing Summary
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Subtotal:</span>
              <span className="font-medium">
                ₹{billingData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Discount:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                - ₹{((billingData.discountType === 'percentage' ? (billingData.subtotal * billingData.discount / 100) : billingData.discount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Tax ({billingData.taxRate}%):</span>
              <span className="font-medium">
                + ₹{billingData.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
              <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>
                  ₹{billingData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Insurance Coverage:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                - ₹{billingData.insuranceCoverage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-3 border-t-2 border-blue-300 dark:border-blue-700">
              <div className="flex justify-between text-xl font-bold text-blue-600 dark:text-blue-400">
                <span>Patient Copay:</span>
                <span>
                  ₹{billingData.patientCopay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {hasExistingInvoice && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <Save className="w-5 h-5" />
              <span className="font-medium">
                Invoice already created: {existingInvoiceNumber}
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              An invoice has already been generated for this surgery. View it in the Billing section.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || billingData.items.length === 0 || hasExistingInvoice}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Creating Invoice...' : hasExistingInvoice ? 'Invoice Already Created' : 'Generate & Save Invoice'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
