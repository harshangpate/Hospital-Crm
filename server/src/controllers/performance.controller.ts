import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all performance reviews
export const getPerformanceReviews = async (req: Request, res: Response) => {
  try {
    const { staffId, reviewedBy, year } = req.query;

    const where: any = {};
    if (staffId) where.staffId = staffId;
    if (reviewedBy) where.reviewedBy = reviewedBy;
    
    if (year) {
      const targetYear = parseInt(year as string);
      where.reviewDate = {
        gte: new Date(targetYear, 0, 1),
        lte: new Date(targetYear, 11, 31),
      };
    }

    const reviews = await prisma.performanceReview.findMany({
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
      orderBy: {
        reviewDate: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (error: any) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance reviews',
      error: error.message,
    });
  }
};

// Create performance review
export const createPerformanceReview = async (req: Request, res: Response) => {
  try {
    const {
      staffId,
      reviewPeriod,
      reviewDate,
      productivity,
      quality,
      teamwork,
      communication,
      punctuality,
      overallRating,
      strengths,
      weaknesses,
      goals,
      comments,
    } = req.body;

    if (!staffId || !reviewDate || !reviewPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, review period, and review date are required',
      });
    }

    // Validate ratings (1-5)
    const ratings = [
      productivity,
      quality,
      teamwork,
      communication,
      punctuality,
      overallRating,
    ];

    for (const rating of ratings) {
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Ratings must be between 1 and 5',
        });
      }
    }

    const review = await prisma.performanceReview.create({
      data: {
        staffId,
        reviewPeriod,
        reviewDate: new Date(reviewDate),
        productivity,
        quality,
        teamwork,
        communication,
        punctuality,
        overallRating,
        strengths,
        weaknesses,
        goals,
        comments,
        reviewedBy: (req as any).user.id,
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
      message: 'Performance review created successfully',
      data: review,
    });
  } catch (error: any) {
    console.error('Error creating performance review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance review',
      error: error.message,
    });
  }
};

// Update performance review
export const updatePerformanceReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const review = await prisma.performanceReview.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found',
      });
    }

    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: updateData,
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
      message: 'Performance review updated successfully',
      data: updatedReview,
    });
  } catch (error: any) {
    console.error('Error updating performance review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance review',
      error: error.message,
    });
  }
};

// Get performance statistics
export const getPerformanceStats = async (req: Request, res: Response) => {
  try {
    const { staffId, year } = req.query;

    const where: any = {};
    if (staffId) where.staffId = staffId;
    
    if (year) {
      const targetYear = parseInt(year as string);
      where.reviewDate = {
        gte: new Date(targetYear, 0, 1),
        lte: new Date(targetYear, 11, 31),
      };
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      select: {
        overallRating: true,
        productivity: true,
        quality: true,
        teamwork: true,
        communication: true,
        punctuality: true,
      },
    });

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalReviews: 0,
          averageOverall: 0,
          averageProductivity: 0,
          averageQuality: 0,
          averageTeamwork: 0,
          averageCommunication: 0,
          averagePunctuality: 0,
        },
      });
    }

    const calculateAverage = (key: keyof typeof reviews[0]) => {
      const values = reviews.map((r) => r[key]).filter((v) => v !== null) as number[];
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    res.status(200).json({
      success: true,
      data: {
        totalReviews: reviews.length,
        averageOverall: calculateAverage('overallRating'),
        averageProductivity: calculateAverage('productivity'),
        averageQuality: calculateAverage('quality'),
        averageTeamwork: calculateAverage('teamwork'),
        averageCommunication: calculateAverage('communication'),
        averagePunctuality: calculateAverage('punctuality'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching performance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance statistics',
      error: error.message,
    });
  }
};

// Delete performance review
export const deletePerformanceReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.performanceReview.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Performance review deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting performance review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete performance review',
      error: error.message,
    });
  }
};
