import PDFDocument from 'pdfkit';
import { Response } from 'express';
import prisma from '../config/database';

// ============================================
// ULTRA-MODERN PDF DESIGN HELPERS
// ============================================

// Helper function to draw ultra-modern gradient header
function drawModernHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string, primaryColor: string, secondaryColor: string) {
  // Multi-layer gradient effect background
  for (let i = 0; i < 120; i++) {
    const opacity = 1 - (i / 120);
    doc.rect(0, i, 612, 1).fillOpacity(opacity * 0.12).fill(primaryColor);
  }
  doc.fillOpacity(1);
  
  // Modern decorative accent bar
  doc.roundedRect(40, 20, 6, 80, 3).fill(primaryColor);
  
  // Logo container with multiple circles for depth
  doc.circle(95, 60, 30).fillOpacity(0.1).fill(primaryColor);
  doc.circle(95, 60, 26).lineWidth(3).strokeOpacity(0.4).stroke(primaryColor);
  doc.circle(95, 60, 22).lineWidth(2).strokeOpacity(1).stroke(primaryColor);
  doc.fillOpacity(1);
  
  // Medical symbol with shadow effect
  doc.fontSize(26).fillColor('#000000').fillOpacity(0.1).font('Helvetica-Bold').text('⚕', 84, 46);
  doc.fillOpacity(1).fillColor(primaryColor).text('⚕', 82, 44);
  
  // Hospital branding
  doc
    .fontSize(30)
    .fillColor('#0F172A')
    .font('Helvetica-Bold')
    .text('Hospital CRM', 140, 30);
  
  doc
    .fontSize(9)
    .fillColor('#64748B')
    .font('Helvetica')
    .text('🏥 Excellence in Healthcare  |  📍 123 Medical Center, Healthcare City', 140, 58)
    .text('📞 +91-1234567890  |  📧 care@hospitalcrm.com  |  🌐 www.hospitalcrm.com', 140, 72);
  
  // Modern document badge
  const badgeX = 410;
  const badgeY = 25;
  
  // Badge with gradient and shadow
  doc.roundedRect(badgeX + 3, badgeY + 3, 162, 58, 10).fillOpacity(0.08).fill('#000000');
  doc.fillOpacity(1);
  
  // Gradient badge background
  for (let i = 0; i < 58; i++) {
    const ratio = i / 58;
    const opacity = 0.85 + (ratio * 0.15);
    doc.roundedRect(badgeX, badgeY + i, 162, 1, 0).fillOpacity(opacity).fill(i < 29 ? primaryColor : secondaryColor);
  }
  doc.fillOpacity(1);
  
  // Badge border
  doc.roundedRect(badgeX, badgeY, 162, 58, 10).lineWidth(2).strokeOpacity(0.2).stroke('#FFFFFF');
  
  // Badge content
  doc
    .fontSize(10)
    .fillColor('#FFFFFF')
    .fillOpacity(0.85)
    .font('Helvetica')
    .text(subtitle, badgeX, badgeY + 12, { width: 162, align: 'center' });
  
  doc
    .fontSize(22)
    .fillOpacity(1)
    .font('Helvetica-Bold')
    .text(title, badgeX, badgeY + 28, { width: 162, align: 'center' });
  
  doc.fillOpacity(1).fillColor('#000000');
  
  // Modern separator with gradient
  for (let i = 0; i < 3; i++) {
    doc.moveTo(40, 118 + i).lineTo(572, 118 + i).lineWidth(1).strokeOpacity(0.05 + i * 0.03).stroke(primaryColor);
  }
  doc.fillOpacity(1);
}

// Helper function to draw premium modern cards
function drawPremiumCard(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, title: string, content: string[], accentColor: string, icon: string) {
  // Multi-layer shadow for depth
  doc.roundedRect(x + 5, y + 5, width, height, 12).fillOpacity(0.04).fill('#000000');
  doc.roundedRect(x + 3, y + 3, width, height, 12).fillOpacity(0.06).fill('#000000');
  doc.roundedRect(x + 1, y + 1, width, height, 12).fillOpacity(0.08).fill('#000000');
  
  // Main card with gradient background
  doc.roundedRect(x, y, width, height, 12).fillOpacity(1).fill('#FFFFFF');
  
  // Subtle border
  doc.roundedRect(x, y, width, height, 12).lineWidth(1).strokeOpacity(0.1).stroke('#94A3B8');
  
  // Top accent bar with gradient
  for (let i = 0; i < 45; i++) {
    const opacity = 0.12 - (i / 450);
    doc.roundedRect(x, y + i, width, 1, i === 0 ? 12 : 0).fillOpacity(opacity).fill(accentColor);
  }
  doc.fillOpacity(1);
  
  // Left accent strip
  doc.roundedRect(x, y, 5, height, 12).fill(accentColor).fillOpacity(0.6);
  doc.fillOpacity(1);
  
  // Icon container with glow effect
  const iconX = x + 18;
  const iconY = y + 18;
  doc.circle(iconX, iconY, 16).fillOpacity(0.1).fill(accentColor);
  doc.circle(iconX, iconY, 14).fillOpacity(0.15).fill(accentColor);
  doc.circle(iconX, iconY, 12).fillOpacity(0.9).fill(accentColor);
  
  doc.fontSize(14).fillOpacity(1).fillColor('#FFFFFF').font('Helvetica-Bold').text(icon, iconX - 5, iconY - 7);
  
  // Title with modern typography
  doc
    .fontSize(11)
    .fillColor('#0F172A')
    .font('Helvetica-Bold')
    .text(title, x + 45, y + 13);
  
  // Underline for title
  doc.moveTo(x + 45, y + 28).lineTo(x + width - 15, y + 28).lineWidth(1).strokeOpacity(0.1).stroke(accentColor);
  
  // Content with improved spacing and styling
  doc.fillColor('#475569').font('Helvetica').fontSize(9.5);
  content.forEach((line, index) => {
    if (line) {
      // Bullet point decoration
      doc.circle(x + 18, y + 48 + index * 17, 2).fillOpacity(0.4).fill(accentColor);
      doc.fillOpacity(1).text(line, x + 28, y + 44 + index * 17, { width: width - 40 });
    }
  });
  
  doc.fillOpacity(1).fillColor('#000000');
}

// Helper function to draw modern table
function drawModernTable(doc: PDFKit.PDFDocument, x: number, y: number, width: number, headers: string[], accentColor: string) {
  // Table header with gradient
  doc.roundedRect(x, y, width, 38, 8).fill('#F8FAFC');
  
  // Accent strip
  doc.roundedRect(x, y, width, 5, 8).fill(accentColor).fillOpacity(0.6);
  doc.rect(x, y + 3, width, 2).fill(accentColor).fillOpacity(0.6);
  doc.fillOpacity(1);
  
  // Header border
  doc.roundedRect(x, y, width, 38, 8).lineWidth(1).strokeOpacity(0.1).stroke('#CBD5E1');
  
  return y + 38;
}

// Helper function for modern footer
function drawModernFooter(doc: PDFKit.PDFDocument, y: number, primaryColor: string, text: string) {
  // Gradient footer background
  for (let i = 0; i < 80; i++) {
    const opacity = 0.03 + (i / 800);
    doc.rect(0, y + i, 612, 1).fillOpacity(opacity).fill(primaryColor);
  }
  doc.fillOpacity(1);
  
  // Decorative top border
  doc.rect(0, y, 612, 3).fill(primaryColor).fillOpacity(0.3);
  doc.rect(0, y + 3, 612, 1).fill(primaryColor).fillOpacity(0.5);
  doc.fillOpacity(1);
  
  // Footer content
  doc
    .fontSize(9)
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text(text, 40, y + 20, { align: 'center', width: 532 });
  
  doc
    .fontSize(8)
    .fillColor('#64748B')
    .font('Helvetica')
    .text('This document is generated electronically and is valid without signature', 40, y + 38, { align: 'center', width: 532 });
  
  const timestamp = new Date().toLocaleString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  doc
    .fontSize(7)
    .fillColor('#94A3B8')
    .text(`Generated on ${timestamp} | Powered by Hospital CRM`, 40, y + 58, { align: 'center', width: 532 });
  
  doc.fillColor('#000000');
}

// ============================================
// INVOICE PDF GENERATOR (ULTRA-MODERN)
// ============================================

export const generateInvoicePDF = async (invoiceId: string, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        invoiceItems: true,
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

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // Ultra-modern header
    drawModernHeader(doc, 'INVOICE', 'Payment Document', '#2563EB', '#1D4ED8');
    doc.y = 140;

    // Invoice and Patient info as premium cards
    const invoiceInfo = [
      `Invoice: ${invoice.invoiceNumber}`,
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      invoice.dueDate ? `Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : '',
      `Status: ${invoice.paymentStatus.replace('_', ' ')}`
    ].filter(Boolean);

    const patientInfo = [
      `${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`,
      invoice.patient.user.email,
      invoice.patient.user.phone || '',
      invoice.patient.user.address ? invoice.patient.user.address.substring(0, 40) : ''
    ].filter(Boolean);

    const cardHeight = Math.max(invoiceInfo.length, patientInfo.length) * 16 + 50;
    
    drawPremiumCard(doc, 40, 150, 255, cardHeight, 'Invoice Details', invoiceInfo, '#3B82F6', '📋');
    drawPremiumCard(doc, 310, 150, 262, cardHeight, 'Bill To', patientInfo, '#10B981', '👤');

    doc.y = 150 + cardHeight + 20;

    // Modern items table header
    const tableStartY = doc.y;
    
    // Table header background
    doc.roundedRect(40, tableStartY, 532, 32, 8).fill('#F1F5F9');
    doc.roundedRect(40, tableStartY, 532, 32, 8).lineWidth(1).strokeOpacity(0.1).stroke('#CBD5E1');
    
    // Accent strip
    for (let i = 0; i < 32; i++) {
      const opacity = (32 - i) / 32 * 0.6;
      doc.rect(40, tableStartY + i, 4, 1).fillOpacity(opacity).fill('#2563EB');
    }
    doc.fillOpacity(1);
    
    // Table headers
    doc
      .fontSize(9.5)
      .fillColor('#1E293B')
      .font('Helvetica-Bold')
      .text('Description', 55, tableStartY + 11, { width: 260 })
      .text('Qty', 330, tableStartY + 11, { width: 40, align: 'center' })
      .text('Rate', 390, tableStartY + 11, { width: 80, align: 'right' })
      .text('Amount', 490, tableStartY + 11, { width: 72, align: 'right' });

    doc.y = tableStartY + 40;

    // Items with modern styling
    invoice.invoiceItems.forEach((item, index) => {
      // More compact item height
      const itemHeight = item.description ? 42 : 32;
      
      // Check if we need a new page (reserve 280px for totals section)
      if (doc.y + itemHeight + 280 > 750) {
        doc.addPage();
        doc.y = 50;
      }
      
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      
      // Row background
      doc.roundedRect(40, doc.y, 532, itemHeight, 6).fill(bgColor);
      if (index % 2 === 1) {
        doc.roundedRect(40, doc.y, 532, itemHeight, 6).lineWidth(1).strokeOpacity(0.05).stroke('#CBD5E1');
      }
      
      // Item number badge
      doc.circle(52, doc.y + (itemHeight / 2), 9).fillOpacity(0.15).fill('#2563EB');
      doc.fontSize(8.5).fillOpacity(1).fillColor('#2563EB').font('Helvetica-Bold').text(`${index + 1}`, 48, doc.y + (itemHeight / 2) - 4);
      
      // Item name
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(9.5);
      doc.text(item.itemName, 70, doc.y + 9, { width: 250, ellipsis: true });
      
      // Description if exists
      if (item.description) {
        doc.fontSize(8).fillColor('#64748B').font('Helvetica');
        doc.text(item.description, 70, doc.y + 23, { width: 250, ellipsis: true, height: 15 });
      }
      
      // Quantity
      doc.fontSize(9.5).fillColor('#334155').font('Helvetica');
      doc.text(item.quantity.toString(), 330, doc.y + (itemHeight / 2) - 4, { width: 40, align: 'center' });
      
      // Unit price
      doc.text(`₹${item.unitPrice.toFixed(2)}`, 390, doc.y + (itemHeight / 2) - 4, { width: 80, align: 'right' });
      
      // Total price
      doc.font('Helvetica-Bold').fillColor('#1E293B');
      doc.text(`₹${item.totalPrice.toFixed(2)}`, 490, doc.y + (itemHeight / 2) - 4, { width: 72, align: 'right' });
      
      doc.y += itemHeight + 2;
    });

    doc.y += 15;

    // Modern totals section
    const totalsX = 350;
    const totalsWidth = 222;
    
    // Totals background
    doc.roundedRect(totalsX - 10, doc.y, totalsWidth, 125, 8).fillOpacity(0.03).fill('#2563EB');
    doc.fillOpacity(1);
    
    doc.y += 12;
    doc.fontSize(9.5).font('Helvetica');
    
    // Subtotal
    doc.fillColor('#475569').text('Subtotal:', totalsX, doc.y, { width: 120 });
    doc.fillColor('#1E293B').font('Helvetica-Bold').text(`₹${invoice.subtotal.toFixed(2)}`, totalsX + 130, doc.y, { width: 82, align: 'right' });
    doc.y += 20;

    // Discount
    if (invoice.discount > 0) {
      doc.font('Helvetica').fillColor('#DC2626').text('Discount:', totalsX, doc.y, { width: 120 });
      doc.font('Helvetica-Bold').text(`- ₹${invoice.discount.toFixed(2)}`, totalsX + 130, doc.y, { width: 82, align: 'right' });
      doc.y += 20;
    }

    // Tax
    if (invoice.tax > 0) {
      doc.font('Helvetica').fillColor('#475569').text('Tax (GST):', totalsX, doc.y, { width: 120 });
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`₹${invoice.tax.toFixed(2)}`, totalsX + 130, doc.y, { width: 82, align: 'right' });
      doc.y += 20;
    }

    doc.y += 5;
    
    // Total amount badge
    doc.roundedRect(totalsX - 10, doc.y, totalsWidth, 40, 10).fill('#2563EB');
    doc
      .fontSize(11.5)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Total Amount', totalsX + 5, doc.y + 7, { width: 110 });
    doc
      .fontSize(15)
      .text(`₹${invoice.totalAmount.toFixed(2)}`, totalsX + 5, doc.y + 21, { width: 202, align: 'right' });

    doc.y += 50;

    // Payment status badges
    if (invoice.paidAmount > 0 || invoice.balanceAmount > 0) {
      const badgeY = doc.y;
      const badgeWidth = (totalsWidth - 10) / 2;
      
      if (invoice.paidAmount > 0) {
        doc.roundedRect(totalsX - 10, badgeY, badgeWidth, 35, 6).fill('#D1FAE5');
        doc.fontSize(8.5).fillColor('#065F46').font('Helvetica-Bold')
          .text('✓ Paid', totalsX - 5, badgeY + 7, { width: badgeWidth - 10 });
        doc.fontSize(11)
          .text(`₹${invoice.paidAmount.toFixed(2)}`, totalsX - 5, badgeY + 19, { width: badgeWidth - 10 });
      }
      
      if (invoice.balanceAmount > 0) {
        const balanceX = invoice.paidAmount > 0 ? totalsX + badgeWidth : totalsX - 10;
        doc.roundedRect(balanceX, badgeY, badgeWidth, 35, 6).fill('#FEE2E2');
        doc.fontSize(8.5).fillColor('#991B1B').font('Helvetica-Bold')
          .text('Balance', balanceX + 5, badgeY + 7, { width: badgeWidth - 10 });
        doc.fontSize(11)
          .text(`₹${invoice.balanceAmount.toFixed(2)}`, balanceX + 5, badgeY + 19, { width: badgeWidth - 10 });
      }
      
      doc.y += 45;
    }

    // Notes section
    if (invoice.notes) {
      doc.y += 8;
      doc.roundedRect(40, doc.y, 532, 7, 4).fillOpacity(0.08).fill('#2563EB');
      doc.fillOpacity(1);
      doc.y += 2;
      doc.fontSize(9.5).fillColor('#1E293B').font('Helvetica-Bold').text('Additional Notes', 48, doc.y);
      doc.y += 16;
      doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(invoice.notes, 48, doc.y, { width: 516, lineGap: 2 });
      doc.y += 25;
    }

    // Footer - always on same page, positioned absolutely if space available
    const footerY = 740;
    if (doc.y < footerY - 10) {
      drawModernFooter(doc, footerY, '#2563EB', '✨ Thank you for choosing Hospital CRM - Excellence in Healthcare');
    } else {
      // If not enough space, add new page
      doc.addPage();
      drawModernFooter(doc, 740, '#2563EB', '✨ Thank you for choosing Hospital CRM - Excellence in Healthcare');
    }

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

// ============================================
// PRESCRIPTION PDF GENERATOR (ULTRA-MODERN)
// ============================================

export const generatePrescriptionPDF = async (prescriptionId: string, res: Response) => {
  try {
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

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=prescription-${prescription.prescriptionNumber}.pdf`
    );

    doc.pipe(res);

    // Ultra-modern header
    drawModernHeader(doc, 'Rx', 'Medical Prescription', '#8B5CF6', '#7C3AED');
    doc.y = 140;

    // Info cards
    const prescriptionInfo = [
      `Rx No: ${prescription.prescriptionNumber}`,
      `Date: ${new Date(prescription.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      prescription.validUntil ? `Valid Until: ${new Date(prescription.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : '',
      `Status: ${prescription.status}`
    ].filter(Boolean);

    const patientInfo = [
      `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`,
      prescription.patient.user.dateOfBirth ? `Age: ${Math.floor((Date.now() - new Date(prescription.patient.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` : '',
      prescription.patient.user.gender ? `Gender: ${prescription.patient.user.gender}` : '',
      prescription.patient.user.phone || ''
    ].filter(Boolean);

    const doctorInfo = [
      `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
      prescription.doctor.specialization || '',
      prescription.doctor.licenseNumber ? `License: ${prescription.doctor.licenseNumber}` : '',
      prescription.doctor.user.phone || ''
    ].filter(Boolean);

    const cardHeight = Math.max(prescriptionInfo.length, patientInfo.length, doctorInfo.length) * 17 + 60;

    drawPremiumCard(doc, 40, 150, 168, cardHeight, 'Prescription', prescriptionInfo, '#8B5CF6', '📋');
    drawPremiumCard(doc, 220, 150, 168, cardHeight, 'Patient', patientInfo, '#EC4899', '👤');
    drawPremiumCard(doc, 400, 150, 172, cardHeight, 'Prescribed By', doctorInfo, '#10B981', '👨‍⚕️');

    doc.y = 150 + cardHeight + 30;

    // Diagnosis
    if (prescription.diagnosis) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#8B5CF6');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#5B21B6').font('Helvetica-Bold').text('🔍 Diagnosis', 48, doc.y);
      doc.y += 20;
      doc.fontSize(10).fillColor('#1E293B').font('Helvetica').text(prescription.diagnosis, 48, doc.y, { width: 516 });
      doc.y += 35;
    }

    // Medications header
    doc.roundedRect(40, doc.y, 532, 42, 10).fill('#F5F3FF');
    doc.roundedRect(40, doc.y, 532, 42, 10).lineWidth(1).strokeOpacity(0.1).stroke('#8B5CF6');
    doc
      .fontSize(14)
      .fillColor('#5B21B6')
      .font('Helvetica-Bold')
      .text('💊 Prescribed Medications', 55, doc.y + 13);
    doc.y += 52;

    // Medications
    prescription.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#FAF5FF';
      const boxHeight = 95 + (item.instructions ? 18 : 0);
      
      doc.roundedRect(40, doc.y, 532, boxHeight, 10).fill(bgColor);
      doc.roundedRect(40, doc.y, 532, boxHeight, 10).lineWidth(1).strokeOpacity(0.08).stroke('#8B5CF6');
      
      // Medication number badge
      doc.circle(60, doc.y + 20, 14).fillOpacity(0.9).fill('#8B5CF6');
      doc.circle(60, doc.y + 20, 12).fillOpacity(0.2).fill('#FFFFFF');
      doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold').text(`${index + 1}`, 55, doc.y + 13);
      
      // Medication name
      doc
        .fontSize(13)
        .fillColor('#5B21B6')
        .font('Helvetica-Bold')
        .text(item.medication.name, 85, doc.y + 12);
      
      if (item.medication.genericName) {
        doc
          .fontSize(9)
          .fillColor('#64748B')
          .font('Helvetica')
          .text(`(${item.medication.genericName})`, 85, doc.y + 28);
      }
      
      // Dosage grid with modern styling
      const detailsY = doc.y + 48;
      doc.fontSize(9.5).fillColor('#475569').font('Helvetica');
      
      // Grid backgrounds
      doc.roundedRect(85, detailsY, 220, 32, 6).fillOpacity(0.08).fill('#8B5CF6');
      doc.roundedRect(315, detailsY, 247, 32, 6).fillOpacity(0.08).fill('#8B5CF6');
      doc.fillOpacity(1);
      
      doc.text('Dosage:', 95, detailsY + 5);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(item.dosage, 95, detailsY + 18);
      
      doc.font('Helvetica').fillColor('#475569').text('Frequency:', 190, detailsY + 5);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(item.frequency, 190, detailsY + 18);
      
      doc.font('Helvetica').fillColor('#475569').text('Duration:', 325, detailsY + 5);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(item.duration, 325, detailsY + 18);
      
      doc.font('Helvetica').fillColor('#475569').text('Route:', 450, detailsY + 5);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(item.route || 'Oral', 450, detailsY + 18);
      
      // Instructions
      if (item.instructions) {
        doc
          .fontSize(9)
          .fillColor('#7C3AED')
          .font('Helvetica')
          .text(`ℹ️ ${item.instructions}`, 85, detailsY + 38, { width: 477 });
      }
      
      doc.y += boxHeight + 12;
    });

    // Notes
    if (prescription.notes) {
      doc.y += 10;
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#F59E0B');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(10).fillColor('#92400E').font('Helvetica-Bold').text('📝 Additional Notes', 48, doc.y);
      doc.y += 20;
      doc.fontSize(9).fillColor('#475569').font('Helvetica').text(prescription.notes, 48, doc.y, { width: 516 });
      doc.y += 30;
    }

    // Important instructions
    doc.roundedRect(40, doc.y, 532, 95, 10).fill('#FEF2F2');
    doc.roundedRect(40, doc.y, 532, 95, 10).lineWidth(1.5).strokeOpacity(0.3).stroke('#EF4444');
    doc
      .fontSize(11)
      .fillColor('#991B1B')
      .font('Helvetica-Bold')
      .text('⚠️ Important Instructions', 55, doc.y + 12);
    
    doc.fontSize(9).fillColor('#7F1D1D').font('Helvetica');
    const instructions = [
      '• Take medications exactly as prescribed by your doctor',
      '• Complete the full course even if you feel better',
      '• Do not share your medications with others',
      '• Contact your doctor immediately if you experience any adverse effects',
      '• Store medications as directed, away from children and pets'
    ];
    
    instructions.forEach((instruction, i) => {
      doc.text(instruction, 55, doc.y + 32 + i * 13);
    });

    // Modern footer
    drawModernFooter(doc, 740, '#8B5CF6', '💜 Your Health, Our Priority - Hospital CRM');

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

// ============================================
// MEDICAL RECORD PDF GENERATOR (ULTRA-MODERN)
// ============================================

export const generateMedicalRecordPDF = async (recordId: string, res: Response) => {
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
        diagnoses: true,
        vitalSigns: true,
      },
    });

    if (!record) {
      throw new Error('Medical record not found');
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=medical-record-${record.id.substring(0, 8)}.pdf`
    );

    doc.pipe(res);

    // Ultra-modern header
    drawModernHeader(doc, 'MEDICAL RECORD', 'Confidential Document', '#10B981', '#059669');
    doc.y = 140;

    // Confidential banner
    doc.roundedRect(40, 140, 532, 38, 10).fill('#FEF2F2');
    doc.roundedRect(40, 140, 532, 38, 10).lineWidth(2).strokeOpacity(0.3).stroke('#DC2626');
    doc.roundedRect(40, 140, 532, 8, 10).fill('#DC2626');
    doc
      .fontSize(12)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('🔒 CONFIDENTIAL MEDICAL RECORD', 50, 150, { align: 'center', width: 512 });
    
    doc.y = 190;

    // Info cards
    const recordInfo = [
      `Type: ${record.recordType}`,
      `Date: ${new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      `ID: ${record.id.substring(0, 8).toUpperCase()}`,
      record.followUpDate ? `Follow-up: ${new Date(record.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''
    ].filter(Boolean);

    const patientInfo = [
      `${record.patient.user.firstName} ${record.patient.user.lastName}`,
      record.patient.user.dateOfBirth ? `Age: ${Math.floor((Date.now() - new Date(record.patient.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` : '',
      record.patient.user.gender ? `Gender: ${record.patient.user.gender}` : '',
      record.patient.user.phone || ''
    ].filter(Boolean);

    const doctorInfo = [
      `Dr. ${record.doctor.user.firstName} ${record.doctor.user.lastName}`,
      record.doctor.specialization || '',
      record.doctor.user.email || '',
      record.doctor.user.phone || ''
    ].filter(Boolean);

    const cardHeight = Math.max(recordInfo.length, patientInfo.length, doctorInfo.length) * 17 + 60;

    drawPremiumCard(doc, 40, 195, 168, cardHeight, 'Record Info', recordInfo, '#14B8A6', '📋');
    drawPremiumCard(doc, 220, 195, 168, cardHeight, 'Patient', patientInfo, '#EC4899', '👤');
    drawPremiumCard(doc, 400, 195, 172, cardHeight, 'Doctor', doctorInfo, '#8B5CF6', '👨‍⚕️');

    doc.y = 195 + cardHeight + 30;

    // Vital Signs
    if (record.vitalSigns && record.vitalSigns.length > 0) {
      const vital = record.vitalSigns[0];
      
      doc.roundedRect(40, doc.y, 532, 42, 10).fill('#ECFDF5');
      doc.roundedRect(40, doc.y, 532, 42, 10).lineWidth(1).strokeOpacity(0.1).stroke('#10B981');
      doc
        .fontSize(12)
        .fillColor('#065F46')
        .font('Helvetica-Bold')
        .text('💓 Vital Signs', 55, doc.y + 14);
      doc.y += 52;

      const vitalsY = doc.y;
      const vitalsList = [
        vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? `BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` : null,
        vital.heartRate ? `Pulse: ${vital.heartRate} bpm` : null,
        vital.temperature ? `Temp: ${vital.temperature}°C` : null,
        vital.respiratoryRate ? `RR: ${vital.respiratoryRate}/min` : null,
        vital.oxygenSaturation ? `SpO2: ${vital.oxygenSaturation}%` : null,
        vital.weight ? `Weight: ${vital.weight} kg` : null,
        vital.height ? `Height: ${vital.height} cm` : null,
        vital.bmi ? `BMI: ${vital.bmi}` : null,
      ].filter(Boolean);

      vitalsList.forEach((item, index) => {
        const x = 50 + (index % 4) * 133;
        const y = vitalsY + Math.floor(index / 4) * 35;
        
        doc.roundedRect(x, y, 120, 30, 6).fillOpacity(0.08).fill('#10B981');
        doc.fillOpacity(1);
        doc.fontSize(9).fillColor('#475569').font('Helvetica-Bold').text(item!, x + 10, y + 10);
      });

      doc.y = vitalsY + Math.ceil(vitalsList.length / 4) * 35 + 20;
    }

    // Chief Complaint
    if (record.chiefComplaint) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#3B82F6');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#1E40AF').font('Helvetica-Bold').text('🗣️ Chief Complaint', 48, doc.y);
      doc.y += 20;
      doc.fontSize(10).fillColor('#1E293B').font('Helvetica').text(record.chiefComplaint, 48, doc.y, { width: 516 });
      doc.y += 35;
    }

    // Present Illness
    if (record.presentIllness) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#6366F1');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#4338CA').font('Helvetica-Bold').text('📖 History of Present Illness', 48, doc.y);
      doc.y += 20;
      doc.fontSize(10).fillColor('#1E293B').font('Helvetica').text(record.presentIllness, 48, doc.y, { width: 516 });
      doc.y += 35;
    }

    // Examination
    if (record.examination) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#F59E0B');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#92400E').font('Helvetica-Bold').text('🔬 Physical Examination', 48, doc.y);
      doc.y += 20;
      doc.fontSize(10).fillColor('#1E293B').font('Helvetica').text(record.examination, 48, doc.y, { width: 516 });
      doc.y += 35;
    }

    // Primary Diagnosis
    if (record.diagnosis) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#EF4444');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#991B1B').font('Helvetica-Bold').text('🎯 Primary Diagnosis', 48, doc.y);
      doc.y += 20;
      doc.fontSize(11).fillColor('#0F172A').font('Helvetica-Bold').text(record.diagnosis, 48, doc.y, { width: 516 });
      doc.y += 35;
    }

    // Detailed Diagnoses
    if (record.diagnoses && record.diagnoses.length > 0) {
      doc.roundedRect(40, doc.y, 532, 32, 10).fill('#FEF3C7');
      doc.roundedRect(40, doc.y, 532, 32, 10).lineWidth(1).strokeOpacity(0.1).stroke('#F59E0B');
      doc.fontSize(11).fillColor('#78350F').font('Helvetica-Bold').text('📊 Detailed Diagnoses', 55, doc.y + 10);
      doc.y += 42;

      record.diagnoses.forEach((diagnosis, index) => {
        const bgColor = index % 2 === 0 ? '#FFFBEB' : '#FEF3C7';
        doc.roundedRect(40, doc.y, 532, 60, 8).fill(bgColor);
        doc.roundedRect(40, doc.y, 532, 60, 8).lineWidth(1).strokeOpacity(0.08).stroke('#F59E0B');
        
        // Number badge
        doc.circle(58, doc.y + 18, 12).fillOpacity(0.9).fill('#F59E0B');
        doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica-Bold').text(`${index + 1}`, 53, doc.y + 11);
        
        doc
          .fontSize(11)
          .fillColor('#78350F')
          .font('Helvetica-Bold')
          .text(diagnosis.diagnosisName, 80, doc.y + 12);
        
        const detailsY = doc.y + 32;
        doc.fontSize(9).fillColor('#451A03').font('Helvetica');
        
        if (diagnosis.icdCode) {
          doc.text(`ICD: ${diagnosis.icdCode}`, 80, detailsY);
        }
        if (diagnosis.diagnosisType) {
          doc.text(`Type: ${diagnosis.diagnosisType}`, 200, detailsY);
        }
        if (diagnosis.severity) {
          doc.text(`Severity: ${diagnosis.severity}`, 340, detailsY);
        }
        if (diagnosis.status) {
          doc.text(`Status: ${diagnosis.status}`, 480, detailsY);
        }
        
        doc.y += 68;
      });
    }

    // Treatment Plan
    if (record.treatment) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#10B981');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#065F46').font('Helvetica-Bold').text('💊 Treatment Plan', 48, doc.y);
      doc.y += 20;
      doc.fontSize(10).fillColor('#1E293B').font('Helvetica').text(record.treatment, 48, doc.y, { width: 516 });
      doc.y += 35;
    }

    // Notes
    if (record.notes) {
      doc.roundedRect(40, doc.y, 532, 8, 4).fillOpacity(0.08).fill('#6366F1');
      doc.fillOpacity(1);
      doc.y += 5;
      doc.fontSize(11).fillColor('#3730A3').font('Helvetica-Bold').text('📝 Additional Notes', 48, doc.y);
      doc.y += 20;
      doc.fontSize(10).fillColor('#1E293B').font('Helvetica').text(record.notes, 48, doc.y, { width: 516 });
    }

    // Modern footer
    drawModernFooter(doc, 740, '#10B981', '🔒 Confidential Medical Record - Unauthorized access prohibited');

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

// ============================================
// LAB TEST REPORT PDF GENERATOR
// ============================================

export const generateLabReportPDF = async (testId: string, res: Response) => {
  try {
    // Fetch lab test with all relations
    const labTest = await prisma.labTest.findUnique({
      where: { id: testId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!labTest) {
      throw new Error('Lab test not found');
    }

    // Fetch doctor separately if doctorId exists
    let doctor: any = null;
    if (labTest.doctorId) {
      doctor = await prisma.doctor.findUnique({
        where: { id: labTest.doctorId },
        include: {
          user: true,
        },
      });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 48 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=lab-report-${labTest.testNumber}.pdf`
    );

    doc.pipe(res);

    // Modern header with medical theme
    drawModernHeader(
      doc,
      'LABORATORY TEST REPORT',
      'Comprehensive Diagnostic Analysis',
      '#0EA5E9',
      '#0284C7'
    );

    doc.y = 130;

    // Report metadata badge
    const metaY = doc.y;
    doc.roundedRect(48, metaY, 260, 50, 8).fillOpacity(0.05).fill('#0EA5E9');
    doc.fillOpacity(1);

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('REPORT NUMBER', 58, metaY + 10)
      .fontSize(13)
      .fillColor('#0F172A')
      .text(labTest.testNumber, 58, metaY + 26);

    doc.roundedRect(320, metaY, 244, 50, 8).fillOpacity(0.05).fill('#0EA5E9');
    doc.fillOpacity(1);

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('REPORT DATE', 330, metaY + 10)
      .fontSize(13)
      .fillColor('#0F172A')
      .text(
        labTest.resultDate
          ? new Date(labTest.resultDate).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Pending',
        330,
        metaY + 26
      );

    doc.y = metaY + 70;

    // Patient Information Section
    doc
      .fontSize(14)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text('PATIENT INFORMATION', 48, doc.y);

    doc.y += 15;
    const patientBoxY = doc.y;

    // Patient info with modern styling
    doc.roundedRect(48, patientBoxY, 516, 90, 10).fillOpacity(0.03).fill('#0EA5E9').strokeColor('#E0F2FE').lineWidth(1).stroke();
    doc.fillOpacity(1);

    // Left column
    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('Patient ID', 62, patientBoxY + 18)
      .fontSize(11)
      .fillColor('#0F172A')
      .font('Helvetica')
      .text(labTest.patient.patientId, 62, patientBoxY + 34);

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('Patient Name', 200, patientBoxY + 18)
      .fontSize(11)
      .fillColor('#0F172A')
      .font('Helvetica')
      .text(
        `${labTest.patient.user.firstName} ${labTest.patient.user.lastName}`,
        200,
        patientBoxY + 34
      );

    // Right column
    if (labTest.patient.user.gender) {
      doc
        .fontSize(9)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('Gender', 380, patientBoxY + 18)
        .fontSize(11)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(labTest.patient.user.gender, 380, patientBoxY + 34);
    }

    if (labTest.patient.user.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - new Date(labTest.patient.user.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      );
      doc
        .fontSize(9)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('Age', 480, patientBoxY + 18)
        .fontSize(11)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(`${age} yrs`, 480, patientBoxY + 34);
    }

    if (labTest.patient.user.phone) {
      doc
        .fontSize(9)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('Contact', 62, patientBoxY + 58)
        .fontSize(11)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(labTest.patient.user.phone, 62, patientBoxY + 74);
    }

    doc.y = patientBoxY + 110;

    // Test Information Section
    doc
      .fontSize(14)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text('TEST INFORMATION', 48, doc.y);

    doc.y += 15;
    const testBoxY = doc.y;

    doc.roundedRect(48, testBoxY, 516, 70, 10).fillOpacity(0.03).fill('#0EA5E9').strokeColor('#E0F2FE').lineWidth(1).stroke();
    doc.fillOpacity(1);

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('Test Name', 62, testBoxY + 15)
      .fontSize(12)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text(labTest.testName, 62, testBoxY + 32);

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('Category', 350, testBoxY + 15)
      .fontSize(11)
      .fillColor('#0F172A')
      .font('Helvetica')
      .text(labTest.testCategory, 350, testBoxY + 32);

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('Ordered Date', 62, testBoxY + 54)
      .fontSize(10)
      .fillColor('#0F172A')
      .font('Helvetica')
      .text(new Date(labTest.orderedDate).toLocaleDateString(), 160, testBoxY + 54);

    if (labTest.collectionDate) {
      doc
        .fontSize(9)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('Collection Date', 280, testBoxY + 54)
        .fontSize(10)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(new Date(labTest.collectionDate).toLocaleDateString(), 400, testBoxY + 54);
    }

    doc.y = testBoxY + 90;

    // Test Results Section
    doc
      .fontSize(14)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text('TEST RESULTS', 48, doc.y);

    doc.y += 15;
    const resultsBoxY = doc.y;

    // Results with highlighted background
    const resultBgColor = labTest.isCritical ? '#FEE2E2' : '#F0F9FF';
    const resultBorderColor = labTest.isCritical ? '#FCA5A5' : '#BAE6FD';

    doc
      .roundedRect(48, resultsBoxY, 516, 120, 10)
      .fillOpacity(labTest.isCritical ? 0.3 : 0.5)
      .fill(resultBgColor)
      .strokeColor(resultBorderColor)
      .lineWidth(2)
      .stroke();
    doc.fillOpacity(1);

    // Critical badge if applicable
    if (labTest.isCritical) {
      doc
        .roundedRect(460, resultsBoxY + 15, 90, 25, 12)
        .fill('#DC2626');
      doc
        .fontSize(10)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('⚠ CRITICAL', 470, resultsBoxY + 22);
    }

    doc
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('RESULT VALUE', 62, resultsBoxY + 20)
      .fontSize(16)
      .fillColor(labTest.isCritical ? '#DC2626' : '#0F172A')
      .font('Helvetica-Bold')
      .text(labTest.results || 'Pending', 62, resultsBoxY + 38);

    if (labTest.normalRange) {
      doc
        .fontSize(9)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('Normal Range', 62, resultsBoxY + 68)
        .fontSize(11)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(labTest.normalRange, 160, resultsBoxY + 68);
    }

    if (labTest.interpretation) {
      doc
        .fontSize(9)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('Interpretation', 62, resultsBoxY + 92)
        .fontSize(10)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(labTest.interpretation, 62, resultsBoxY + 108, { width: 480 });
    }

    doc.y = resultsBoxY + 140;

    // Lab Notes
    if (labTest.labNotes) {
      doc
        .fontSize(12)
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .text('LABORATORY NOTES', 48, doc.y);

      doc.y += 12;
      doc.roundedRect(48, doc.y, 516, 50, 8).fillOpacity(0.03).fill('#94A3B8');
      doc.fillOpacity(1);

      doc
        .fontSize(10)
        .fillColor('#475569')
        .font('Helvetica')
        .text(labTest.labNotes, 62, doc.y + 15, { width: 488 });

      doc.y += 65;
    }

    // Signatures Section
    const sigY = 680;
    doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(48, sigY).lineTo(564, sigY).stroke();

    doc
      .fontSize(11)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text('AUTHORIZED SIGNATURES', 48, sigY + 15);

    // Performed by
    if (labTest.performedBy) {
      doc.roundedRect(48, sigY + 40, 150, 50, 8).fillOpacity(0.03).fill('#0EA5E9');
      doc.fillOpacity(1);

      doc
        .fontSize(8)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('PERFORMED BY', 58, sigY + 48)
        .fontSize(10)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(labTest.performedBy, 58, sigY + 63);
    }

    // Verified by
    if (labTest.verifiedBy) {
      doc.roundedRect(210, sigY + 40, 150, 50, 8).fillOpacity(0.03).fill('#10B981');
      doc.fillOpacity(1);

      doc
        .fontSize(8)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('VERIFIED BY', 220, sigY + 48)
        .fontSize(10)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(labTest.verifiedBy, 220, sigY + 63);
    }

    // Ordered by
    if (doctor) {
      doc.roundedRect(372, sigY + 40, 192, 50, 8).fillOpacity(0.03).fill('#8B5CF6');
      doc.fillOpacity(1);

      doc
        .fontSize(8)
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .text('ORDERED BY', 382, sigY + 48)
        .fontSize(10)
        .fillColor('#0F172A')
        .font('Helvetica')
        .text(
          `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
          382,
          sigY + 63
        );

      if (doctor.specialization) {
        doc
          .fontSize(8)
          .fillColor('#64748B')
          .text(doctor.specialization, 382, sigY + 78);
      }
    }

    // Modern footer
    drawModernFooter(doc, 770, '#0EA5E9', '🔒 Confidential Laboratory Report - For Medical Use Only');

    doc.end();
  } catch (error) {
    console.error('Lab PDF generation error:', error);
    throw error;
  }
};
