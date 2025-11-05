import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create medication
export const createMedication = async (req: Request, res: Response) => {
  try {
    const {
      name,
      genericName,
      brandName,
      manufacturer,
      medicationForm,
      strength,
      category,
      drugClass,
      unitPrice,
    } = req.body;

    if (!name || !medicationForm || !strength) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, medicationForm, strength',
      });
    }

    const medication = await prisma.medication.create({
      data: {
        name,
        genericName,
        brandName,
        manufacturer,
        medicationForm,
        strength,
        category,
        drugClass,
        unitPrice,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: medication,
    });
  } catch (error: any) {
    console.error('Error creating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medication',
      error: error.message,
    });
  }
};

// Get all medications
export const getMedications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { genericName: { contains: search as string, mode: 'insensitive' } },
        { brandName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [medications, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.medication.count({ where }),
    ]);

    res.json({
      success: true,
      data: medications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medications',
      error: error.message,
    });
  }
};
