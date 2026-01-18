import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Generate PDF buffer for prescriptions
 */
async function generatePrescriptionPDFBuffer(prescriptionId: string): Promise<Buffer> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      items: {
        include: {
          medication: true,
        },
      },
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!prescription) {
    throw new Error('Prescription not found');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Hospital CRM', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text('123 Medical Center, Healthcare City', { align: 'center' })
        .text('Phone: +91 1234567890 | Email: info@hospitalcrm.com', { align: 'center' })
        .moveDown(2);

      // Rx Symbol
      doc.fontSize(40).font('Helvetica-Bold').text('℞', 50, doc.y).moveDown();

      // Prescription Details
      const topY = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Prescription No:', 50, topY)
        .font('Helvetica')
        .text(prescription.prescriptionNumber, 150, topY)
        .font('Helvetica-Bold')
        .text('Date:', 50, topY + 15)
        .font('Helvetica')
        .text(new Date(prescription.issuedAt).toLocaleDateString(), 150, topY + 15);

      // Patient Details
      doc
        .font('Helvetica-Bold')
        .text('Patient:', 350, topY)
        .font('Helvetica')
        .text(
          `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`,
          350,
          topY + 15
        );

      doc.moveDown(3);

      // Doctor Details
      doc
        .font('Helvetica-Bold')
        .text('Prescribed by:', 50)
        .font('Helvetica')
        .text(
          `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
          50
        );

      doc.moveDown(2);

      // Medications
      doc.fontSize(12).font('Helvetica-Bold').text('Medications:', 50).moveDown(0.5);

      prescription.items.forEach((item, index) => {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${item.medication.name}`, 50);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`   Dosage: ${item.dosage}`, 70)
          .text(`   Frequency: ${item.frequency}`, 70)
          .text(`   Duration: ${item.duration}`, 70);

        if (item.instructions) {
          doc.text(`   Instructions: ${item.instructions}`, 70);
        }

        doc.moveDown(0.5);
      });

      // Footer
      doc
        .moveDown(3)
        .fontSize(8)
        .fillColor('#666666')
        .text('This is a computer-generated prescription.', 50, doc.page.height - 80, {
          align: 'center',
          width: 500,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF buffer for medical records
 */
async function generateMedicalRecordPDFBuffer(recordId: string): Promise<Buffer> {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      diagnoses: true,
      vitalSigns: true,
    },
  });

  if (!record) {
    throw new Error('Medical record not found');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Hospital CRM', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text('123 Medical Center, Healthcare City', { align: 'center' })
        .text('Phone: +91 1234567890 | Email: info@hospitalcrm.com', { align: 'center' })
        .moveDown(2);

      // Title
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#2563EB')
        .text('MEDICAL RECORD', { align: 'center' })
        .moveDown(1);

      // Record Details
      const topY = doc.y;
      doc
        .fontSize(10)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Record ID:', 50, topY)
        .font('Helvetica')
        .text(record.id.substring(0, 8), 150, topY)
        .font('Helvetica-Bold')
        .text('Date:', 50, topY + 15)
        .font('Helvetica')
        .text(new Date(record.createdAt).toLocaleDateString(), 150, topY + 15);

      // Patient Details
      doc
        .font('Helvetica-Bold')
        .text('Patient:', 350, topY)
        .font('Helvetica')
        .text(`${record.patient.user.firstName} ${record.patient.user.lastName}`, 350, topY + 15);

      doc.moveDown(3);

      // Chief Complaint
      if (record.chiefComplaint) {
        doc.fontSize(12).font('Helvetica-Bold').text('Chief Complaint:', 50).moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(record.chiefComplaint, 70).moveDown();
      }

      // Diagnosis
      if (record.diagnosis) {
        doc.fontSize(12).font('Helvetica-Bold').text('Diagnosis:', 50).moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(record.diagnosis, 70).moveDown();
      }

      // Treatment
      if (record.treatment) {
        doc.fontSize(12).font('Helvetica-Bold').text('Treatment Plan:', 50).moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(record.treatment, 70).moveDown();
      }

      // Footer
      doc
        .moveDown(3)
        .fontSize(8)
        .fillColor('#666666')
        .text(
          'This is a confidential medical record.',
          50,
          doc.page.height - 80,
          {
            align: 'center',
            width: 500,
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate PDF buffer for invoices
 */
async function generateInvoicePDFBuffer(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
      invoiceItems: true,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Hospital CRM', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text('123 Medical Center, Healthcare City', { align: 'center' })
        .text('Phone: +91 1234567890 | Email: info@hospitalcrm.com', { align: 'center' })
        .moveDown(2);

      // Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#2563EB')
        .text('INVOICE', { align: 'center' })
        .fillColor('#000000')
        .moveDown();

      // Invoice Details
      const topY = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice No:', 50, topY)
        .font('Helvetica')
        .text(invoice.invoiceNumber, 150, topY)
        .font('Helvetica-Bold')
        .text('Date:', 50, topY + 15)
        .font('Helvetica')
        .text(new Date(invoice.invoiceDate).toLocaleDateString(), 150, topY + 15);

      if (invoice.dueDate) {
        doc
          .font('Helvetica-Bold')
          .text('Due Date:', 50, topY + 30)
          .font('Helvetica')
          .text(new Date(invoice.dueDate).toLocaleDateString(), 150, topY + 30);
      }

      // Patient Details
      doc
        .font('Helvetica-Bold')
        .text('Bill To:', 350, topY)
        .font('Helvetica')
        .text(`${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`, 350, topY + 15)
        .text(invoice.patient.user.email || '', 350, topY + 30);

      doc.moveDown(3);

      // Items Table Header
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Quantity', 300, tableTop)
        .text('Rate', 380, tableTop)
        .text('Amount', 480, tableTop);

      // Draw line
      doc
        .strokeColor('#000000')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Items
      let currentY = tableTop + 25;
      invoice.invoiceItems.forEach((item) => {
        const amount = item.quantity * item.unitPrice;
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(item.itemName, 50, currentY, { width: 240 })
          .text(item.quantity.toString(), 300, currentY)
          .text(`₹${item.unitPrice.toFixed(2)}`, 380, currentY)
          .text(`₹${amount.toFixed(2)}`, 480, currentY);

        currentY += 20;
      });

      // Totals
      currentY += 10;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Subtotal:', 380, currentY)
        .text(`₹${invoice.subtotal.toFixed(2)}`, 480, currentY);

      if (invoice.discount > 0) {
        currentY += 15;
        doc
          .text('Discount:', 380, currentY)
          .text(`-₹${invoice.discount.toFixed(2)}`, 480, currentY);
      }

      if (invoice.tax > 0) {
        currentY += 15;
        doc.text('Tax:', 380, currentY).text(`₹${invoice.tax.toFixed(2)}`, 480, currentY);
      }

      currentY += 15;
      doc
        .fontSize(12)
        .fillColor(invoice.paymentStatus === 'PAID' ? '#10B981' : '#EF4444')
        .text('Total:', 380, currentY)
        .text(`₹${invoice.totalAmount.toFixed(2)}`, 480, currentY);

      // Payment Status
      currentY += 25;
      doc
        .fontSize(10)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(`Status: ${invoice.paymentStatus}`, 50, currentY);

      if (invoice.paidAmount > 0) {
        currentY += 15;
        doc.text(`Paid Amount: ₹${invoice.paidAmount.toFixed(2)}`, 50, currentY);
      }

      if (invoice.balanceAmount > 0) {
        currentY += 15;
        doc
          .fillColor('#EF4444')
          .text(`Balance Due: ₹${invoice.balanceAmount.toFixed(2)}`, 50, currentY);
      }

      // Footer
      doc
        .moveDown(3)
        .fontSize(8)
        .fillColor('#666666')
        .text('Thank you for your business!', 50, doc.page.height - 80, {
          align: 'center',
          width: 500,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send prescription via email with PDF attachment
 */
export async function sendPrescriptionEmail(prescriptionId: string, recipientEmail: string) {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const pdfBuffer = await generatePrescriptionPDFBuffer(prescriptionId);

    const mailOptions = {
      from: `"Hospital CRM" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Prescription - ${prescription.prescriptionNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .prescription-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">℞ Prescription</h1>
              <p style="margin: 10px 0 0 0;">Hospital CRM - Your Health, Our Priority</p>
            </div>
            <div class="content">
              <p>Dear ${prescription.patient.user.firstName},</p>
              
              <p>Your prescription has been issued and is attached to this email as a PDF document.</p>
              
              <div class="prescription-box">
                <p><span class="label">Prescription Number:</span> ${prescription.prescriptionNumber}</p>
                <p><span class="label">Prescribed by:</span> Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}</p>
                <p><span class="label">Date:</span> ${new Date(prescription.issuedAt).toLocaleDateString()}</p>
                ${prescription.validUntil ? `<p><span class="label">Valid Until:</span> ${new Date(prescription.validUntil).toLocaleDateString()}</p>` : ''}
              </div>
              
              <p><strong>Important Instructions:</strong></p>
              <ul>
                <li>Take medications exactly as prescribed</li>
                <li>Complete the full course even if you feel better</li>
                <li>Store medications properly as indicated</li>
                <li>Contact your doctor if you experience any side effects</li>
              </ul>
              
              <p>If you have any questions about your prescription, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>
              Hospital CRM Team</p>
            </div>
            <div class="footer">
              <p>Hospital CRM | 123 Medical Center, Healthcare City</p>
              <p>Phone: +91 1234567890 | Email: info@hospitalcrm.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `prescription-${prescription.prescriptionNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Send prescription email error:', error);
    throw error;
  }
}

/**
 * Send medical record via email with PDF attachment
 */
export async function sendMedicalRecordEmail(recordId: string, recipientEmail: string) {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!record) {
      throw new Error('Medical record not found');
    }

    const pdfBuffer = await generateMedicalRecordPDFBuffer(recordId);

    const mailOptions = {
      from: `"Hospital CRM" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Medical Record - ${record.recordType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .record-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .label { font-weight: bold; color: #10b981; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .confidential { background: #fef3c7; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📋 Medical Record</h1>
              <p style="margin: 10px 0 0 0;">Hospital CRM - Your Health, Our Priority</p>
            </div>
            <div class="content">
              <p>Dear ${record.patient.user.firstName},</p>
              
              <p>Your medical record has been prepared and is attached to this email as a PDF document.</p>
              
              <div class="record-box">
                <p><span class="label">Record Type:</span> ${record.recordType}</p>
                <p><span class="label">Doctor:</span> Dr. ${record.doctor.user.firstName} ${record.doctor.user.lastName}</p>
                <p><span class="label">Date:</span> ${new Date(record.createdAt).toLocaleDateString()}</p>
                ${record.diagnosis ? `<p><span class="label">Diagnosis:</span> ${record.diagnosis}</p>` : ''}
              </div>
              
              <div class="confidential">
                <strong>⚠️ Confidential Medical Information</strong>
                <p style="margin: 5px 0 0 0;">This document contains sensitive medical information. Please keep it secure and share only with authorized healthcare providers.</p>
              </div>
              
              <p>If you need any clarification about your medical record or require additional copies, please contact our office.</p>
              
              <p>Best regards,<br>
              Hospital CRM Team</p>
            </div>
            <div class="footer">
              <p>Hospital CRM | 123 Medical Center, Healthcare City</p>
              <p>Phone: +91 1234567890 | Email: info@hospitalcrm.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `medical-record-${record.id.substring(0, 8)}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Send medical record email error:', error);
    throw error;
  }
}

/**
 * Send invoice via email with PDF attachment
 */
export async function sendInvoiceEmail(invoiceId: string, recipientEmail: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const pdfBuffer = await generateInvoicePDFBuffer(invoiceId);

    const mailOptions = {
      from: `"Hospital CRM" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Invoice - ${invoice.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .label { font-weight: bold; color: #3b82f6; }
            .amount-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .amount { font-size: 28px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .status-paid { color: #10b981; font-weight: bold; }
            .status-due { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">💳 Invoice</h1>
              <p style="margin: 10px 0 0 0;">Hospital CRM - Your Health, Our Priority</p>
            </div>
            <div class="content">
              <p>Dear ${invoice.patient.user.firstName},</p>
              
              <p>Thank you for choosing Hospital CRM. Your invoice is attached to this email as a PDF document.</p>
              
              <div class="invoice-box">
                <p><span class="label">Invoice Number:</span> ${invoice.invoiceNumber}</p>
                <p><span class="label">Invoice Date:</span> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                ${invoice.dueDate ? `<p><span class="label">Due Date:</span> ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
                <p><span class="label">Status:</span> <span class="status-${invoice.paymentStatus === 'PAID' ? 'paid' : 'due'}">${invoice.paymentStatus}</span></p>
              </div>
              
              <div class="amount-box">
                <p style="margin: 0; font-size: 14px;">Total Amount</p>
                <div class="amount">₹${invoice.totalAmount.toFixed(2)}</div>
                ${invoice.paidAmount > 0 ? `<p style="margin: 5px 0 0 0; color: #10b981;">Paid: ₹${invoice.paidAmount.toFixed(2)}</p>` : ''}
                ${invoice.balanceAmount > 0 ? `<p style="margin: 5px 0 0 0; color: #ef4444;">Balance Due: ₹${invoice.balanceAmount.toFixed(2)}</p>` : ''}
              </div>
              
              ${invoice.paymentStatus !== 'PAID' ? `
              <p><strong>Payment Methods:</strong></p>
              <ul>
                <li>Cash - Pay at our reception</li>
                <li>Card - Credit/Debit cards accepted</li>
                <li>UPI - Scan QR code at reception</li>
                <li>Net Banking - Contact billing department</li>
              </ul>
              ` : ''}
              
              <p>For any billing inquiries, please contact our billing department at billing@hospitalcrm.com or call +91 1234567890.</p>
              
              <p>Best regards,<br>
              Hospital CRM Team</p>
            </div>
            <div class="footer">
              <p>Hospital CRM | 123 Medical Center, Healthcare City</p>
              <p>Phone: +91 1234567890 | Email: info@hospitalcrm.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Send invoice email error:', error);
    throw error;
  }
}

/**
 * Send critical lab result alert email to doctor
 */
export async function sendCriticalLabAlert(
  doctorEmail: string,
  doctorName: string,
  patientName: string,
  testName: string,
  testNumber: string,
  result: string,
  normalRange: string,
  criticalReason: string
) {
  try {
    const mailOptions: any = {
      from: `"Hospital CRM - Lab Alerts" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: `🚨 URGENT: Critical Lab Result - ${patientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .alert-box {
              background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              text-align: center;
            }
            .alert-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .alert-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .info-box {
              background: #f3f4f6;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .label {
              font-weight: bold;
              color: #4b5563;
              display: inline-block;
              width: 140px;
            }
            .value {
              color: #1f2937;
            }
            .critical-value {
              background: #fee2e2;
              border: 2px solid #dc2626;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              text-align: center;
            }
            .critical-value .result {
              font-size: 28px;
              font-weight: bold;
              color: #dc2626;
              margin: 10px 0;
            }
            .action-button {
              display: inline-block;
              background: #dc2626;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="alert-box">
            <div class="alert-icon">⚠️</div>
            <div class="alert-title">CRITICAL LAB RESULT ALERT</div>
            <p style="margin: 0;">Immediate attention required</p>
          </div>
          
          <p>Dear Dr. ${doctorName},</p>
          
          <p><strong>A critical laboratory result requires your immediate attention.</strong></p>
          
          <div class="info-box">
            <p><span class="label">Patient:</span> <span class="value">${patientName}</span></p>
            <p><span class="label">Test Name:</span> <span class="value">${testName}</span></p>
            <p><span class="label">Test Number:</span> <span class="value">${testNumber}</span></p>
            <p><span class="label">Reported Date:</span> <span class="value">${new Date().toLocaleString()}</span></p>
          </div>
          
          <div class="critical-value">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">RESULT VALUE</p>
            <div class="result">${result}</div>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Normal Range: ${normalRange}</p>
          </div>
          
          <div class="info-box" style="background: #fef2f2; border-left-color: #dc2626;">
            <p style="margin: 0;"><strong>Critical Reason:</strong></p>
            <p style="margin: 5px 0 0 0;">${criticalReason}</p>
          </div>
          
          <p><strong>⚡ Action Required:</strong></p>
          <ul>
            <li>Review the complete lab report immediately</li>
            <li>Assess patient's current condition</li>
            <li>Initiate appropriate clinical intervention</li>
            <li>Document your response and actions taken</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/laboratory" class="action-button">
              View Lab Report Now
            </a>
          </div>
          
          <p style="color: #dc2626; font-weight: bold; margin-top: 20px;">
            ⏰ This alert requires immediate attention as per hospital protocol.
          </p>
          
          <p>If you have already reviewed this result, please document your actions in the system.</p>
          
          <p>Best regards,<br>
          Laboratory Department<br>
          Hospital CRM</p>
          
          <div class="footer">
            <p><strong>Hospital CRM</strong> | 123 Medical Center, Healthcare City</p>
            <p>Phone: +91 1234567890 | Emergency Lab: Ext. 2345</p>
            <p style="margin-top: 10px; font-style: italic;">
              This is an automated alert. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const emailResult: any = await transporter.sendMail(mailOptions);
    console.log('Critical lab alert sent:', emailResult.messageId);
    return emailResult;
  } catch (error) {
    console.error('Send critical lab alert error:', error);
    throw error;
  }
}
