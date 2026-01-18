'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  TestTube, 
  Scan, 
  Package, 
  CheckCircle2,
  Search,
  MapPin,
  Clock,
  RefreshCw,
  QrCode,
  ArrowRight,
  Printer,
  X
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { staggerContainer, staggerItem } from '@/lib/animations';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Card3D from '@/components/ui/Card3D';
import BarcodeLabel from '@/components/laboratory/BarcodeLabel';

interface LabTest {
  id: string;
  testNumber: string;
  testName: string;
  testCategory: string;
  status: string;
  orderedDate: string;
  scheduledDate: string | null;
  collectionDate: string | null;
  sampleType: string | null;
  sampleBarcode: string | null;
  sampleCondition: string | null;
  sampleLocation: string | null;
  sampleCollectedBy: string | null;
  patient: {
    id: string;
    patientId: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string | null;
    };
  };
}

interface SampleStats {
  awaitingCollection: number;
  collected: number;
  inTransit: number;
  atLab: number;
  totalToday: number;
}

export default function SampleTrackingPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<SampleStats>({ 
    awaitingCollection: 0, 
    collected: 0, 
    inTransit: 0, 
    atLab: 0,
    totalToday: 0 
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ORDERED');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showBarcodePrint, setShowBarcodePrint] = useState(false);
  const [printableTest, setPrintableTest] = useState<LabTest | null>(null);

  // Collection form state
  const [sampleBarcode, setSampleBarcode] = useState('');
  const [sampleCondition, setSampleCondition] = useState('GOOD');
  const [sampleLocation, setSampleLocation] = useState('Collection Point');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [chainOfCustody, setChainOfCustody] = useState('');

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'NURSE'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (token) {
      fetchTests();
      fetchStats();
    }
  }, [statusFilter, searchTerm, token]);

  const fetchTests = async () => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy: 'orderedDate',
        sortOrder: 'desc',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTests(result.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        // Calculate sample-specific stats
        setStats({
          awaitingCollection: data.orderedTests || 0,
          collected: data.sampleCollectedTests || 0,
          inTransit: Math.floor((data.sampleCollectedTests || 0) * 0.2),
          atLab: data.inProgressTests || 0,
          totalToday: data.todayTests || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;

    const found = tests.find(t => t.sampleBarcode === barcodeInput.trim());
    if (found) {
      setSelectedTest(found);
      router.push(`/dashboard/laboratory/${found.id}`);
    } else {
      alert('Sample not found with this barcode');
    }
  };

  const openCollectionModal = (test: LabTest) => {
    setSelectedTest(test);
    setSampleBarcode(`SAMP-${test.testNumber}`);
    setSampleCondition('GOOD');
    setSampleLocation('Collection Point');
    setCollectionNotes('');
    setChainOfCustody(`Collected by ${user?.firstName} ${user?.lastName} on ${new Date().toLocaleString()}`);
    setShowCollectionModal(true);
  };

  const handleCollectSample = async () => {
    if (!selectedTest || !token) return;

    if (!sampleBarcode.trim()) {
      alert('Please enter a sample barcode');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${selectedTest.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'SAMPLE_COLLECTED',
            collectionDate: new Date().toISOString(),
            sampleCollectedBy: `${user?.firstName} ${user?.lastName}`,
            sampleBarcode,
            sampleCondition,
            sampleLocation,
            sampleNotes: collectionNotes,
            chainOfCustody,
          }),
        }
      );

      if (response.ok) {
        const updatedTest = await response.json();
        alert('Sample collected successfully!');
        
        // Update the selected test with new data including barcode
        const testWithBarcode = {
          ...selectedTest,
          sampleBarcode,
          collectionDate: new Date().toISOString(),
          status: 'SAMPLE_COLLECTED',
        };
        
        // Show print dialog
        setPrintableTest(testWithBarcode);
        setShowBarcodePrint(true);
        
        setShowCollectionModal(false);
        setSelectedTest(null);
        fetchTests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error collecting sample:', error);
      alert('Failed to collect sample');
    }
  };

  const getConditionBadge = (condition: string | null) => {
    switch (condition) {
      case 'GOOD':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'ACCEPTABLE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'POOR':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handlePrintLabel = (test: LabTest) => {
    if (!test.sampleBarcode) {
      alert('This sample does not have a barcode yet. Please collect the sample first.');
      return;
    }
    setPrintableTest(test);
    setShowBarcodePrint(true);
  };

  return (
    <ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'NURSE']}>
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TestTube className="h-8 w-8 text-blue-600" />
                Sample Tracking
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage sample collection, tracking, and chain of custody
              </p>
            </div>

            <button
              onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <QrCode className="h-5 w-5" />
              Scan Barcode
            </button>
          </motion.div>

          {/* Barcode Scanner */}
          {showBarcodeScanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Scan className="h-5 w-5 text-purple-600" />
                Barcode Scanner
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter or scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleBarcodeSearch}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <ScrollReveal>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting Collection</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                          {stats.awaitingCollection}
                        </p>
                      </div>
                      <Package className="h-10 w-10 text-orange-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Collected</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {stats.collected}
                        </p>
                      </div>
                      <CheckCircle2 className="h-10 w-10 text-green-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {stats.inTransit}
                        </p>
                      </div>
                      <RefreshCw className="h-10 w-10 text-blue-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">At Lab</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                          {stats.atLab}
                        </p>
                      </div>
                      <TestTube className="h-10 w-10 text-purple-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card3D>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Today's Total</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                          {stats.totalToday}
                        </p>
                      </div>
                      <Clock className="h-10 w-10 text-indigo-600 opacity-80" />
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            </motion.div>
          </ScrollReveal>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by test number, patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                {[
                  { value: 'ORDERED', label: 'Awaiting', color: 'orange' },
                  { value: 'SAMPLE_COLLECTED', label: 'Collected', color: 'green' },
                  { value: 'IN_PROGRESS', label: 'At Lab', color: 'purple' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      statusFilter === status.value
                        ? `bg-${status.color}-600 text-white`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sample List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading samples...</div>
            ) : tests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No samples found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Test Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Test Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sample Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Condition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tests.map((test) => (
                      <motion.tr
                        key={test.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {test.testNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(test.orderedDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {test.patient.user.firstName} {test.patient.user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{test.patient.patientId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{test.testName}</div>
                          <div className="text-xs text-gray-500">{test.testCategory}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {test.sampleType || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {test.sampleBarcode ? (
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-mono text-gray-900 dark:text-white">
                                {test.sampleBarcode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No barcode</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {test.sampleCondition ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionBadge(test.sampleCondition)}`}>
                              {test.sampleCondition}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {test.sampleLocation ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              {test.sampleLocation}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {test.status === 'ORDERED' ? (
                              <button
                                onClick={() => openCollectionModal(test)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Collect
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push(`/dashboard/laboratory/${test.id}`)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                              >
                                View
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Print Label Button - only show if sample has barcode */}
                            {test.sampleBarcode && (
                              <button
                                onClick={() => handlePrintLabel(test)}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                title="Print Barcode Label"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Collection Modal */}
          {showCollectionModal && selectedTest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TestTube className="h-6 w-6 text-green-600" />
                        Collect Sample
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {selectedTest.testNumber} - {selectedTest.patient.user.firstName} {selectedTest.patient.user.lastName}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCollectionModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Test Details */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Test Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Test:</span>
                          <span className="ml-2 font-medium">{selectedTest.testName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Category:</span>
                          <span className="ml-2 font-medium">{selectedTest.testCategory}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Sample Type:</span>
                          <span className="ml-2 font-medium">{selectedTest.sampleType || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Ordered:</span>
                          <span className="ml-2 font-medium">{new Date(selectedTest.orderedDate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sample Barcode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sample Barcode *
                      </label>
                      <input
                        type="text"
                        value={sampleBarcode}
                        onChange={(e) => setSampleBarcode(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="SAMP-XXXXX"
                      />
                    </div>

                    {/* Sample Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sample Condition *
                      </label>
                      <select
                        value={sampleCondition}
                        onChange={(e) => setSampleCondition(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="GOOD">Good</option>
                        <option value="ACCEPTABLE">Acceptable</option>
                        <option value="POOR">Poor</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {/* Sample Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sample Location
                      </label>
                      <input
                        type="text"
                        value={sampleLocation}
                        onChange={(e) => setSampleLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Collection Point, Ward 3, Lab Freezer"
                      />
                    </div>

                    {/* Collection Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Collection Notes
                      </label>
                      <textarea
                        value={collectionNotes}
                        onChange={(e) => setCollectionNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Any special notes about sample collection..."
                      />
                    </div>

                    {/* Chain of Custody */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chain of Custody
                      </label>
                      <textarea
                        value={chainOfCustody}
                        onChange={(e) => setChainOfCustody(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Document who handled the sample..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleCollectSample}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Confirm Collection
                      </button>
                      <button
                        onClick={() => setShowCollectionModal(false)}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Barcode Label Print Modal */}
        {showBarcodePrint && printableTest && (
          <BarcodeLabel
            barcode={printableTest.sampleBarcode || ''}
            patientName={`${printableTest.patient.user.firstName} ${printableTest.patient.user.lastName}`}
            patientId={printableTest.patient.patientId}
            testName={printableTest.testName}
            testNumber={printableTest.testNumber}
            collectionDate={printableTest.collectionDate || new Date().toISOString()}
            sampleType={printableTest.sampleType || undefined}
            onClose={() => {
              setShowBarcodePrint(false);
              setPrintableTest(null);
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
