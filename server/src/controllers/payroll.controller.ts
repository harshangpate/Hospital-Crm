import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all payroll records
export const getPayrollRecords = async (req: Request, res: Response) => {
  try {
    const { month, year, status, staffId } = req.query;

    const where: any = {};

    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: payrolls,
      count: payrolls.length,
    });
  } catch (error: any) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll records',
      error: error.message,
    });
  }
};

// Process payroll for a staff member
export const processPayroll = async (req: Request, res: Response) => {
  try {
    const {
      staffId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      overtimePay,
      bonus,
    } = req.body;

    if (!staffId || !month || !year || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, month, year, and basic salary are required',
      });
    }

    // Check if payroll already exists
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        staffId,
        month: parseInt(month),
        year: parseInt(year),
      },
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already processed for this month',
      });
    }

    // Calculate net salary
    const totalAllowances = allowances || 0;
    const totalDeductions = deductions || 0;
    const totalOvertime = overtimePay || 0;
    const totalBonus = bonus || 0;

    const grossSalary = parseFloat(basicSalary) + totalAllowances + totalOvertime + totalBonus;
    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payroll.create({
      data: {
        staffId,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: parseFloat(basicSalary),
        allowances: totalAllowances,
        deductions: totalDeductions,
        overtime: totalOvertime,
        bonus: totalBonus,
        netSalary,
        status: 'PROCESSED',
        generatedBy: (req as any).user.id,
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payroll processed successfully',
      data: payroll,
    });
  } catch (error: any) {
    console.error('Error processing payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payroll',
      error: error.message,
    });
  }
};

// Mark payroll as paid
export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: { id },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payroll.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Payroll already marked as paid',
      });
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payroll marked as paid',
      data: updatedPayroll,
    });
  } catch (error: any) {
    console.error('Error marking payroll as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payroll as paid',
      error: error.message,
    });
  }
};

// Get payroll statistics
export const getPayrollStats = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    const where: any = {};
    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);

    const [totalRecords, pending, processed, paid, totalAmount] = await Promise.all([
      prisma.payroll.count({ where }),
      prisma.payroll.count({ where: { ...where, status: 'PENDING' } }),
      prisma.payroll.count({ where: { ...where, status: 'PROCESSED' } }),
      prisma.payroll.count({ where: { ...where, status: 'PAID' } }),
      prisma.payroll.aggregate({
        where,
        _sum: {
          netSalary: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        pending,
        processed,
        paid,
        totalAmount: totalAmount._sum.netSalary || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payroll stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll statistics',
      error: error.message,
    });
  }
};

// Get payroll history for a staff member
export const getPayrollHistory = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;

    const payrolls = await prisma.payroll.findMany({
      where: { staffId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: payrolls,
      count: payrolls.length,
    });
  } catch (error: any) {
    console.error('Error fetching payroll history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll history',
      error: error.message,
    });
  }
};
