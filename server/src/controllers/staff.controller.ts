import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all staff members
export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const {
      department,
      search,
      page = '1',
      limit = '100',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (department && department !== 'ALL') {
      where.department = { contains: department as string, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { staffId: { contains: search as string, mode: 'insensitive' } },
        { department: { contains: search as string, mode: 'insensitive' } },
        { designation: { contains: search as string, mode: 'insensitive' } },
        { user: {
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    // Get staff with user details
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              firstName: true,
              lastName: true,
              phone: true,
              alternatePhone: true,
              profileImage: true,
              dateOfBirth: true,
              gender: true,
              address: true,
              city: true,
              state: true,
              country: true,
              pincode: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }),
      prisma.staff.count({ where })
    ]);

    res.json({
      success: true,
      data: staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
};

// Get staff by ID
export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            firstName: true,
            lastName: true,
            phone: true,
            alternatePhone: true,
            profileImage: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
};

// Get staff by staff ID
export const getStaffByStaffId = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { staffId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            firstName: true,
            lastName: true,
            phone: true,
            alternatePhone: true,
            profileImage: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
};

// Get staff statistics
export const getStaffStats = async (req: Request, res: Response) => {
  try {
    const totalStaff = await prisma.staff.count();

    const staffByDepartment = await prisma.staff.groupBy({
      by: ['department'],
      _count: {
        id: true
      }
    });

    const activeStaff = await prisma.staff.count({
      where: {
        user: {
          isActive: true
        }
      }
    });

    const inactiveStaff = totalStaff - activeStaff;

    res.json({
      success: true,
      data: {
        totalStaff,
        activeStaff,
        inactiveStaff,
        byDepartment: staffByDepartment.map(dept => ({
          department: dept.department,
          count: dept._count.id
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff statistics',
      error: error.message
    });
  }
};

// Update staff
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { department, designation, joiningDate } = req.body;

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        department,
        designation,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: staff,
      message: 'Staff updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff',
      error: error.message
    });
  }
};

// Get departments list
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.staff.findMany({
      select: {
        department: true
      },
      distinct: ['department']
    });

    const departmentList = departments.map(d => d.department).sort();

    res.json({
      success: true,
      data: departmentList
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};
