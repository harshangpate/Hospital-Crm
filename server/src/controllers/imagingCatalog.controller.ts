import { Request, Response } from 'express';
import prisma from '../config/database';

// Create Imaging Catalog Item
export const createImagingCatalog = async (req: Request, res: Response) => {
  try {
    const {
      testName,
      testCode,
      modality,
      bodyPart,
      studyType,
      description,
      indications,
      contraindications,
      preparation,
      technique,
      protocol,
      contrastRequired,
      estimatedDuration,
      basePrice,
      urgentPrice,
      emergencyPrice,
      reportingTime,
      urgentReportingTime,
      isActive,
      requiresApproval,
      department,
      notes,
    } = req.body;

    // Validate required fields
    if (!testName || !testCode || !modality || !bodyPart || !studyType) {
      return res.status(400).json({
        success: false,
        message: 'Test name, code, modality, body part, and study type are required',
      });
    }

    // Check if test code already exists
    const existingTest = await prisma.imagingCatalog.findUnique({
      where: { testCode },
    });

    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: 'Test code already exists',
      });
    }

    const imagingTest = await prisma.imagingCatalog.create({
      data: {
        testName,
        testCode,
        modality,
        bodyPart,
        studyType,
        description,
        indications,
        contraindications,
        preparation,
        technique,
        protocol,
        contrastRequired: contrastRequired || false,
        estimatedDuration,
        basePrice: basePrice || 0,
        urgentPrice,
        emergencyPrice,
        reportingTime,
        urgentReportingTime,
        isActive: isActive !== undefined ? isActive : true,
        requiresApproval: requiresApproval || false,
        department,
        notes,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Imaging test created successfully',
      data: imagingTest,
    });
  } catch (error) {
    console.error('Error creating imaging test:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get All Imaging Catalog Items
export const getImagingCatalog = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      modality,
      bodyPart,
      isActive,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};

    if (modality) {
      where.modality = modality;
    }

    if (bodyPart) {
      where.bodyPart = { contains: bodyPart as string, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { testName: { contains: search as string, mode: 'insensitive' } },
        { testCode: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [imagingTests, total] = await Promise.all([
      prisma.imagingCatalog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.imagingCatalog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: imagingTests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching imaging catalog:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Single Imaging Catalog Item
export const getImagingCatalogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const imagingTest = await prisma.imagingCatalog.findUnique({
      where: { id },
    });

    if (!imagingTest) {
      return res.status(404).json({
        success: false,
        message: 'Imaging test not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: imagingTest,
    });
  } catch (error) {
    console.error('Error fetching imaging test:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update Imaging Catalog Item
export const updateImagingCatalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if test exists
    const existingTest = await prisma.imagingCatalog.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Imaging test not found',
      });
    }

    // If testCode is being updated, check for duplicates
    if (updateData.testCode && updateData.testCode !== existingTest.testCode) {
      const duplicateTest = await prisma.imagingCatalog.findUnique({
        where: { testCode: updateData.testCode },
      });

      if (duplicateTest) {
        return res.status(400).json({
          success: false,
          message: 'Test code already exists',
        });
      }
    }

    const updatedTest = await prisma.imagingCatalog.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Imaging test updated successfully',
      data: updatedTest,
    });
  } catch (error) {
    console.error('Error updating imaging test:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete Imaging Catalog Item
export const deleteImagingCatalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if test exists
    const existingTest = await prisma.imagingCatalog.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Imaging test not found',
      });
    }

    // Check if test is being used in any radiology tests
    const usageCount = await prisma.radiologyTest.count({
      where: { imagingCatalogId: id },
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete imaging test. It is being used in ${usageCount} radiology test(s)`,
      });
    }

    await prisma.imagingCatalog.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Imaging test deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting imaging test:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Toggle Active Status
export const toggleImagingCatalogStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTest = await prisma.imagingCatalog.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: 'Imaging test not found',
      });
    }

    const updatedTest = await prisma.imagingCatalog.update({
      where: { id },
      data: { isActive: !existingTest.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Imaging test ${updatedTest.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedTest,
    });
  } catch (error) {
    console.error('Error toggling test status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Imaging Catalog Statistics
export const getImagingCatalogStats = async (req: Request, res: Response) => {
  try {
    const [
      totalTests,
      activeTests,
      inactiveTests,
      testsByModality,
    ] = await Promise.all([
      prisma.imagingCatalog.count(),
      prisma.imagingCatalog.count({ where: { isActive: true } }),
      prisma.imagingCatalog.count({ where: { isActive: false } }),
      prisma.imagingCatalog.groupBy({
        by: ['modality'],
        _count: true,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTests,
        activeTests,
        inactiveTests,
        testsByModality: testsByModality.map((item: any) => ({
          modality: item.modality,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching imaging catalog stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
