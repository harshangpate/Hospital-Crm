'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, RefreshCw, Printer } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface SampleBarcodeProps {
  testId: string;
  testNumber: string;
  patientName: string;
  testName: string;
  sampleType?: string;
  onBarcodeGenerated?: (barcode: string) => void;
}

export default function SampleBarcode({
  testId,
  testNumber,
  patientName,
  testName,
  sampleType,
  onBarcodeGenerated,
}: SampleBarcodeProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [barcodeData, setBarcodeData] = useState<string | null>(null);

  const generateBarcode = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${testId}/barcode`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBarcodeData(result.data.barcode);
        if (onBarcodeGenerated) {
          onBarcodeGenerated(result.data.barcode);
        }
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sample Label - ${testNumber}</title>
          <style>
            @media print {
              @page {
                size: 4in 3in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .label-container {
              border: 2px solid #000;
              padding: 15px;
              width: 100%;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            .info {
              font-size: 12px;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .label {
              font-weight: bold;
              width: 100px;
            }
            .qr-container {
              text-align: center;
              margin: 15px 0;
            }
            .footer {
              font-size: 10px;
              text-align: center;
              color: #666;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">SAMPLE LABEL</div>
            <div class="info">
              <div class="info-row">
                <span class="label">Test Number:</span>
                <span>${testNumber}</span>
              </div>
              <div class="info-row">
                <span class="label">Patient:</span>
                <span>${patientName}</span>
              </div>
              <div class="info-row">
                <span class="label">Test:</span>
                <span>${testName}</span>
              </div>
              ${sampleType ? `
              <div class="info-row">
                <span class="label">Sample Type:</span>
                <span>${sampleType}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div class="qr-container">
              ${document.getElementById('qr-code-print')?.innerHTML || ''}
            </div>
            <div class="footer">
              Hospital CRM - Laboratory Services<br>
              Scan QR code for sample tracking
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadBarcode = () => {
    const canvas = document.querySelector('#qr-code-download canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample-${testNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sample Barcode</h3>
        {!barcodeData && (
          <button
            onClick={generateBarcode}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        )}
      </div>

      {barcodeData ? (
        <div className="space-y-4">
          <div className="flex justify-center bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <div id="qr-code-display">
              <QRCodeSVG
                value={testNumber}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            {/* Hidden QR code for printing */}
            <div id="qr-code-print" style={{ display: 'none' }}>
              <QRCodeSVG
                value={testNumber}
                size={150}
                level="H"
                includeMargin
              />
            </div>
            {/* Hidden QR code for downloading */}
            <div id="qr-code-download" style={{ display: 'none' }}>
              <QRCodeSVG
                value={testNumber}
                size={400}
                level="H"
                includeMargin
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Sample ID:</strong> {testNumber}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Scan this QR code to track sample or update status
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Printer className="w-4 h-4" />
              Print Label
            </button>
            <button
              onClick={downloadBarcode}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <button
            onClick={generateBarcode}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No barcode generated yet.</p>
          <p className="text-sm mt-2">Click "Generate QR Code" to create a sample barcode.</p>
        </div>
      )}
    </div>
  );
}
