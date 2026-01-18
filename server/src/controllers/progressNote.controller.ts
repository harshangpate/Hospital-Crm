import { Request, Response } from 'express';
import prisma from '../config/database';

// ============================================
// CREATE PROGRESS NOTE
// ============================================

export const createProgressNote = async (req: Request, res: Response) => {
  try {
    const {
      admissionId,
      patientId,
      doctorId,
      subjective,
      objective,
      assessment,
      plan,
      noteType,
      priority,
      isPrivate,
      tags,
    } = req.body;

    // Validation
    if (!admissionId || !patientId || !assessment || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Admission ID, patient ID, assessment, and plan are required',
      });
    }

    // Verify admission exists and is active
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found',
      });
    }

    if (admission.status === 'DISCHARGED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add progress notes to discharged admission',
      });
    }

    const user = (req as any).user;

    // Get doctorId - either from request body or from logged-in doctor
    let finalDoctorId = doctorId;
    if (!finalDoctorId && user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      finalDoctorId = doctor?.id;
    }

    // Create progress note
    const progressNote = await prisma.progressNote.create({
      data: {
        admissionId,
        patientId,
        doctorId: finalDoctorId || null,
        subjective: subjective || null,
        objective: objective || null,
        assessment,
        plan,
        noteType: noteType || 'DAILY',
        priority: priority || 'ROUTINE',
        isPrivate: isPrivate || false,
        tags: tags || null,
        createdBy: user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Progress note created successfully',
      data: progressNote,
    });
  } catch (error: any) {
    console.error('Create progress note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating progress note',
      error: error.message,
    });
  }
};

// ============================================
// GET PROGRESS NOTES FOR ADMISSION
// ============================================

export const getProgressNotesByAdmission = async (req: Request, res: Response) => {
  try {
    const { admissionId } = req.params;
    const { noteType, priority, startDate, endDate } = req.query;

    // Build query filters
    const where: any = { admissionId };

    if (noteType) {
      where.noteType = noteType as string;
    }

    if (priority) {
      where.priority = priority as string;
    }

    if (startDate || endDate) {
      where.noteDate = {};
      if (startDate) {
        where.noteDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.noteDate.lte = new Date(endDate as string);
      }
    }

    const progressNotes = await prisma.progressNote.findMany({
      where,
      orderBy: {
        noteDate: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: progressNotes,
      total: progressNotes.length,
    });
  } catch (error: any) {
    console.error('Get progress notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress notes',
      error: error.message,
    });
  }
};

// ============================================
// GET PROGRESS NOTES FOR PATIENT
// ============================================

export const getProgressNotesByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    const progressNotes = await prisma.progressNote.findMany({
      where: { patientId },
      orderBy: {
        noteDate: 'desc',
      },
      take: parseInt(limit as string),
      include: {
        admission: {
          select: {
            admissionNumber: true,
            admissionDate: true,
            status: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: progressNotes,
      total: progressNotes.length,
    });
  } catch (error: any) {
    console.error('Get patient progress notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient progress notes',
      error: error.message,
    });
  }
};

// ============================================
// GET SINGLE PROGRESS NOTE
// ============================================

export const getProgressNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const progressNote = await prisma.progressNote.findUnique({
      where: { id },
      include: {
        admission: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    gender: true,
                    dateOfBirth: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!progressNote) {
      return res.status(404).json({
        success: false,
        message: 'Progress note not found',
      });
    }

    res.status(200).json({
      success: true,
      data: progressNote,
    });
  } catch (error: any) {
    console.error('Get progress note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress note',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE PROGRESS NOTE
// ============================================

export const updateProgressNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      subjective,
      objective,
      assessment,
      plan,
      noteType,
      priority,
      isPrivate,
      tags,
    } = req.body;

    // Check if note exists
    const existingNote = await prisma.progressNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Progress note not found',
      });
    }

    const user = (req as any).user;

    // Update progress note
    const progressNote = await prisma.progressNote.update({
      where: { id },
      data: {
        subjective: subjective !== undefined ? subjective : existingNote.subjective,
        objective: objective !== undefined ? objective : existingNote.objective,
        assessment: assessment || existingNote.assessment,
        plan: plan || existingNote.plan,
        noteType: noteType || existingNote.noteType,
        priority: priority || existingNote.priority,
        isPrivate: isPrivate !== undefined ? isPrivate : existingNote.isPrivate,
        tags: tags !== undefined ? tags : existingNote.tags,
        lastEditedBy: user.id,
        lastEditedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Progress note updated successfully',
      data: progressNote,
    });
  } catch (error: any) {
    console.error('Update progress note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress note',
      error: error.message,
    });
  }
};

// ============================================
// DELETE PROGRESS NOTE
// ============================================

export const deleteProgressNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if note exists
    const existingNote = await prisma.progressNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Progress note not found',
      });
    }

    await prisma.progressNote.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Progress note deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete progress note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting progress note',
      error: error.message,
    });
  }
};

// ============================================
// GET PROGRESS NOTE STATISTICS
// ============================================

export const getProgressNoteStats = async (req: Request, res: Response) => {
  try {
    const { admissionId } = req.params;

    // Count notes by type
    const notesByType = await prisma.progressNote.groupBy({
      by: ['noteType'],
      where: { admissionId },
      _count: true,
    });

    // Count notes by priority
    const notesByPriority = await prisma.progressNote.groupBy({
      by: ['priority'],
      where: { admissionId },
      _count: true,
    });

    // Total notes count
    const totalNotes = await prisma.progressNote.count({
      where: { admissionId },
    });

    // Latest note
    const latestNote = await prisma.progressNote.findFirst({
      where: { admissionId },
      orderBy: { noteDate: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        totalNotes,
        notesByType,
        notesByPriority,
        latestNote,
      },
    });
  } catch (error: any) {
    console.error('Get progress note stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress note statistics',
      error: error.message,
    });
  }
};
