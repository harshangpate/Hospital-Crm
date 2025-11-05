import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new test in catalog
export const createTestCatalog = async (req: Request, res: Response) => {
  try {
    const {
      testCode,
      testName,
      testCategory,
      testSubcategory,
      department,
      sampleType,
      sampleVolume,
      container,
      normalRange,
      normalRangeMale,
      normalRangeFemale,
      normalRangeChild,
      unit,
      methodology,
      price,
      urgentPrice,
      turnAroundTime,
      urgentTurnAround,
      specialInstructions,
      prerequisites,
      requiresFasting,
      isActive,
    } = req.body;

    // Validation
    if (!testCode || !testName || !testCategory || !price) {
      return res.status(400).json({
        success: false,
        message: 'Test code, name, category, and price are required',
      });
    }

    // Check if test code already exists
    const existingTest = await prisma.testCatalog.findUnique({
      where: { testCode },
    });

    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: 'Test code already exists',
      });
    }

    const testCatalog = await prisma.testCatalog.create({
      data: {
        testCode,
        testName,
        testCategory,
        testSubcategory,
        department: department || 'Laboratory',
        sampleType,
        sampleVolume,
        container,
        normalRange,
        normalRangeMale,
        normalRangeFemale,
        normalRangeChild,
        unit,
        methodology,
        price: parseFloat(price),
        urgentPrice: urgentPrice ? parseFloat(urgentPrice) : null,
        turnAroundTime: turnAroundTime || '24 hours',
        urgentTurnAround,
        specialInstructions,
        prerequisites,
        requiresFasting: requiresFasting || false,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Test catalog entry created successfully',
      data: testCatalog,
    });
  } catch (error: any) {
    console.error('Error creating test catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test catalog',
      error: error.message,
    });
  }
};

// Get all test catalog entries with filtering and pagination
export const getAllTestCatalogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      category = '',
      isActive = '',
      sortBy = 'testName',
      sortOrder = 'asc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filters
    const where: any = {};

    if (search) {
      where.OR = [
        { testCode: { contains: search as string, mode: 'insensitive' } },
        { testName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.testCategory = category as string;
    }

    if (isActive) {
      where.isActive = isActive === 'true';
    }

    // Get total count
    const total = await prisma.testCatalog.count({ where });

    // Get paginated data
    const testCatalogs = await prisma.testCatalog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
    });

    res.json({
      success: true,
      data: testCatalogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching test catalogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test catalogs',
      error: error.message,
    });
  }
};

// Get test catalog by ID
export const getTestCatalogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testCatalog = await prisma.testCatalog.findUnique({
      where: { id },
    });

    if (!testCatalog) {
      return res.status(404).json({
        success: false,
        message: 'Test catalog entry not found',
      });
    }

    res.json({
      success: true,
      data: testCatalog,
    });
  } catch (error: any) {
    console.error('Error fetching test catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test catalog',
      error: error.message,
    });
  }
};

// Update test catalog
export const updateTestCatalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      testCode,
      testName,
      testCategory,
      testSubcategory,
      department,
      sampleType,
      sampleVolume,
      container,
      normalRange,
      normalRangeMale,
      normalRangeFemale,
      normalRangeChild,
      unit,
      methodology,
      price,
      urgentPrice,
      turnAroundTime,
      urgentTurnAround,
      specialInstructions,
      prerequisites,
      requiresFasting,
      isActive,
    } = req.body;

    const testCatalog = await prisma.testCatalog.findUnique({
      where: { id },
    });

    if (!testCatalog) {
      return res.status(404).json({
        success: false,
        message: 'Test catalog entry not found',
      });
    }

    // Check if testCode is being changed and if new code already exists
    if (testCode && testCode !== testCatalog.testCode) {
      const existingTest = await prisma.testCatalog.findUnique({
        where: { testCode },
      });

      if (existingTest) {
        return res.status(400).json({
          success: false,
          message: 'Test code already exists',
        });
      }
    }

    const updatedTestCatalog = await prisma.testCatalog.update({
      where: { id },
      data: {
        testCode: testCode || testCatalog.testCode,
        testName: testName || testCatalog.testName,
        testCategory: testCategory || testCatalog.testCategory,
        testSubcategory,
        department,
        sampleType,
        sampleVolume,
        container,
        normalRange,
        normalRangeMale,
        normalRangeFemale,
        normalRangeChild,
        unit,
        methodology,
        price: price ? parseFloat(price) : testCatalog.price,
        urgentPrice: urgentPrice ? parseFloat(urgentPrice) : null,
        turnAroundTime,
        urgentTurnAround,
        specialInstructions,
        prerequisites,
        requiresFasting,
        isActive: isActive !== undefined ? isActive : testCatalog.isActive,
      },
    });

    res.json({
      success: true,
      message: 'Test catalog updated successfully',
      data: updatedTestCatalog,
    });
  } catch (error: any) {
    console.error('Error updating test catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test catalog',
      error: error.message,
    });
  }
};

// Delete test catalog
export const deleteTestCatalog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testCatalog = await prisma.testCatalog.findUnique({
      where: { id },
    });

    if (!testCatalog) {
      return res.status(404).json({
        success: false,
        message: 'Test catalog entry not found',
      });
    }

    await prisma.testCatalog.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Test catalog deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting test catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test catalog',
      error: error.message,
    });
  }
};

// Get test categories
export const getTestCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.testCatalog.findMany({
      where: { isActive: true },
      select: { testCategory: true },
      distinct: ['testCategory'],
      orderBy: { testCategory: 'asc' },
    });

    const categoryList = categories.map((c) => c.testCategory);

    res.json({
      success: true,
      data: categoryList,
    });
  } catch (error: any) {
    console.error('Error fetching test categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test categories',
      error: error.message,
    });
  }
};

// Get catalog statistics
export const getCatalogStats = async (req: Request, res: Response) => {
  try {
    const totalTests = await prisma.testCatalog.count();
    const activeTests = await prisma.testCatalog.count({
      where: { isActive: true },
    });
    const inactiveTests = totalTests - activeTests;

    // Count by category
    const categoryGroups = await prisma.testCatalog.groupBy({
      by: ['testCategory'],
      _count: true,
      where: { isActive: true },
    });

    const categoryBreakdown = categoryGroups.map((group) => ({
      category: group.testCategory,
      count: group._count,
    }));

    // Price range stats
    const priceStats = await prisma.testCatalog.aggregate({
      where: { isActive: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    });

    res.json({
      success: true,
      data: {
        totalTests,
        activeTests,
        inactiveTests,
        categoryBreakdown,
        priceStats: {
          average: priceStats._avg.price || 0,
          minimum: priceStats._min.price || 0,
          maximum: priceStats._max.price || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching catalog stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching catalog stats',
      error: error.message,
    });
  }
};

// Bulk import test catalog (useful for initial setup)
export const bulkImportTests = async (req: Request, res: Response) => {
  try {
    const { tests } = req.body;

    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tests array is required',
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const test of tests) {
      try {
        // Check if test code already exists
        const existing = await prisma.testCatalog.findUnique({
          where: { testCode: test.testCode },
        });

        if (existing) {
          results.failed++;
          results.errors.push(`Test code ${test.testCode} already exists`);
          continue;
        }

        await prisma.testCatalog.create({
          data: {
            testCode: test.testCode,
            testName: test.testName,
            testCategory: test.testCategory,
            testSubcategory: test.testSubcategory,
            department: test.department || 'Laboratory',
            sampleType: test.sampleType,
            sampleVolume: test.sampleVolume,
            container: test.container,
            normalRange: test.normalRange,
            normalRangeMale: test.normalRangeMale,
            normalRangeFemale: test.normalRangeFemale,
            normalRangeChild: test.normalRangeChild,
            unit: test.unit,
            methodology: test.methodology,
            price: parseFloat(test.price),
            urgentPrice: test.urgentPrice ? parseFloat(test.urgentPrice) : null,
            turnAroundTime: test.turnAroundTime || '24 hours',
            urgentTurnAround: test.urgentTurnAround,
            specialInstructions: test.specialInstructions,
            prerequisites: test.prerequisites,
            requiresFasting: test.requiresFasting || false,
            isActive: test.isActive !== undefined ? test.isActive : true,
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to import ${test.testCode}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${results.success} successful, ${results.failed} failed`,
      data: results,
    });
  } catch (error: any) {
    console.error('Error bulk importing tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk importing tests',
      error: error.message,
    });
  }
};
