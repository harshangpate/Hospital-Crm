import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all shifts
export const getShifts = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        shiftAssignments: {
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: shifts,
      count: shifts.length,
    });
  } catch (error: any) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts',
      error: error.message,
    });
  }
};

// Create shift
export const createShift = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, isActive } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Name, start time, and end time are required',
      });
    }

    // Calculate duration in hours
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (duration < 0) duration += 24; // Handle overnight shifts

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        duration,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  } catch (error: any) {
    console.error('Error creating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shift',
      error: error.message,
    });
  }
};

// Update shift
export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, isActive } = req.body;

    const shift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    let duration = shift.duration;
    if (startTime && endTime) {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (duration < 0) duration += 24;
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        duration,
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: updatedShift,
    });
  } catch (error: any) {
    console.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift',
      error: error.message,
    });
  }
};

// Assign shift to staff
export const assignShift = async (req: Request, res: Response) => {
  try {
    const { staffId, shiftId, date } = req.body;

    if (!staffId || !shiftId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, shift ID, and date are required',
      });
    }

    // Check if assignment already exists
    const existing = await prisma.shiftAssignment.findFirst({
      where: {
        staffId,
        date: new Date(date),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Staff already has a shift assigned for this date',
      });
    }

    const assignment = await prisma.shiftAssignment.create({
      data: {
        staffId,
        shiftId,
        date: new Date(date),
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shift: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Shift assigned successfully',
      data: assignment,
    });
  } catch (error: any) {
    console.error('Error assigning shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign shift',
      error: error.message,
    });
  }
};

// Get shift assignments
export const getShiftAssignments = async (req: Request, res: Response) => {
  try {
    const { staffId, shiftId, startDate, endDate } = req.query;

    const where: any = {};
    if (staffId) where.staffId = staffId;
    if (shiftId) where.shiftId = shiftId;
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shift: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: assignments,
      count: assignments.length,
    });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift assignments',
      error: error.message,
    });
  }
};

// Delete shift assignment
export const deleteShiftAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.shiftAssignment.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Shift assignment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift assignment',
      error: error.message,
    });
  }
};
