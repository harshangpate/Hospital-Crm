import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all leave requests with optional filters
export const getLeaves = async (req: Request, res: Response) => {
  try {
    const { status, staffId, leaveType, startDate, endDate } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    if (startDate && endDate) {
      where.AND = [
        {
          startDate: {
            gte: new Date(startDate as string),
          },
        },
        {
          endDate: {
            lte: new Date(endDate as string),
          },
        },
      ];
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        appliedOn: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length,
    });
  } catch (error: any) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message,
    });
  }
};

// Apply for leave
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { staffId, leaveType, startDate, endDate, reason, documents } = req.body;

    // Validate required fields
    if (!staffId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, leave type, start date, end date, and reason are required',
      });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    let leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        staffId,
        year: currentYear,
      },
    });

    // Create leave balance if doesn't exist
    if (!leaveBalance) {
      leaveBalance = await prisma.leaveBalance.create({
        data: {
          staffId,
          year: currentYear,
          casualLeave: 12,
          sickLeave: 12,
          earnedLeave: 15,
          maternityLeave: 180,
          paternityLeave: 7,
        },
      });
    }

    // Validate leave balance
    const leaveTypeMapping: { [key: string]: keyof typeof leaveBalance } = {
      CASUAL: 'casualLeave',
      SICK: 'sickLeave',
      EARNED: 'earnedLeave',
      MATERNITY: 'maternityLeave',
      PATERNITY: 'paternityLeave',
    };

    const balanceField = leaveTypeMapping[leaveType];
    if (balanceField && (leaveBalance[balanceField] as number) < totalDays && leaveType !== 'UNPAID' && leaveType !== 'COMPENSATORY') {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType.toLowerCase()} leave balance. Available: ${leaveBalance[balanceField]}, Required: ${totalDays}`,
      });
    }

    // Check for overlapping leaves
    const overlappingLeaves = await prisma.leave.findMany({
      where: {
        staffId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for this period',
      });
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        staffId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING',
        appliedOn: new Date(),
        documents: documents || null,
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
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
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error: any) {
    console.error('Error applying leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for leave',
      error: error.message,
    });
  }
};

// Approve leave
export const approveLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not in pending status',
      });
    }

    // Update leave request
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedOn: new Date(),
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        staffId: leave.staffId,
        year: currentYear,
      },
    });

    if (leaveBalance && leave.leaveType !== 'UNPAID' && leave.leaveType !== 'COMPENSATORY') {
      const leaveTypeMapping: { [key: string]: keyof typeof leaveBalance } = {
        CASUAL: 'casualLeave',
        SICK: 'sickLeave',
        EARNED: 'earnedLeave',
        MATERNITY: 'maternityLeave',
        PATERNITY: 'paternityLeave',
      };

      const balanceField = leaveTypeMapping[leave.leaveType];
      if (balanceField) {
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            [balanceField]: Math.max(0, (leaveBalance[balanceField] as number) - leave.totalDays),
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: updatedLeave,
    });
  } catch (error: any) {
    console.error('Error approving leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request',
      error: error.message,
    });
  }
};

// Reject leave
export const rejectLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = (req as any).user.id;

    const leave = await prisma.leave.findUnique({
      where: { id },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not in pending status',
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: userId,
        approvedOn: new Date(),
        rejectionReason: rejectionReason || 'No reason provided',
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
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
      message: 'Leave request rejected',
      data: updatedLeave,
    });
  } catch (error: any) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request',
      error: error.message,
    });
  }
};

// Get leave balance for a staff member
export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { year } = req.query;

    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    let leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        staffId,
        year: targetYear,
      },
    });

    // Create default balance if doesn't exist
    if (!leaveBalance) {
      leaveBalance = await prisma.leaveBalance.create({
        data: {
          staffId,
          year: targetYear,
          casualLeave: 12,
          sickLeave: 12,
          earnedLeave: 15,
          maternityLeave: 180,
          paternityLeave: 7,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: leaveBalance,
    });
  } catch (error: any) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message,
    });
  }
};

// Get leave statistics
export const getLeaveStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.AND = [
        {
          startDate: {
            gte: new Date(startDate as string),
          },
        },
        {
          endDate: {
            lte: new Date(endDate as string),
          },
        },
      ];
    }

    if (department) {
      where.staff = {
        department,
      };
    }

    const [totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves, leavesByType] = await Promise.all([
      prisma.leave.count({ where }),
      prisma.leave.count({ where: { ...where, status: 'PENDING' } }),
      prisma.leave.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.leave.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.leave.groupBy({
        by: ['leaveType'],
        where,
        _count: {
          id: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        leavesByType,
      },
    });
  } catch (error: any) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message,
    });
  }
};

// Get leave history for a staff member
export const getLeaveHistory = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { year } = req.query;

    const where: any = { staffId };

    if (year) {
      const targetYear = parseInt(year as string);
      where.appliedOn = {
        gte: new Date(targetYear, 0, 1),
        lte: new Date(targetYear, 11, 31),
      };
    }

    const leaves = await prisma.leave.findMany({
      where,
      orderBy: {
        appliedOn: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length,
    });
  } catch (error: any) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave history',
      error: error.message,
    });
  }
};

// Cancel leave request
export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled',
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: updatedLeave,
    });
  } catch (error: any) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave request',
      error: error.message,
    });
  }
};
