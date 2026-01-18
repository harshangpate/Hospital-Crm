import { Request, Response } from 'express';
import prisma from '../config/database';
import { AttendanceStatus } from '@prisma/client';

// Get attendance records with filters
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const {
      staffId,
      date,
      startDate,
      endDate,
      status,
      department,
      page = '1',
      limit = '100'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (staffId) {
      where.staffId = staffId as string;
    }

    if (date) {
      const selectedDate = new Date(date as string);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: selectedDate,
        lt: nextDay
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (status && status !== 'ALL') {
      where.status = status as AttendanceStatus;
    }

    if (department) {
      where.staff = {
        department: { contains: department as string, mode: 'insensitive' }
      };
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: {
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true
                }
              }
            }
          }
        }
      }),
      prisma.attendance.count({ where })
    ]);

    res.json({
      success: true,
      data: attendance,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

// Mark attendance for a staff member
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId, date, status, checkIn, checkOut, remarks } = req.body;
    const markedBy = (req as any).user?.id;

    if (!staffId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, date, and status are required'
      });
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Calculate work hours if both check-in and check-out are provided
    let workHours = null;
    let lateBy = null;
    let earlyLeave = null;
    
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate if late (assuming 9 AM is standard time)
      const standardCheckIn = new Date(checkInTime);
      standardCheckIn.setHours(9, 0, 0, 0);
      if (checkInTime > standardCheckIn) {
        lateBy = Math.floor((checkInTime.getTime() - standardCheckIn.getTime()) / (1000 * 60));
      }
      
      // Calculate if early leave (assuming 5 PM is standard time)
      const standardCheckOut = new Date(checkOutTime);
      standardCheckOut.setHours(17, 0, 0, 0);
      if (checkOutTime < standardCheckOut) {
        earlyLeave = Math.floor((standardCheckOut.getTime() - checkOutTime.getTime()) / (1000 * 60));
      }
    } else if (checkIn && !checkOut) {
      // If only check-in is provided, calculate late arrival
      const checkInTime = new Date(checkIn);
      const standardCheckIn = new Date(checkInTime);
      standardCheckIn.setHours(9, 0, 0, 0);
      if (checkInTime > standardCheckIn) {
        lateBy = Math.floor((checkInTime.getTime() - standardCheckIn.getTime()) / (1000 * 60));
      }
    }

    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        staffId_date: {
          staffId,
          date: attendanceDate
        }
      },
      update: {
        status,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        workHours,
        lateBy,
        earlyLeave,
        remarks,
        markedBy
      },
      create: {
        staffId,
        date: attendanceDate,
        status,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        workHours,
        lateBy,
        earlyLeave,
        remarks,
        markedBy
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Mark bulk attendance
export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { date, staffIds, status } = req.body;
    const markedBy = (req as any).user?.id;

    if (!date || !staffIds || !Array.isArray(staffIds) || !status) {
      return res.status(400).json({
        success: false,
        message: 'Date, staff IDs array, and status are required'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendanceRecords = await Promise.all(
      staffIds.map(staffId =>
        prisma.attendance.upsert({
          where: {
            staffId_date: {
              staffId,
              date: attendanceDate
            }
          },
          update: {
            status,
            markedBy
          },
          create: {
            staffId,
            date: attendanceDate,
            status,
            markedBy
          }
        })
      )
    );

    res.json({
      success: true,
      data: attendanceRecords,
      message: `Attendance marked for ${attendanceRecords.length} staff members`
    });
  } catch (error: any) {
    console.error('Error marking bulk attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark bulk attendance',
      error: error.message
    });
  }
};

// Get attendance statistics
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { date, startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (date) {
      const selectedDate = new Date(date as string);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      dateFilter = {
        gte: selectedDate,
        lt: nextDay
      };
    } else if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      dateFilter = {
        gte: today,
        lt: tomorrow
      };
    }

    const [totalStaff, present, absent, onLeave, halfDay, late] = await Promise.all([
      prisma.staff.count(),
      prisma.attendance.count({
        where: { date: dateFilter, status: 'PRESENT' }
      }),
      prisma.attendance.count({
        where: { date: dateFilter, status: 'ABSENT' }
      }),
      prisma.attendance.count({
        where: { date: dateFilter, status: 'LEAVE' }
      }),
      prisma.attendance.count({
        where: { date: dateFilter, status: 'HALF_DAY' }
      }),
      prisma.attendance.count({
        where: { date: dateFilter, status: 'LATE' }
      })
    ]);

    const marked = present + absent + onLeave + halfDay + late;
    const notMarked = totalStaff - marked;
    const attendanceRate = totalStaff > 0 ? ((present / totalStaff) * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        totalStaff,
        present,
        absent,
        onLeave,
        halfDay,
        late,
        attendanceRate: parseFloat(attendanceRate),
        notMarked
      }
    });
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics',
      error: error.message
    });
  }
};

// Get monthly attendance report for a staff member
export const getMonthlyAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId, month, year } = req.query;

    if (!staffId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, month, and year are required'
      });
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        staffId: staffId as string,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      leave: attendance.filter(a => a.status === 'LEAVE').length,
      halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0)
    };

    res.json({
      success: true,
      data: {
        attendance,
        summary
      }
    });
  } catch (error: any) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly attendance',
      error: error.message
    });
  }
};
