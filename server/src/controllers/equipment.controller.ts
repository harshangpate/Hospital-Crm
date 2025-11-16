import { Request, Response } from 'express';
import prisma from '../config/database';
import { z } from 'zod';

// Get all equipment with filters
export const getAllEquipment = async (req: Request, res: Response) => {
  try {
    const { status, type, operationTheaterId, search, page = '1', limit = '50' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (operationTheaterId) where.operationTheaterId = operationTheaterId;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { equipmentCode: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [equipment, total] = await Promise.all([
      prisma.oTEquipment.findMany({
        where,
        skip,
        take,
        include: {
          operationTheater: {
            select: {
              id: true,
              name: true,
              otNumber: true,
            },
          },
          maintenanceLogs: {
            orderBy: { performedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.oTEquipment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        equipment,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message,
    });
  }
};

// Get equipment by ID
export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.oTEquipment.findUnique({
      where: { id },
      include: {
        operationTheater: true,
        maintenanceLogs: {
          orderBy: { performedAt: 'desc' },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message,
    });
  }
};

// Create new equipment
export const createEquipment = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      type: z.string().min(1, 'Type is required'),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      operationTheaterId: z.string().optional(),
      purchaseDate: z.string().optional(),
      warrantyExpiry: z.string().optional(),
      status: z.enum(['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'DAMAGED', 'STERILIZING', 'RETIRED']).optional(),
      location: z.string().optional(),
      isPortable: z.boolean().optional(),
      remarks: z.string().optional(),
    });

    const validatedData = schema.parse(req.body);

    // Generate unique equipment code
    const count = await prisma.oTEquipment.count();
    const equipmentCode = `EQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const equipment = await prisma.oTEquipment.create({
      data: {
        ...validatedData,
        equipmentCode,
        purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined,
        warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : undefined,
      },
      include: {
        operationTheater: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: equipment,
    });
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create equipment',
      error: error.message,
    });
  }
};

// Update equipment
export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schema = z.object({
      name: z.string().optional(),
      type: z.string().optional(),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      operationTheaterId: z.string().optional(),
      purchaseDate: z.string().optional(),
      warrantyExpiry: z.string().optional(),
      status: z.enum(['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'DAMAGED', 'STERILIZING', 'RETIRED']).optional(),
      location: z.string().optional(),
      maintenanceDue: z.string().optional(),
      isPortable: z.boolean().optional(),
      remarks: z.string().optional(),
    });

    const validatedData = schema.parse(req.body);

    const equipment = await prisma.oTEquipment.update({
      where: { id },
      data: {
        ...validatedData,
        purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined,
        warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : undefined,
        maintenanceDue: validatedData.maintenanceDue ? new Date(validatedData.maintenanceDue) : undefined,
      },
      include: {
        operationTheater: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      data: equipment,
    });
  } catch (error: any) {
    console.error('Error updating equipment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: error.message,
    });
  }
};

// Delete equipment
export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.oTEquipment.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment',
      error: error.message,
    });
  }
};

// Schedule maintenance
export const scheduleMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schema = z.object({
      maintenanceType: z.string().min(1, 'Maintenance type is required'),
      description: z.string().optional(),
      performedBy: z.string().min(1, 'Performed by is required'),
      performedAt: z.string().optional(),
      nextMaintenanceAt: z.string().optional(),
      cost: z.number().optional(),
      vendor: z.string().optional(),
      remarks: z.string().optional(),
    });

    const validatedData = schema.parse(req.body);

    // Create maintenance log
    const maintenanceLog = await prisma.equipmentMaintenanceLog.create({
      data: {
        equipmentId: id,
        maintenanceType: validatedData.maintenanceType,
        description: validatedData.description || '',
        performedBy: validatedData.performedBy,
        performedAt: validatedData.performedAt ? new Date(validatedData.performedAt) : new Date(),
        nextMaintenanceAt: validatedData.nextMaintenanceAt ? new Date(validatedData.nextMaintenanceAt) : undefined,
        cost: validatedData.cost,
        vendor: validatedData.vendor,
        remarks: validatedData.remarks,
      },
    });

    // Update equipment status and maintenance due date
    await prisma.oTEquipment.update({
      where: { id },
      data: {
        status: 'UNDER_MAINTENANCE',
        maintenanceDue: validatedData.nextMaintenanceAt ? new Date(validatedData.nextMaintenanceAt) : undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled successfully',
      data: maintenanceLog,
    });
  } catch (error: any) {
    console.error('Error scheduling maintenance:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to schedule maintenance',
      error: error.message,
    });
  }
};

// Increment usage count
export const incrementUsage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.oTEquipment.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error: any) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment usage',
      error: error.message,
    });
  }
};
