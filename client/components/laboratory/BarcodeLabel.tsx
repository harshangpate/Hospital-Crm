'use client';

import React, { useRef } from 'react';
import Barcode from 'react-barcode';
import { Printer, X } from 'lucide-react';

interface BarcodeLabelProps {
  barcode: string;
  patientName: string;
  patientId: string;
  testName: string;
  testNumber: string;
  collectionDate: string;
  sampleType?: string;
  onClose?: () => void;
}

export default function BarcodeLabel({
  barcode,
  patientName,
  patientId,
  testName,
  testNumber,
  collectionDate,
  sampleType,
  onClose,
}: BarcodeLabelProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `
      <html>
        <head>
          <title>Print Barcode Label</title>
          <style>
            @media print {
              @page {
                size: 4in 2in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
            }
            * {
              box-sizing: border-box;
            }
            .label-container {
              width: 4in;
              height: 2in;
              padding: 0.2in;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 1px solid #000;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 4px;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
            }
            .info-section {
              font-size: 10px;
              line-height: 1.3;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .label {
              font-weight: bold;
            }
            .barcode-section {
              text-align: center;
              margin-top: 4px;
            }
            .barcode-section svg {
              max-width: 100%;
              height: auto;
            }
            .footer {
              font-size: 8px;
              text-align: center;
              margin-top: 2px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React functionality
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer className="h-6 w-6 text-blue-600" />
            Print Barcode Label
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Preview */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Label Preview (4&quot; x 2&quot; thermal label)
            </h3>
            <div className="flex justify-center bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <div
                ref={printRef}
                className="label-container bg-white p-4 shadow-lg"
                style={{ width: '4in', minHeight: '2in' }}
              >
                {/* Header */}
                <div className="header text-center font-bold text-sm mb-2 border-b border-gray-800 pb-1">
                  HOSPITAL CRM - LABORATORY SAMPLE
                </div>

                {/* Patient & Test Info */}
                <div className="info-section text-xs space-y-1">
                  <div className="info-row flex justify-between">
                    <span className="label font-semibold">Patient:</span>
                    <span className="text-right">{patientName}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="label font-semibold">Patient ID:</span>
                    <span className="text-right">{patientId}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="label font-semibold">Test:</span>
                    <span className="text-right">{testName}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="label font-semibold">Test #:</span>
                    <span className="text-right">{testNumber}</span>
                  </div>
                  {sampleType && (
                    <div className="info-row flex justify-between">
                      <span className="label font-semibold">Sample Type:</span>
                      <span className="text-right">{sampleType}</span>
                    </div>
                  )}
                  <div className="info-row flex justify-between">
                    <span className="label font-semibold">Collected:</span>
                    <span className="text-right">
                      {new Date(collectionDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Barcode */}
                <div className="barcode-section mt-2">
                  <Barcode
                    value={barcode}
                    width={1.5}
                    height={40}
                    fontSize={11}
                    margin={0}
                    displayValue={true}
                  />
                </div>

                {/* Footer */}
                <div className="footer text-xs text-center mt-1 text-gray-600">
                  Handle with care • Store at proper temperature
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Printing Instructions:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Set paper size to 4&quot; x 2&quot; (102mm x 51mm) in printer settings</li>
              <li>• Use thermal label printer for best results</li>
              <li>• Ensure barcode is clearly visible after printing</li>
              <li>• Attach label to sample container immediately</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
