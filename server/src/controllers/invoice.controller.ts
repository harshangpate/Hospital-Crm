import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { sendInvoiceEmail } from '../utils/emailService';

// Create Invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      invoiceItems,
      dueDate,
      tax,
      discount,
      insuranceClaim,
      insuranceAmount,
      notes,
    } = req.body;

    // Validate required fields
    if (!patientId || !invoiceItems || invoiceItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and invoice items are required',
      });
    }

    // Generate unique invoice number
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Get count of invoices this month for sequential numbering
    const invoiceCount = await prisma.invoice.count({
      where: {
        invoiceDate: {
          gte: new Date(year, currentDate.getMonth(), 1),
          lt: new Date(year, currentDate.getMonth() + 1, 1),
        },
      },
    });
    
    const invoiceNumber = `INV-${year}${month}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = invoiceItems.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0
    );
    const taxAmount = tax || 0;
    const discountAmount = discount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const balanceAmount = totalAmount - (insuranceAmount || 0);

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        invoiceDate: currentDate,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount,
        paymentStatus: 'PENDING',
        insuranceClaim: insuranceClaim || false,
        insuranceAmount: insuranceAmount || null,
        insuranceApproved: insuranceClaim ? false : null,
        notes,
        invoiceItems: {
          create: invoiceItems.map((item: any) => ({
            itemType: item.itemType,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        invoiceItems: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Automatically send email with invoice PDF
    try {
      const patientEmail = invoice.patient.user.email;
      if (patientEmail) {
        await sendInvoiceEmail(invoice.id, patientEmail);
        console.log(`✅ Invoice email sent automatically to ${patientEmail}`);
      }
    } catch (emailError: any) {
      console.error('⚠️ Failed to send invoice email:', emailError.message);
      // Don't fail the request if email fails, just log it
    }

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
      emailSent: !!invoice.patient.user.email,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message,
    });
  }
};

// Get All Invoices with Filters
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      patientId,
      paymentStatus,
      fromDate,
      toDate,
      search,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build filters
    const where: Prisma.InvoiceWhereInput = {};

    if (patientId) {
      where.patientId = patientId as string;
    }

    if (paymentStatus) {
      // Handle comma-separated payment statuses
      const statuses = (paymentStatus as string).split(',').map(s => s.trim());
      if (statuses.length > 1) {
        where.paymentStatus = { in: statuses as any };
      } else {
        where.paymentStatus = paymentStatus as any;
      }
    }

    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) {
        where.invoiceDate.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.invoiceDate.lte = new Date(toDate as string);
      }
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        {
          patient: {
            user: {
              OR: [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          invoiceItems: true,
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message,
    });
  }
};

// Get Invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message,
    });
  }
};

// Update Invoice
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      dueDate,
      tax,
      discount,
      insuranceAmount,
      insuranceApproved,
      notes,
      invoiceItems,
    } = req.body;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { invoiceItems: true },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // If invoice is already paid, prevent editing
    if (existingInvoice.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a paid invoice',
      });
    }

    // Recalculate if items changed
    let updateData: any = {
      dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
      tax: tax !== undefined ? tax : existingInvoice.tax,
      discount: discount !== undefined ? discount : existingInvoice.discount,
      insuranceAmount: insuranceAmount !== undefined ? insuranceAmount : existingInvoice.insuranceAmount,
      insuranceApproved: insuranceApproved !== undefined ? insuranceApproved : existingInvoice.insuranceApproved,
      notes: notes !== undefined ? notes : existingInvoice.notes,
    };

    if (invoiceItems && invoiceItems.length > 0) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Calculate new totals
      const subtotal = invoiceItems.reduce(
        (sum: number, item: any) => sum + item.totalPrice,
        0
      );
      const taxAmount = updateData.tax;
      const discountAmount = updateData.discount;
      const totalAmount = subtotal + taxAmount - discountAmount;
      const balanceAmount = totalAmount - (updateData.insuranceAmount || 0) - existingInvoice.paidAmount;

      updateData = {
        ...updateData,
        subtotal,
        totalAmount,
        balanceAmount,
        invoiceItems: {
          create: invoiceItems.map((item: any) => ({
            itemType: item.itemType,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      };
    } else {
      // Recalculate totals without changing items
      const subtotal = existingInvoice.subtotal;
      const taxAmount = updateData.tax;
      const discountAmount = updateData.discount;
      const totalAmount = subtotal + taxAmount - discountAmount;
      const balanceAmount = totalAmount - (updateData.insuranceAmount || 0) - existingInvoice.paidAmount;

      updateData = {
        ...updateData,
        totalAmount,
        balanceAmount,
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        invoiceItems: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message,
    });
  }
};

// Delete Invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // If invoice is paid, prevent deletion
    if (existingInvoice.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a paid invoice',
      });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message,
    });
  }
};

// Process Payment
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount and method are required',
      });
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Calculate new paid amount and balance
    const newPaidAmount = existingInvoice.paidAmount + Number(amount);
    const newBalanceAmount = existingInvoice.totalAmount - newPaidAmount;

    // Determine payment status
    let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING';
    if (newBalanceAmount <= 0) {
      paymentStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    } else {
      paymentStatus = 'PENDING';
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, newBalanceAmount),
        paymentStatus,
        paymentMethod,
        paymentDate: paymentStatus === 'PAID' ? new Date() : existingInvoice.paymentDate,
        transactionId: transactionId || existingInvoice.transactionId,
        notes: notes ? `${existingInvoice.notes || ''}\n${notes}` : existingInvoice.notes,
      },
      include: {
        invoiceItems: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Automatically send email if invoice is fully paid
    if (paymentStatus === 'PAID') {
      try {
        const patientEmail = invoice.patient.user.email;
        if (patientEmail) {
          await sendInvoiceEmail(invoice.id, patientEmail);
          console.log(`✅ Paid invoice email sent automatically to ${patientEmail}`);
        }
      } catch (emailError: any) {
        console.error('⚠️ Failed to send paid invoice email:', emailError.message);
        // Don't fail the request if email fails, just log it
      }
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: invoice,
      emailSent: paymentStatus === 'PAID' && !!invoice.patient.user.email,
    });
  } catch (error: any) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

// Get Payment History
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const invoices = await prisma.invoice.findMany({
      where: {
        patientId,
        paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        paidAmount: true,
        paymentMethod: true,
        paymentDate: true,
        transactionId: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error: any) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message,
    });
  }
};

// Get Outstanding Balances
export const getOutstandingBalances = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [invoices, total, totalOutstanding] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
          balanceAmount: { gt: 0 },
        },
        skip,
        take,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { invoiceDate: 'asc' },
      }),
      prisma.invoice.count({
        where: {
          paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
          balanceAmount: { gt: 0 },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
          balanceAmount: { gt: 0 },
        },
        _sum: {
          balanceAmount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        totalOutstanding: totalOutstanding._sum.balanceAmount || 0,
      },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get outstanding balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching outstanding balances',
      error: error.message,
    });
  }
};

// Get Invoice Statistics
export const getInvoiceStats = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;

    const where: Prisma.InvoiceWhereInput = {};

    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) {
        where.invoiceDate.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.invoiceDate.lte = new Date(toDate as string);
      }
    }

    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      partiallyPaidInvoices,
      totalRevenue,
      totalOutstanding,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, paymentStatus: 'PAID' } }),
      prisma.invoice.count({ where: { ...where, paymentStatus: 'PENDING' } }),
      prisma.invoice.count({ where: { ...where, paymentStatus: 'PARTIALLY_PAID' } }),
      prisma.invoice.aggregate({
        where: { ...where, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...where, paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        _sum: { balanceAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        partiallyPaidInvoices,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalOutstanding: totalOutstanding._sum.balanceAmount || 0,
      },
    });
  } catch (error: any) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice statistics',
      error: error.message,
    });
  }
};

// Generate Invoice from Appointment
export const generateInvoiceFromAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check if invoice already exists for this appointment
    // Note: This requires adding appointmentId to Invoice model
    // For now, we'll create a new invoice

    // Generate invoice with consultation fee
    const consultationFee = 500; // Default consultation fee
    const invoiceItems = [
      {
        itemType: 'CONSULTATION',
        itemName: 'Doctor Consultation',
        description: `Consultation with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        quantity: 1,
        unitPrice: consultationFee,
        totalPrice: consultationFee,
      },
    ];

    const subtotal = consultationFee;
    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + tax;

    // Generate invoice number
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    const invoiceCount = await prisma.invoice.count({
      where: {
        invoiceDate: {
          gte: new Date(year, currentDate.getMonth(), 1),
          lt: new Date(year, currentDate.getMonth() + 1, 1),
        },
      },
    });
    
    const invoiceNumber = `INV-${year}${month}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: appointment.patientId,
        invoiceDate: currentDate,
        subtotal,
        tax,
        totalAmount,
        balanceAmount: totalAmount,
        paymentStatus: 'PENDING',
        notes: `Auto-generated invoice for appointment on ${appointment.appointmentDate.toLocaleDateString()}`,
        invoiceItems: {
          create: invoiceItems,
        },
      },
      include: {
        invoiceItems: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully from appointment',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Generate invoice from appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice from appointment',
      error: error.message,
    });
  }
};

// Download Invoice PDF
export const downloadInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await generateInvoicePDF(id, res);
  } catch (error: any) {
    console.error('Download invoice PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice PDF',
      error: error.message,
    });
  }
};

/**
 * Send invoice via email
 */
export const emailInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    await sendInvoiceEmail(id, email);

    res.status(200).json({
      success: true,
      message: `Invoice sent successfully to ${email}`,
    });
  } catch (error: any) {
    console.error('Email invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invoice email',
      error: error.message,
    });
  }
};
