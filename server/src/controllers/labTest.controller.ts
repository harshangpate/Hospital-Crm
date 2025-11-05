import { Request, Response } from 'express';
import prisma from '../config/database';
import { LabTestStatus } from '@prisma/client';
import { checkCriticalValue, checkKnownCriticalTest } from '../utils/criticalValueChecker';

// ============================================
// CREATE LAB TEST ORDER
// ============================================

export const createLabTest = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      doctorId,
      testName,
      testCategory,
      testType,
      scheduledDate,
      sampleType,
      cost,
      labNotes,
    } = req.body;

    // Validation
    if (!patientId || !testName || !testCategory) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, test name, and test category are required',
      });
    }

    // Generate test number
    const count = await prisma.labTest.count();
    const testNumber = `LAB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // Determine initial status based on who is creating the test
    // If doctor creates it, it needs lab technician confirmation
    // If lab technician/admin creates it directly, it's confirmed (ORDERED)
    const user = (req as any).user;
    const initialStatus: LabTestStatus = user.role === 'DOCTOR' ? LabTestStatus.PENDING_CONFIRMATION : LabTestStatus.ORDERED;

    // Create lab test
    const labTest = await prisma.labTest.create({
      data: {
        testNumber,
        patientId,
        doctorId,
        testName,
        testCategory,
        testType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        sampleType,
        cost: cost ? parseFloat(cost) : null,
        labNotes,
        status: initialStatus,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lab test ordered successfully',
      data: labTest,
    });
  } catch (error: any) {
    console.error('Create lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lab test',
      error: error.message,
    });
  }
};

// ============================================
// GET ALL LAB TESTS (WITH FILTERS)
// ============================================

export const getLabTests = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      patientId,
      testCategory,
      search,
      sortBy = 'orderedDate',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (testCategory) {
      where.testCategory = testCategory;
    }

    if (search) {
      where.OR = [
        { testNumber: { contains: search as string, mode: 'insensitive' } },
        { testName: { contains: search as string, mode: 'insensitive' } },
        { patient: { 
            user: { 
              OR: [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } },
              ]
            } 
          } 
        },
      ];
    }

    // Get lab tests
    const [labTests, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  dateOfBirth: true,
                  gender: true,
                },
              },
            },
          },
        },
      }),
      prisma.labTest.count({ where }),
    ]);

    res.json({
      success: true,
      data: labTests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get lab tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab tests',
      error: error.message,
    });
  }
};

// ============================================
// GET LAB TEST BY ID
// ============================================

export const getLabTestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const labTest = await prisma.labTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
      });
    }

    res.json({
      success: true,
      data: labTest,
    });
  } catch (error: any) {
    console.error('Get lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab test',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE LAB TEST STATUS
// ============================================

export const updateLabTestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      collectionDate, 
      sampleCollectedBy,
      sampleBarcode,
      sampleCondition,
      sampleLocation,
      sampleNotes,
      chainOfCustody
    } = req.body;

    const updateData: any = { status };

    if (status === 'SAMPLE_COLLECTED') {
      updateData.collectionDate = collectionDate ? new Date(collectionDate) : new Date();
      updateData.sampleCollectedBy = sampleCollectedBy;
      
      // Add sample tracking fields
      if (sampleBarcode) updateData.sampleBarcode = sampleBarcode;
      if (sampleCondition) updateData.sampleCondition = sampleCondition;
      if (sampleLocation) updateData.sampleLocation = sampleLocation;
      if (sampleNotes) updateData.sampleNotes = sampleNotes;
      if (chainOfCustody) updateData.chainOfCustody = chainOfCustody;
    }

    const labTest = await prisma.labTest.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Lab test status updated successfully',
      data: labTest,
    });
  } catch (error: any) {
    console.error('Update lab test status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lab test status',
      error: error.message,
    });
  }
};

// ============================================
// SUBMIT LAB TEST RESULTS
// ============================================

export const submitLabResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      results,
      normalRange,
      interpretation,
      performedBy,
      verifiedBy,
      resultDocument,
      labNotes,
    } = req.body;

    if (!results) {
      return res.status(400).json({
        success: false,
        message: 'Test results are required',
      });
    }

    const labTest = await prisma.$transaction(async (tx) => {
      // Check if results are critical
      const testName = req.body.testName || '';
      let isCritical = false;
      let criticalReason = '';

      // Try known critical test thresholds first
      const knownCheck = checkKnownCriticalTest(testName, results);
      if (knownCheck.isCritical) {
        isCritical = true;
        criticalReason = knownCheck.reason || 'Critical value detected';
      } else {
        // Fall back to normal range comparison
        const rangeCheck = checkCriticalValue(results, normalRange || null);
        if (rangeCheck.isCritical) {
          isCritical = true;
          criticalReason = rangeCheck.reason || 'Value outside critical range';
        }
      }

      // Update lab test with results
      const updated = await tx.labTest.update({
        where: { id },
        data: {
          results,
          normalRange,
          interpretation,
          performedBy,
          verifiedBy,
          resultDocument,
          labNotes,
          resultDate: new Date(),
          status: 'PENDING_APPROVAL',
          isCritical,
          criticalNotifiedAt: isCritical ? new Date() : null,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // If critical, create notification for doctor
      if (isCritical && updated.doctorId) {
        try {
          const patient = await tx.patient.findUnique({
            where: { id: updated.patientId },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          if (patient) {
            await tx.notification.create({
              data: {
                userId: updated.doctorId,
                title: '🚨 Critical Lab Result Alert',
                message: `Critical lab result for patient ${patient.user.firstName} ${patient.user.lastName}. Test: ${updated.testName}. ${criticalReason}`,
                type: 'CRITICAL_LAB_RESULT',
                linkText: 'View Test',
                linkUrl: `/dashboard/laboratory/${updated.id}`,
              },
            });
          }
        } catch (notifError) {
          console.error('Failed to create critical result notification:', notifError);
          // Don't fail the whole transaction if notification fails
        }
      }

      // Add lab test charges to patient's invoice
      if (updated.cost && updated.cost > 0) {
        // Try to find existing invoice for this patient (from active admission)
        const activeAdmission = await tx.admission.findFirst({
          where: {
            patientId: updated.patientId,
            status: {
              in: ['ADMITTED', 'UNDER_TREATMENT']
            }
          },
          orderBy: {
            admissionDate: 'desc'
          }
        });

        let invoice;
        if (activeAdmission) {
          // Find invoice by admission number
          invoice = await tx.invoice.findFirst({
            where: {
              invoiceNumber: {
                contains: activeAdmission.admissionNumber
              }
            }
          });
        }

        // If no invoice found from admission, try to find any pending invoice for patient
        if (!invoice) {
          invoice = await tx.invoice.findFirst({
            where: {
              patientId: updated.patientId,
              paymentStatus: {
                in: ['PENDING', 'PARTIALLY_PAID']
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
        }

        // If still no invoice, create a new one
        if (!invoice) {
          const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
          invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              patientId: updated.patientId,
              invoiceDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              paymentStatus: 'PENDING',
              subtotal: 0,
              discount: 0,
              tax: 0,
              totalAmount: 0,
              paidAmount: 0,
              balanceAmount: 0,
            }
          });
        }

        // Add lab test item to invoice
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemName: updated.testName,
            description: `${updated.testCategory}${updated.testType ? ` - ${updated.testType}` : ''}`,
            itemType: 'LABORATORY',
            quantity: 1,
            unitPrice: updated.cost,
            totalPrice: updated.cost,
          }
        });

        // Update invoice totals
        const updatedSubtotal = invoice.subtotal + updated.cost;
        const updatedTax = updatedSubtotal * 0.05; // 5% tax
        const updatedTotal = updatedSubtotal + updatedTax;
        const updatedBalance = updatedTotal - invoice.paidAmount;

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: updatedSubtotal,
            tax: updatedTax,
            totalAmount: updatedTotal,
            balanceAmount: updatedBalance,
            paymentStatus: updatedBalance > 0 
              ? (invoice.paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING')
              : 'PAID'
          }
        });

        // Mark lab test as paid (or at least billed)
        await tx.labTest.update({
          where: { id },
          data: { isPaid: false } // Set to false initially, will be true when invoice is paid
        });
      }

      return updated;
    });

    // TODO: Send email notification to patient
    console.log(`✅ Lab test results submitted for ${labTest.testNumber}`);

    res.json({
      success: true,
      message: 'Lab test results submitted successfully',
      data: labTest,
    });
  } catch (error: any) {
    console.error('Submit lab results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting lab results',
      error: error.message,
    });
  }
};

// ============================================
// GET LAB DASHBOARD STATS
// ============================================

export const getLabStats = async (req: Request, res: Response) => {
  try {
    const [
      totalTests,
      pendingConfirmation,
      orderedTests,
      sampleCollectedTests,
      inProgressTests,
      pendingApprovalTests,
      completedTests,
      todayTests,
    ] = await Promise.all([
      prisma.labTest.count(),
      prisma.labTest.count({ where: { status: 'PENDING_CONFIRMATION' } }),
      prisma.labTest.count({ where: { status: 'ORDERED' } }),
      prisma.labTest.count({ where: { status: 'SAMPLE_COLLECTED' } }),
      prisma.labTest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.labTest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.labTest.count({ where: { status: 'COMPLETED' } }),
      prisma.labTest.count({
        where: {
          orderedDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalTests,
        pendingConfirmation,
        orderedTests,
        sampleCollectedTests,
        inProgressTests,
        pendingApprovalTests,
        completedTests,
        todayTests,
      },
    });
  } catch (error: any) {
    console.error('Get lab stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab statistics',
      error: error.message,
    });
  }
};

// ============================================
// GET ANALYTICS DATA
// ============================================

export const getLabAnalytics = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysCount = parseInt(days as string);
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    startDate.setHours(0, 0, 0, 0);

    // Get test volume trends (daily)
    const tests = await prisma.labTest.findMany({
      where: {
        orderedDate: {
          gte: startDate,
        },
      },
      select: {
        orderedDate: true,
        status: true,
        testCategory: true,
        resultDate: true,
      },
    });

    // Group by date for volume trends
    const volumeByDate: { [key: string]: number } = {};
    const completedByDate: { [key: string]: number } = {};
    
    tests.forEach(test => {
      const dateKey = new Date(test.orderedDate).toISOString().split('T')[0];
      volumeByDate[dateKey] = (volumeByDate[dateKey] || 0) + 1;
      
      if (test.status === 'COMPLETED' && test.resultDate) {
        const resultDateKey = new Date(test.resultDate).toISOString().split('T')[0];
        completedByDate[resultDateKey] = (completedByDate[resultDateKey] || 0) + 1;
      }
    });

    // Convert to array format for charts
    const volumeTrends = Object.entries(volumeByDate).map(([date, count]) => ({
      date,
      ordered: count,
      completed: completedByDate[date] || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    tests.forEach(test => {
      categoryBreakdown[test.testCategory] = (categoryBreakdown[test.testCategory] || 0) + 1;
    });

    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
      name,
      value,
    }));

    // Calculate average turnaround time (TAT)
    const completedTests = await prisma.labTest.findMany({
      where: {
        status: 'COMPLETED',
        resultDate: { not: null },
        orderedDate: {
          gte: startDate,
        },
      },
      select: {
        orderedDate: true,
        resultDate: true,
        testCategory: true,
      },
    });

    let totalTAT = 0;
    const tatByCategory: { [key: string]: { total: number; count: number } } = {};

    completedTests.forEach(test => {
      if (test.resultDate) {
        const tat = (new Date(test.resultDate).getTime() - new Date(test.orderedDate).getTime()) / (1000 * 60 * 60); // hours
        totalTAT += tat;

        if (!tatByCategory[test.testCategory]) {
          tatByCategory[test.testCategory] = { total: 0, count: 0 };
        }
        tatByCategory[test.testCategory].total += tat;
        tatByCategory[test.testCategory].count += 1;
      }
    });

    const avgTAT = completedTests.length > 0 ? totalTAT / completedTests.length : 0;
    
    const tatByCategoryData = Object.entries(tatByCategory).map(([category, data]) => ({
      category,
      avgHours: data.total / data.count,
    }));

    // Pending workload
    const pendingWorkload = await prisma.labTest.groupBy({
      by: ['status'],
      where: {
        status: {
          in: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'PENDING_APPROVAL'],
        },
      },
      _count: true,
    });

    const workloadData = pendingWorkload.map(item => ({
      status: item.status.replace('_', ' '),
      count: item._count,
    }));

    // Critical results count
    const criticalCount = await prisma.labTest.count({
      where: {
        isCritical: true,
        orderedDate: {
          gte: startDate,
        },
      },
    });

    res.json({
      success: true,
      data: {
        volumeTrends,
        categoryBreakdown: categoryData,
        avgTurnaroundTime: Math.round(avgTAT * 10) / 10, // hours
        tatByCategory: tatByCategoryData,
        pendingWorkload: workloadData,
        criticalResultsCount: criticalCount,
        totalTestsAnalyzed: tests.length,
        completedTestsCount: completedTests.length,
      },
    });
  } catch (error: any) {
    console.error('Get lab analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab analytics',
      error: error.message,
    });
  }
};

// ============================================
// DELETE LAB TEST
// ============================================

export const deleteLabTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.labTest.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Lab test deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lab test',
      error: error.message,
    });
  }
};

// ============================================
// CONFIRM LAB TEST (Lab Technician confirms doctor's order)
// ============================================

export const confirmLabTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledDate, cost, labNotes } = req.body;

    // Check if test exists and is pending confirmation
    const test = await prisma.labTest.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
      });
    }

    if (test.status !== 'PENDING_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        message: 'Lab test is not pending confirmation',
      });
    }

    const finalCost = cost ? parseFloat(cost) : test.cost || 0;

    // Update test to ORDERED status with schedule details
    const updatedTest = await prisma.labTest.update({
      where: { id },
      data: {
        status: 'ORDERED',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : test.scheduledDate,
        cost: finalCost,
        labNotes: labNotes || test.labNotes,
      },
      include: {
        patient: {
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

    // Create invoice for the lab test
    if (finalCost > 0) {
      try {
        // Generate invoice number
        const year = new Date().getFullYear();
        const invoiceCount = await prisma.invoice.count();
        const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(6, '0')}`;

        // Create invoice with lab test item
        await prisma.invoice.create({
          data: {
            invoiceNumber,
            patientId: test.patientId,
            subtotal: finalCost,
            discount: 0,
            tax: 0,
            totalAmount: finalCost,
            balanceAmount: finalCost,
            notes: `Lab Test: ${test.testName}`,
            invoiceItems: {
              create: [
                {
                  itemType: 'LAB_TEST',
                  itemName: `Lab Test - ${test.testName}`,
                  description: `Categories: ${test.testCategory}${test.sampleType ? ` | Sample: ${test.sampleType}` : ''}${test.labNotes ? ` | Notes: ${test.labNotes}` : ''}`,
                  quantity: 1,
                  unitPrice: finalCost,
                  totalPrice: finalCost,
                },
              ],
            },
          },
        });
      } catch (invoiceError) {
        console.error('Error creating invoice for lab test:', invoiceError);
        // Don't fail the confirmation if invoice creation fails
      }
    }

    res.json({
      success: true,
      message: 'Lab test confirmed and invoice generated successfully',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Confirm lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming lab test',
      error: error.message,
    });
  }
};

// ============================================
// APPROVE LAB TEST RESULTS
// ============================================

export const approveLabTestResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalComments } = req.body;
    const user = (req as any).user;

    // Check if lab test exists
    const labTest = await prisma.labTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
      });
    }

    // Verify the test is in PENDING_APPROVAL status
    if (labTest.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve test with status: ${labTest.status}. Test must be in PENDING_APPROVAL status.`,
      });
    }

    // Update lab test with approval details
    const updatedTest = await prisma.labTest.update({
      where: { id },
      data: {
        status: LabTestStatus.COMPLETED,
        approvedBy: user.userId,
        approvedAt: new Date(),
        approvalComments: approvalComments || null,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create notification for the doctor who ordered the test
    if (labTest.doctorId) {
      await prisma.notification.create({
        data: {
          userId: labTest.doctorId,
          title: 'Lab Results Approved',
          message: `Lab test results for ${labTest.patient.user.firstName} ${labTest.patient.user.lastName} (${labTest.testName}) have been approved and finalized.`,
          type: 'INFO',
          linkText: 'View Test Results',
          linkUrl: `/dashboard/laboratory/${labTest.id}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Lab test results approved successfully',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Approve lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving lab test results',
      error: error.message,
    });
  }
};

// ============================================
// REJECT LAB TEST RESULTS
// ============================================

export const rejectLabTestResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const user = (req as any).user;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Check if lab test exists
    const labTest = await prisma.labTest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found',
      });
    }

    // Verify the test is in PENDING_APPROVAL status
    if (labTest.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject test with status: ${labTest.status}. Test must be in PENDING_APPROVAL status.`,
      });
    }

    // Move test back to IN_PROGRESS for corrections
    const updatedTest = await prisma.labTest.update({
      where: { id },
      data: {
        status: LabTestStatus.IN_PROGRESS,
        rejectionReason,
        approvedBy: null,
        approvedAt: null,
        approvalComments: null,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create notification for the lab technician who submitted results
    if (labTest.performedBy) {
      await prisma.notification.create({
        data: {
          userId: labTest.performedBy,
          title: 'Lab Results Rejected',
          message: `Lab test results for ${labTest.patient.user.firstName} ${labTest.patient.user.lastName} (${labTest.testName}) were rejected. Reason: ${rejectionReason}`,
          type: 'ERROR',
          linkText: 'Review & Resubmit',
          linkUrl: `/dashboard/laboratory/${labTest.id}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Lab test results rejected and sent back for corrections',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('Reject lab test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting lab test results',
      error: error.message,
    });
  }
};
