import { Request, Response } from 'express';
import prisma from '../config/database';
import { RadiologyStatus, PaymentStatus } from '@prisma/client';

// ============================================
// CREATE RADIOLOGY TEST ORDER
// ============================================

export const createRadiologyTest = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      orderingDoctorId,
      modality,
      bodyPart,
      studyDescription,
      clinicalIndication,
      urgencyLevel,
      scheduledDate,
      technique,
      contrast,
      contrastAgent,
      cost,
      imagingCatalogId,
    } = req.body;

    // Validation
    if (!patientId || !modality || !bodyPart || !studyDescription || !clinicalIndication) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, modality, body part, study description, and clinical indication are required',
      });
    }

    // Generate test number
    const count = await prisma.radiologyTest.count();
    const testNumber = `RAD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // Use transaction to create test and invoice together
    const result = await prisma.$transaction(async (tx) => {
      // Create radiology test order
      const radiologyTest = await tx.radiologyTest.create({
        data: {
          testNumber,
          patientId,
          orderingDoctorId,
          modality,
          bodyPart,
          studyDescription,
          clinicalIndication,
          urgencyLevel: urgencyLevel || 'ROUTINE',
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          technique,
          contrast: contrast || 'NONE',
          contrastAgent,
          cost,
          imagingCatalogId,
          status: RadiologyStatus.ORDERED,
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
        },
      });

      // Add radiology test charges to patient's invoice
      if (cost && cost > 0) {
        // Try to find existing invoice for this patient (from active admission)
        const activeAdmission = await tx.admission.findFirst({
          where: {
            patientId,
            status: 'ADMITTED',
          },
          orderBy: {
            admissionDate: 'desc',
          },
        });

        let invoice;
        if (activeAdmission) {
          // Find invoice by admission number
          invoice = await tx.invoice.findFirst({
            where: {
              invoiceNumber: {
                contains: activeAdmission.admissionNumber,
              },
            },
          });
        }

        // If no invoice found from admission, try to find any pending invoice for patient
        if (!invoice) {
          invoice = await tx.invoice.findFirst({
            where: {
              patientId,
              paymentStatus: {
                in: [PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID],
              },
            },
            orderBy: {
              invoiceDate: 'desc',
            },
          });
        }

        // If still no invoice, create a new one
        if (!invoice) {
          const year = new Date().getFullYear();
          const invoiceCount = await tx.invoice.count();
          const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(6, '0')}`;
          
          invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              patientId,
              invoiceDate: new Date(),
              subtotal: 0,
              totalAmount: 0,
              paidAmount: 0,
              balanceAmount: 0,
              paymentStatus: PaymentStatus.PENDING,
            },
          });
        }

        // Add radiology test item to invoice
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemName: `${modality} - ${bodyPart}`,
            description: studyDescription,
            itemType: 'IMAGING',
            quantity: 1,
            unitPrice: cost,
            totalPrice: cost,
          },
        });

        // Update invoice totals
        const newTotalAmount = invoice.totalAmount + cost;
        const newBalanceAmount = newTotalAmount - invoice.paidAmount;

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            totalAmount: newTotalAmount,
            balanceAmount: newBalanceAmount,
            paymentStatus:
              newBalanceAmount <= 0
                ? PaymentStatus.PAID
                : invoice.paidAmount > 0
                ? PaymentStatus.PARTIALLY_PAID
                : PaymentStatus.PENDING,
          },
        });
      }

      return radiologyTest;
    });

    res.status(201).json({
      success: true,
      message: 'Radiology test ordered successfully and added to invoice',
      data: result,
    });
  } catch (error: any) {
    console.error('Create radiology test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating radiology test',
      error: error.message,
    });
  }
};

// ============================================
// GET ALL RADIOLOGY TESTS
// ============================================

export const getRadiologyTests = async (req: Request, res: Response) => {
  try {
    const { status, modality, urgency, patientId, search, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (modality) where.modality = modality;
    if (urgency) where.urgencyLevel = urgency;
    if (patientId) where.patientId = patientId;

    if (search) {
      where.OR = [
        { testNumber: { contains: search as string, mode: 'insensitive' } },
        { studyDescription: { contains: search as string, mode: 'insensitive' } },
        { bodyPart: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tests, total] = await Promise.all([
      prisma.radiologyTest.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  gender: true,
                  dateOfBirth: true,
                },
              },
            },
          },
        },
        orderBy: { orderedDate: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.radiologyTest.count({ where }),
    ]);

    res.json({
      success: true,
      data: tests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get radiology tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching radiology tests',
      error: error.message,
    });
  }
};

// ============================================
// GET SINGLE RADIOLOGY TEST
// ============================================

export const getRadiologyTestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const test = await prisma.radiologyTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Radiology test not found',
      });
    }

    res.json({
      success: true,
      data: test,
    });
  } catch (error: any) {
    console.error('Get radiology test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching radiology test',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE RADIOLOGY TEST STATUS
// ============================================

export const updateRadiologyTestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, performedDate } = req.body;

    const updateData: any = { status };

    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (performedDate) updateData.performedDate = new Date(performedDate);

    const updatedTest = await prisma.radiologyTest.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message,
    });
  }
};

// ============================================
// SUBMIT RADIOLOGY REPORT
// ============================================

export const submitRadiologyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      findings,
      impression,
      recommendations,
      radiologistNotes,
      technique,
      isCritical,
      criticalFindings,
      radiologistId,
    } = req.body;

    if (!findings || !impression) {
      return res.status(400).json({
        success: false,
        message: 'Findings and impression are required',
      });
    }

    // Check if test exists
    const test = await prisma.radiologyTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Radiology test not found',
      });
    }

    // Update test with report
    const updatedTest = await prisma.radiologyTest.update({
      where: { id },
      data: {
        findings,
        impression,
        recommendations,
        radiologistNotes,
        technique,
        radiologistId,
        reportedDate: new Date(),
        status: RadiologyStatus.PENDING_APPROVAL,
        isCritical: isCritical || false,
        criticalFindings,
        criticalNotifiedAt: isCritical ? new Date() : null,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    // If critical, create notification for ordering doctor
    if (isCritical && test.orderingDoctorId) {
      await prisma.notification.create({
        data: {
          userId: test.orderingDoctorId,
          title: '🚨 Critical Radiology Finding',
          message: `Critical finding in ${test.modality} - ${test.bodyPart} for patient ${test.patient.user.firstName} ${test.patient.user.lastName}. ${criticalFindings}`,
          type: 'CRITICAL_LAB_RESULT',
          linkText: 'View Report',
          linkUrl: `/dashboard/radiology/${test.id}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Radiology report submitted successfully',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message,
    });
  }
};

// ============================================
// APPROVE RADIOLOGY REPORT
// ============================================

export const approveRadiologyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalComments } = req.body;
    const user = (req as any).user;

    const test = await prisma.radiologyTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Radiology test not found',
      });
    }

    if (test.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve test with status: ${test.status}`,
      });
    }

    const updatedTest = await prisma.radiologyTest.update({
      where: { id },
      data: {
        status: RadiologyStatus.COMPLETED,
        approvedBy: user.userId,
        approvedAt: new Date(),
        approvalComments,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notify ordering doctor
    if (test.orderingDoctorId) {
      await prisma.notification.create({
        data: {
          userId: test.orderingDoctorId,
          title: 'Radiology Report Approved',
          message: `${test.modality} - ${test.bodyPart} report for ${test.patient.user.firstName} ${test.patient.user.lastName} has been approved and finalized.`,
          type: 'INFO',
          linkText: 'View Report',
          linkUrl: `/dashboard/radiology/${test.id}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Report approved successfully',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Approve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving report',
      error: error.message,
    });
  }
};

// ============================================
// REJECT RADIOLOGY REPORT
// ============================================

export const rejectRadiologyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const test = await prisma.radiologyTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Radiology test not found',
      });
    }

    const updatedTest = await prisma.radiologyTest.update({
      where: { id },
      data: {
        status: RadiologyStatus.PENDING_REPORT,
        rejectionReason,
        approvedBy: null,
        approvedAt: null,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notify radiologist
    if (test.radiologistId) {
      await prisma.notification.create({
        data: {
          userId: test.radiologistId,
          title: 'Radiology Report Rejected',
          message: `${test.modality} - ${test.bodyPart} report was rejected. Reason: ${rejectionReason}`,
          type: 'ERROR',
          linkText: 'Review & Resubmit',
          linkUrl: `/dashboard/radiology/${test.id}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Report rejected and sent back for corrections',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Reject report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting report',
      error: error.message,
    });
  }
};

// ============================================
// GET RADIOLOGY STATISTICS
// ============================================

export const getRadiologyStats = async (req: Request, res: Response) => {
  try {
    const [
      totalTests,
      orderedTests,
      scheduledTests,
      inProgressTests,
      pendingReportTests,
      pendingApprovalTests,
      completedTests,
      todayTests,
      criticalTests,
    ] = await Promise.all([
      prisma.radiologyTest.count(),
      prisma.radiologyTest.count({ where: { status: 'ORDERED' } }),
      prisma.radiologyTest.count({ where: { status: 'SCHEDULED' } }),
      prisma.radiologyTest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.radiologyTest.count({ where: { status: 'PENDING_REPORT' } }),
      prisma.radiologyTest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.radiologyTest.count({ where: { status: 'COMPLETED' } }),
      prisma.radiologyTest.count({
        where: {
          orderedDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.radiologyTest.count({ where: { isCritical: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalTests,
        orderedTests,
        scheduledTests,
        inProgressTests,
        pendingReportTests,
        pendingApprovalTests,
        completedTests,
        todayTests,
        criticalTests,
      },
    });
  } catch (error: any) {
    console.error('Get radiology stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching radiology statistics',
      error: error.message,
    });
  }
};

// ============================================
// DELETE RADIOLOGY TEST
// ============================================

export const deleteRadiologyTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.radiologyTest.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Radiology test deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete radiology test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting radiology test',
      error: error.message,
    });
  }
};
