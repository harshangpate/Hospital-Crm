import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==================== PRE-OP CHECKLIST CONTROLLERS ====================

// Get pre-op checklist by surgery ID
export const getPreOpChecklistBySurgeryId = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;

    const checklist = await prisma.preOpChecklist.findUnique({
      where: { surgeryId },
      include: {
        surgery: {
          include: {
            patient: {
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
    });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Pre-op checklist not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: checklist,
    });
  } catch (error: any) {
    console.error('Get pre-op checklist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-op checklist',
      error: error.message,
    });
  }
};

// Create or update pre-op checklist
const preOpChecklistSchema = z.object({
  // Patient Preparation
  consentSigned: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  consentSignedBy: z.string().optional(),
  identityVerified: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  allergiesVerified: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  fastingStatus: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  npoSince: z.string().datetime().optional(),
  // Lab & Investigations
  bloodTestDone: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  bloodTestResults: z.string().optional(),
  xrayDone: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  ecgDone: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  otherTestsDone: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  otherTestsDetails: z.string().optional(),
  // Medications
  preMedicationGiven: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  preMedicationDetails: z.string().optional(),
  currentMedsStopped: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  anticoagulantsStatus: z.string().optional(),
  // Equipment & Supplies
  otPrepared: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  instrumentsSterilized: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  equipmentChecked: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  bloodArranged: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  bloodUnitsAvailable: z.string().optional(),
  implantsAvailable: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  implantDetails: z.string().optional(),
  // Anesthesia
  anesthesiaAssessment: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  anesthesiaRisk: z.string().optional(),
  airwayAssessment: z.string().optional(),
  // Final Checks
  siteMarked: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  jewelryRemoved: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  dentalProstheticsRemoved: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  ivLineSecured: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  catheterInserted: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  // WHO Surgical Safety Checklist
  whoTimeOutCompleted: z.enum(['PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED']).optional(),
  teamIntroductionDone: z.boolean().optional(),
  // Completion
  completedBy: z.string().optional(),
  remarks: z.string().optional(),
});

export const upsertPreOpChecklist = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;
    const validatedData = preOpChecklistSchema.parse(req.body);
    const userId = (req as any).user.id;

    // Verify surgery exists
    const surgery = await prisma.surgery.findUnique({
      where: { id: surgeryId },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    // Check if all required items are completed
    const requiredItems = [
      'consentSigned',
      'identityVerified',
      'allergiesVerified',
      'fastingStatus',
      'bloodTestDone',
      'otPrepared',
      'instrumentsSterilized',
      'siteMarked',
      'whoTimeOutCompleted',
    ];

    const allCompleted = requiredItems.every((item) => {
      return validatedData[item as keyof typeof validatedData] === 'COMPLETED';
    });

    const dataToSave: any = {
      ...validatedData,
    };

    // Add timestamps
    if (validatedData.consentSigned === 'COMPLETED' && !validatedData.consentSignedBy) {
      dataToSave.consentSignedAt = new Date();
    }

    if (validatedData.whoTimeOutCompleted === 'COMPLETED') {
      dataToSave.whoTimeOutCompletedAt = new Date();
    }

    if (allCompleted) {
      dataToSave.completedBy = userId;
      dataToSave.completedAt = new Date();
    }

    // Convert datetime strings to Date objects
    if (validatedData.npoSince) {
      dataToSave.npoSince = new Date(validatedData.npoSince);
    }

    // Upsert checklist
    const checklist = await prisma.preOpChecklist.upsert({
      where: { surgeryId },
      update: dataToSave,
      create: {
        surgeryId,
        ...dataToSave,
      },
      include: {
        surgery: {
          include: {
            patient: {
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
    });

    // If checklist is completed, update surgery status
    if (allCompleted && surgery.status === 'SCHEDULED') {
      await prisma.surgery.update({
        where: { id: surgeryId },
        data: { status: 'PRE_OP' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pre-op checklist updated successfully',
      data: checklist,
    });
  } catch (error: any) {
    console.error('Upsert pre-op checklist error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update pre-op checklist',
      error: error.message,
    });
  }
};

// Delete pre-op checklist
export const deletePreOpChecklist = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;
    const userRole = (req as any).user.role;

    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete checklists',
      });
    }

    const checklist = await prisma.preOpChecklist.findUnique({
      where: { surgeryId },
    });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Pre-op checklist not found',
      });
    }

    await prisma.preOpChecklist.delete({
      where: { surgeryId },
    });

    return res.status(200).json({
      success: true,
      message: 'Pre-op checklist deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete pre-op checklist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete pre-op checklist',
      error: error.message,
    });
  }
};

// ==================== INTRA-OP RECORD CONTROLLERS ====================

// Get intra-op record by surgery ID
export const getIntraOpRecordBySurgeryId = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;

    const record = await prisma.intraOpRecord.findUnique({
      where: { surgeryId },
      include: {
        surgery: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            surgicalTeam: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Intra-op record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    console.error('Get intra-op record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch intra-op record',
      error: error.message,
    });
  }
};

// Create or update intra-op record
export const upsertIntraOpRecord = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;
    const updateData = req.body;
    const userId = (req as any).user.id;

    // Verify surgery exists
    const surgery = await prisma.surgery.findUnique({
      where: { id: surgeryId },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    // Convert datetime strings to Date objects
    const dataToSave: any = { ...updateData };
    const dateFields = [
      'patientInOTAt',
      'anesthesiaStartAt',
      'incisionAt',
      'procedureStartAt',
      'procedureEndAt',
      'closureAt',
      'patientOutOTAt',
      'implantExpiryDate',
    ];

    dateFields.forEach((field) => {
      if (dataToSave[field]) {
        dataToSave[field] = new Date(dataToSave[field]);
      }
    });

    dataToSave.recordedBy = userId;

    // Upsert record
    const record = await prisma.intraOpRecord.upsert({
      where: { surgeryId },
      update: dataToSave,
      create: {
        surgeryId,
        ...dataToSave,
      },
      include: {
        surgery: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Intra-op record updated successfully',
      data: record,
    });
  } catch (error: any) {
    console.error('Upsert intra-op record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update intra-op record',
      error: error.message,
    });
  }
};

// ==================== POST-OP RECORD CONTROLLERS ====================

// Get post-op record by surgery ID
export const getPostOpRecordBySurgeryId = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;

    const record = await prisma.postOpRecord.findUnique({
      where: { surgeryId },
      include: {
        surgery: {
          include: {
            patient: {
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
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Post-op record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    console.error('Get post-op record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch post-op record',
      error: error.message,
    });
  }
};

// Create or update post-op record
export const upsertPostOpRecord = async (req: Request, res: Response) => {
  try {
    const { surgeryId } = req.params;
    const updateData = req.body;
    const userId = (req as any).user.id;

    // Verify surgery exists
    const surgery = await prisma.surgery.findUnique({
      where: { id: surgeryId },
    });

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found',
      });
    }

    // Convert datetime strings to Date objects
    const dataToSave: any = { ...updateData };
    const dateFields = ['transferredAt', 'dischargeFromRecoveryAt', 'followUpDate'];

    dateFields.forEach((field) => {
      if (dataToSave[field]) {
        dataToSave[field] = new Date(dataToSave[field]);
      }
    });

    dataToSave.recordedBy = userId;

    // Upsert record
    const record = await prisma.postOpRecord.upsert({
      where: { surgeryId },
      update: dataToSave,
      create: {
        surgeryId,
        ...dataToSave,
      },
      include: {
        surgery: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Post-op record updated successfully',
      data: record,
    });
  } catch (error: any) {
    console.error('Upsert post-op record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update post-op record',
      error: error.message,
    });
  }
};
