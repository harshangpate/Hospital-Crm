import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { sendInvoiceEmail } from '../utils/emailService';

const prisma = new PrismaClient();

// Get all invoices with filters
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const {
      status,
      patientId,
      search,
      page = '1',
      limit = '20',
      sortBy = 'invoiceDate',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause
    const where: any = {};

    if (status && status !== 'ALL') {
      where.paymentStatus = status as PaymentStatus;
    }

    if (patientId) {
      where.patientId = patientId;
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
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
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
          invoiceItems: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
        },
        invoiceItems: {
          orderBy: {
            createdAt: 'asc',
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
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
};

// Create new invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { patientId, items, discount = 0, tax = 0, notes, dueDate } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and items are required',
      });
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const invoiceItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        itemType: item.itemType,
        itemName: item.itemName,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = ((subtotal - discountAmount) * tax) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount,
        balanceAmount: totalAmount,
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceItems: {
          create: invoiceItems,
        },
      },
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
        invoiceItems: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    });
  }
};

// Record payment
export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (invoice.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already fully paid',
      });
    }

    // Calculate new paid amount and balance
    const newPaidAmount = invoice.paidAmount + parseFloat(amount);
    const newBalanceAmount = invoice.totalAmount - newPaidAmount;

    // Determine payment status
    let paymentStatus: PaymentStatus;
    if (newBalanceAmount <= 0) {
      paymentStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    } else {
      paymentStatus = 'PENDING';
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount > 0 ? newBalanceAmount : 0,
        paymentStatus,
        paymentDate: paymentStatus === 'PAID' ? new Date() : invoice.paymentDate,
        paymentMethod: paymentMethod as PaymentMethod,
        transactionId: transactionId || null,
        notes: notes || invoice.notes,
      },
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
        invoiceItems: true,
      },
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message,
    });
  }
};

// Get billing statistics
export const getBillingStats = async (req: Request, res: Response) => {
  try {
    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      partialInvoices,
      totalRevenue,
      pendingAmount,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.invoice.count({ where: { paymentStatus: 'PAID' } }),
      prisma.invoice.count({ where: { paymentStatus: 'PARTIALLY_PAID' } }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          paymentStatus: {
            in: ['PENDING', 'PARTIALLY_PAID'],
          },
        },
        _sum: { balanceAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        pendingInvoices,
        paidInvoices,
        partialInvoices,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingAmount: pendingAmount._sum.balanceAmount || 0,
        collectedAmount: (totalRevenue._sum.totalAmount || 0) - (pendingAmount._sum.balanceAmount || 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing statistics',
      error: error.message,
    });
  }
};

// Add items to existing invoice
export const addInvoiceItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required',
      });
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Calculate new items total
    let additionalAmount = 0;
    const invoiceItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      additionalAmount += totalPrice;
      return {
        invoiceId: id,
        itemType: item.itemType,
        itemName: item.itemName,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    // Create invoice items
    await prisma.invoiceItem.createMany({
      data: invoiceItems,
    });

    // Update invoice totals
    const newSubtotal = invoice.subtotal + additionalAmount;
    const newTotalAmount = invoice.totalAmount + additionalAmount;
    const newBalanceAmount = newTotalAmount - invoice.paidAmount;

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        totalAmount: newTotalAmount,
        balanceAmount: newBalanceAmount,
      },
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
        invoiceItems: true,
      },
    });

    res.json({
      success: true,
      message: 'Items added to invoice successfully',
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error adding invoice items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add invoice items',
      error: error.message,
    });
  }
};

// Update daily bed charges for active admissions
export const updateDailyBedCharges = async (req: Request, res: Response) => {
  try {
    // Get all active admissions
    const activeAdmissions = await prisma.admission.findMany({
      where: {
        status: 'ADMITTED',
        bed: {
          isNot: null,
        },
      },
      include: {
        bed: {
          include: {
            ward: true,
          },
        },
        patient: true,
      },
    });

    const updates = [];

    for (const admission of activeAdmissions) {
      if (!admission.bed) continue;

      // Calculate days since admission
      const admissionDate = new Date(admission.admissionDate);
      const now = new Date();
      const daysSinceAdmission = Math.ceil(
        (now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find invoice for this admission
      const invoice = await prisma.invoice.findFirst({
        where: {
          patientId: admission.patientId,
          invoiceNumber: { contains: admission.admissionNumber },
        },
        include: {
          invoiceItems: true,
        },
      });

      if (!invoice) continue;

      // Count existing bed charge items
      const existingBedDays = invoice.invoiceItems.filter((item) =>
        item.itemName.includes('Bed Charges')
      ).length;

      // Add missing days
      if (daysSinceAdmission > existingBedDays) {
        const daysToAdd = daysSinceAdmission - existingBedDays;
        const chargesPerDay = admission.bed.ward.chargesPerDay;

        // Add new invoice items for missing days
        for (let day = existingBedDays + 1; day <= daysSinceAdmission; day++) {
          // Calculate the service date for this day
          const serviceDate = new Date(admissionDate);
          serviceDate.setDate(admissionDate.getDate() + (day - 1));

          await prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              itemName: `Bed Charges - Day ${day}`,
              description: `${admission.bed.ward.wardName} - ${admission.bed.ward.wardType} (${admission.bed.bedNumber})`,
              itemType: 'BED_CHARGES',
              quantity: 1,
              unitPrice: chargesPerDay,
              totalPrice: chargesPerDay,
              serviceDate: serviceDate,
            },
          });
        }

        // Update invoice totals
        const newTotalAmount = invoice.totalAmount + (daysToAdd * chargesPerDay);
        const newBalanceAmount = newTotalAmount - invoice.paidAmount;

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            totalAmount: newTotalAmount,
            balanceAmount: newBalanceAmount,
            paymentStatus:
              newBalanceAmount <= 0
                ? PaymentStatus.PAID
                : invoice.paidAmount > 0
                ? PaymentStatus.PARTIALLY_PAID
                : PaymentStatus.PENDING,
          },
        });

        updates.push({
          admissionNumber: admission.admissionNumber,
          invoiceNumber: invoice.invoiceNumber,
          daysAdded: daysToAdd,
          additionalCharges: daysToAdd * chargesPerDay,
        });
      }
    }

    res.json({
      success: true,
      message: `Updated bed charges for ${updates.length} admissions`,
      data: updates,
    });
  } catch (error: any) {
    console.error('Error updating daily bed charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily bed charges',
      error: error.message,
    });
  }
};

// Download invoice as PDF
export const downloadInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Generate and send PDF
    await generateInvoicePDF(id, res);
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF',
      error: error.message,
    });
  }
};

// Send invoice via email
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

    // Verify invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
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

    // Send email with invoice PDF
    await sendInvoiceEmail(id, email);

    res.json({
      success: true,
      message: `Invoice sent successfully to ${email}`,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        sentTo: email,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice email',
      error: error.message,
    });
  }
};
