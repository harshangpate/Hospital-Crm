import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==================== EMERGENCY REGISTRATION ====================

const registerEmergencySchema = z.object({
  patientId: z.string().optional(),
  // If patientId not provided, create new patient
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  
  // Emergency specific
  modeOfArrival: z.enum(['WALK_IN', 'AMBULANCE', 'POLICE', 'REFERRED', 'OTHER']),
  chiefComplaint: z.string(),
  briefHistory: z.string().optional(),
  accompanyingPerson: z.string().optional(),
  accompanyingContact: z.string().optional(),
  referredBy: z.string().optional(),
});

export const registerEmergencyVisit = async (req: Request, res: Response) => {
  try {
    const validatedData = registerEmergencySchema.parse(req.body);
    const userId = (req as any).user.id;

    let patientId = validatedData.patientId;

    // If no patientId provided, create new patient (walk-in emergency)
    if (!patientId && validatedData.firstName && validatedData.lastName) {
      // Generate patient ID
      const patientCount = await prisma.patient.count();
      const generatedPatientId = `PAT-${String(patientCount + 1).padStart(6, '0')}`;

      // Create user first
      const user = await prisma.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email || `${generatedPatientId.toLowerCase()}@emergency.temp`,
          phone: validatedData.phone || '',
          role: 'PATIENT',
          dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
          gender: validatedData.gender || 'OTHER',
          address: validatedData.address,
          isActive: true,
        },
      });

      // Create patient
      const patient = await prisma.patient.create({
        data: {
          userId: user.id,
          patientId: generatedPatientId,
          isActive: true,
        },
      });

      patientId = patient.id;
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required or provide patient details for new registration',
      });
    }

    // Generate visit number
    const visitCount = await prisma.emergencyVisit.count();
    const visitNumber = `ER-${new Date().getFullYear()}-${String(visitCount + 1).padStart(6, '0')}`;

    // Create emergency visit
    const emergencyVisit = await prisma.emergencyVisit.create({
      data: {
        visitNumber,
        patientId,
        modeOfArrival: validatedData.modeOfArrival,
        chiefComplaint: validatedData.chiefComplaint,
        briefHistory: validatedData.briefHistory,
        accompanyingPerson: validatedData.accompanyingPerson,
        accompanyingContact: validatedData.accompanyingContact,
        referredBy: validatedData.referredBy,
        status: 'REGISTERED',
        createdBy: userId,
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
                gender: true,
                dateOfBirth: true,
                address: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency visit registered successfully',
      data: emergencyVisit,
    });
  } catch (error: any) {
    console.error('Register emergency visit error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to register emergency visit',
      error: error.message,
    });
  }
};

// ==================== TRIAGE ASSESSMENT ====================

const triageAssessmentSchema = z.object({
  triageLevel: z.enum([
    'LEVEL_1_RESUSCITATION',
    'LEVEL_2_EMERGENT',
    'LEVEL_3_URGENT',
    'LEVEL_4_LESS_URGENT',
    'LEVEL_5_NON_URGENT',
  ]),
  chiefComplaint: z.string(),
  historyOfPresentIllness: z.string().optional(),
  onsetTime: z.string().datetime().optional(),
  severity: z.string().optional(),
  
  // Vital Signs
  heartRate: z.number().int().positive().optional(),
  bloodPressureSystolic: z.number().int().positive().optional(),
  bloodPressureDiastolic: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  spO2: z.number().int().min(0).max(100).optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  glucoseLevel: z.number().positive().optional(),
  
  // Quick Assessment
  consciousLevel: z.string().optional(),
  airwayStatus: z.string().optional(),
  breathingStatus: z.string().optional(),
  circulationStatus: z.string().optional(),
  
  // Risk Factors
  activeBloodLoss: z.boolean().optional(),
  severeTrauma: z.boolean().optional(),
  chestPain: z.boolean().optional(),
  unconscious: z.boolean().optional(),
  seizure: z.boolean().optional(),
  poisoning: z.boolean().optional(),
  pregnancyComplications: z.boolean().optional(),
  
  triageNotes: z.string().optional(),
  redFlags: z.string().optional(),
});

export const createTriageAssessment = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const validatedData = triageAssessmentSchema.parse(req.body);
    const userId = (req as any).user.id;
    const userName = `${(req as any).user.firstName} ${(req as any).user.lastName}`;

    // Verify emergency visit exists
    const emergencyVisit = await prisma.emergencyVisit.findUnique({
      where: { id: emergencyVisitId },
    });

    if (!emergencyVisit) {
      return res.status(404).json({
        success: false,
        message: 'Emergency visit not found',
      });
    }

    // Determine triage color based on level
    const triageColorMap: Record<string, string> = {
      LEVEL_1_RESUSCITATION: 'RED',
      LEVEL_2_EMERGENT: 'ORANGE',
      LEVEL_3_URGENT: 'YELLOW',
      LEVEL_4_LESS_URGENT: 'GREEN',
      LEVEL_5_NON_URGENT: 'BLUE',
    };

    // Create triage assessment
    const triage = await prisma.triage.create({
      data: {
        emergencyVisitId,
        ...validatedData,
        triageColor: triageColorMap[validatedData.triageLevel],
        triagedBy: userId,
        triagedByName: userName,
      },
    });

    // Update emergency visit with triage info
    await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: {
        triageId: triage.id,
        triageLevel: validatedData.triageLevel,
        triagedAt: new Date(),
        triagedBy: userId,
        status: 'WAITING', // Move from REGISTERED to WAITING after triage
        vitalSignsAtTriage: {
          heartRate: validatedData.heartRate,
          bloodPressureSystolic: validatedData.bloodPressureSystolic,
          bloodPressureDiastolic: validatedData.bloodPressureDiastolic,
          temperature: validatedData.temperature,
          respiratoryRate: validatedData.respiratoryRate,
          spO2: validatedData.spO2,
          painScore: validatedData.painScore,
          glucoseLevel: validatedData.glucoseLevel,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Triage assessment created successfully',
      data: triage,
    });
  } catch (error: any) {
    console.error('Create triage assessment error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create triage assessment',
      error: error.message,
    });
  }
};

// Get triage by emergency visit
export const getTriageByVisit = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;

    const triage = await prisma.triage.findUnique({
      where: { emergencyVisitId },
      include: {
        emergencyVisit: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: 'Triage assessment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: triage,
    });
  } catch (error: any) {
    console.error('Get triage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch triage assessment',
      error: error.message,
    });
  }
};

// ==================== QUEUE MANAGEMENT ====================

export const getEmergencyQueue = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      triageLevel, 
      assignedDoctorId,
      bedId,
      startDate,
      endDate,
    } = req.query;

    const where: any = {};

    // Exclude completed visits from queue
    where.status = {
      notIn: ['DISCHARGED', 'ADMITTED', 'TRANSFERRED', 'LEFT_AMA', 'DECEASED'],
    };

    if (status) {
      where.status = status;
    }
    if (triageLevel) {
      where.triageLevel = triageLevel;
    }
    if (assignedDoctorId) {
      where.assignedDoctorId = assignedDoctorId;
    }
    if (bedId) {
      where.bedId = bedId;
    }
    if (startDate || endDate) {
      where.arrivalTime = {};
      if (startDate) where.arrivalTime.gte = new Date(startDate as string);
      if (endDate) where.arrivalTime.lte = new Date(endDate as string);
    }

    const visits = await prisma.emergencyVisit.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                gender: true,
                dateOfBirth: true,
                phone: true,
              },
            },
          },
        },
        triage: true,
        assignedDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        bed: true,
      },
      orderBy: [
        { triageLevel: 'asc' }, // Level 1 (most critical) first
        { arrivalTime: 'asc' }, // Then by arrival time
      ],
    });

    // Calculate waiting times
    const visitsWithMetrics = visits.map((visit) => {
      const now = new Date();
      const arrivalTime = new Date(visit.arrivalTime);
      const totalWaitingMinutes = Math.floor((now.getTime() - arrivalTime.getTime()) / 60000);
      
      let waitingForDoctor = null;
      if (!visit.firstSeenByDoctorAt) {
        waitingForDoctor = totalWaitingMinutes;
      }

      return {
        ...visit,
        totalWaitingMinutes,
        waitingForDoctor,
      };
    });

    return res.status(200).json({
      success: true,
      data: visitsWithMetrics,
      count: visitsWithMetrics.length,
    });
  } catch (error: any) {
    console.error('Get emergency queue error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency queue',
      error: error.message,
    });
  }
};

// ==================== DOCTOR ASSIGNMENT ====================

export const assignDoctor = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
      });
    }

    const visit = await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: {
        assignedDoctorId: doctorId,
        assignedAt: new Date(),
        status: 'IN_TREATMENT',
        firstSeenByDoctorAt: new Date(),
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        assignedDoctor: {
          include: {
            user: true,
          },
        },
        triage: true,
      },
    });

    // Calculate waiting time
    const waitingTime = Math.floor(
      (new Date(visit.firstSeenByDoctorAt!).getTime() - new Date(visit.arrivalTime).getTime()) / 60000
    );

    await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: { waitingTime },
    });

    return res.status(200).json({
      success: true,
      message: 'Doctor assigned successfully',
      data: visit,
    });
  } catch (error: any) {
    console.error('Assign doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign doctor',
      error: error.message,
    });
  }
};

// ==================== BED MANAGEMENT ====================

export const assignBed = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const { bedId } = req.body;

    if (!bedId) {
      return res.status(400).json({
        success: false,
        message: 'Bed ID is required',
      });
    }

    // Check bed availability
    const bed = await prisma.emergencyBed.findUnique({
      where: { id: bedId },
    });

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    if (bed.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Bed is not available. Current status: ${bed.status}`,
      });
    }

    // Assign bed to visit
    const visit = await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: {
        bedId,
        bedAssignedAt: new Date(),
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        bed: true,
      },
    });

    // Update bed status
    await prisma.emergencyBed.update({
      where: { id: bedId },
      data: {
        status: 'OCCUPIED',
        currentPatientId: visit.patientId,
        occupiedSince: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Bed assigned successfully',
      data: visit,
    });
  } catch (error: any) {
    console.error('Assign bed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign bed',
      error: error.message,
    });
  }
};

// Get all emergency beds
export const getEmergencyBeds = async (req: Request, res: Response) => {
  try {
    const { status, bedType } = req.query;

    const where: any = { isActive: true };
    if (status) where.status = status;
    if (bedType) where.bedType = bedType;

    const beds = await prisma.emergencyBed.findMany({
      where,
      include: {
        visits: {
          where: {
            bedAssignedAt: { not: null },
            departureTime: null,
          },
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
          take: 1,
        },
      },
      orderBy: { bedNumber: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: beds,
      count: beds.length,
    });
  } catch (error: any) {
    console.error('Get emergency beds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency beds',
      error: error.message,
    });
  }
};

// ==================== DOCTOR ASSESSMENT ====================

const doctorAssessmentSchema = z.object({
  presentingSymptoms: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  examinationFindings: z.string(),
  provisionalDiagnosis: z.string(),
  finalDiagnosis: z.string().optional(),
  treatmentGiven: z.string().optional(),
  investigationsOrdered: z.string().optional(),
  proceduresPerformed: z.string().optional(),
});

export const updateDoctorAssessment = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const validatedData = doctorAssessmentSchema.parse(req.body);
    const userId = (req as any).user.id;

    const visit = await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: {
        ...validatedData,
        updatedBy: userId,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        triage: true,
        assignedDoctor: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: visit,
    });
  } catch (error: any) {
    console.error('Update assessment error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update assessment',
      error: error.message,
    });
  }
};

// ==================== VITALS MANAGEMENT ====================

const emergencyVitalsSchema = z.object({
  heartRate: z.number().int().positive().optional(),
  bloodPressureSystolic: z.number().int().positive().optional(),
  bloodPressureDiastolic: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  spO2: z.number().int().min(0).max(100).optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  glucoseLevel: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  gcsEye: z.number().int().min(1).max(4).optional(),
  gcsVerbal: z.number().int().min(1).max(5).optional(),
  gcsMotor: z.number().int().min(1).max(6).optional(),
  notes: z.string().optional(),
});

export const recordEmergencyVitals = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const validatedData = emergencyVitalsSchema.parse(req.body);
    const userId = (req as any).user.id;
    const userName = `${(req as any).user.firstName} ${(req as any).user.lastName}`;

    // Calculate GCS total and BMI if applicable
    const gcsTotal =
      validatedData.gcsEye && validatedData.gcsVerbal && validatedData.gcsMotor
        ? validatedData.gcsEye + validatedData.gcsVerbal + validatedData.gcsMotor
        : undefined;

    const bmi =
      validatedData.weight && validatedData.height
        ? validatedData.weight / Math.pow(validatedData.height / 100, 2)
        : undefined;

    const vitals = await prisma.emergencyVitals.create({
      data: {
        emergencyVisitId,
        ...validatedData,
        gcsTotal,
        bmi,
        takenBy: userId,
        takenByName: userName,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Vitals recorded successfully',
      data: vitals,
    });
  } catch (error: any) {
    console.error('Record vitals error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to record vitals',
      error: error.message,
    });
  }
};

// Get vitals for a visit
export const getVisitVitals = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;

    const vitals = await prisma.emergencyVitals.findMany({
      where: { emergencyVisitId },
      orderBy: { takenAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: vitals,
      count: vitals.length,
    });
  } catch (error: any) {
    console.error('Get vitals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals',
      error: error.message,
    });
  }
};

// ==================== DISPOSITION ====================

const dispositionSchema = z.object({
  disposition: z.enum([
    'DISCHARGE_HOME',
    'ADMIT_TO_IPD',
    'ADMIT_TO_ICU',
    'TRANSFER_TO_ANOTHER_FACILITY',
    'LEFT_AGAINST_MEDICAL_ADVICE',
    'ABSCONDED',
    'REFERRED_TO_SPECIALIST',
    'DECEASED',
    'BROUGHT_DEAD',
  ]),
  dispositionNotes: z.string().optional(),
  dischargeInstructions: z.string().optional(),
  followUpAdvice: z.string().optional(),
  conditionOnDischarge: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().datetime().optional(),
  transferredTo: z.string().optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
});

export const createDisposition = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const validatedData = dispositionSchema.parse(req.body);
    const userId = (req as any).user.id;

    // Determine status based on disposition
    const statusMap: Record<string, string> = {
      DISCHARGE_HOME: 'DISCHARGED',
      ADMIT_TO_IPD: 'ADMITTED',
      ADMIT_TO_ICU: 'ADMITTED',
      TRANSFER_TO_ANOTHER_FACILITY: 'TRANSFERRED',
      LEFT_AGAINST_MEDICAL_ADVICE: 'LEFT_AMA',
      ABSCONDED: 'LEFT_AMA',
      REFERRED_TO_SPECIALIST: 'DISCHARGED',
      DECEASED: 'DECEASED',
      BROUGHT_DEAD: 'DECEASED',
    };

    const newStatus = statusMap[validatedData.disposition];

    // Calculate total time in ER
    const visit = await prisma.emergencyVisit.findUnique({
      where: { id: emergencyVisitId },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Emergency visit not found',
      });
    }

    const departureTime = new Date();
    const totalTimeInER = Math.floor(
      (departureTime.getTime() - new Date(visit.arrivalTime).getTime()) / 60000
    );

    // Update visit with disposition
    const updatedVisit = await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: {
        ...validatedData,
        followUpDate: validatedData.followUpDate
          ? new Date(validatedData.followUpDate)
          : undefined,
        status: newStatus as any,
        dispositionTime: departureTime,
        departureTime,
        totalTimeInER,
        dispositionInitiatedAt: new Date(),
        updatedBy: userId,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        triage: true,
        assignedDoctor: {
          include: {
            user: true,
          },
        },
        bed: true,
      },
    });

    // If admitted to IPD, create admission record
    if (validatedData.disposition === 'ADMIT_TO_IPD' || validatedData.disposition === 'ADMIT_TO_ICU') {
      const admissionCount = await prisma.admission.count();
      const admissionNumber = `ADM-${new Date().getFullYear()}-${String(admissionCount + 1).padStart(6, '0')}`;

      const admission = await prisma.admission.create({
        data: {
          admissionNumber,
          patientId: visit.patientId,
          attendingDoctorId: visit.assignedDoctorId!,
          admissionType: 'Emergency',
          reasonForAdmission: visit.chiefComplaint,
          primaryDiagnosis: visit.finalDiagnosis || visit.provisionalDiagnosis,
          status: 'ADMITTED',
          relativeName: visit.accompanyingPerson,
          relativePhone: visit.accompanyingContact,
        },
      });

      await prisma.emergencyVisit.update({
        where: { id: emergencyVisitId },
        data: {
          admittedToIPD: true,
          admissionId: admission.id,
        },
      });
    }

    // Release bed if assigned
    if (visit.bedId) {
      await prisma.emergencyBed.update({
        where: { id: visit.bedId },
        data: {
          status: 'CLEANING',
          currentPatientId: null,
          occupiedSince: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Disposition completed successfully',
      data: updatedVisit,
    });
  } catch (error: any) {
    console.error('Create disposition error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create disposition',
      error: error.message,
    });
  }
};

// ==================== GET VISIT DETAILS ====================

export const getEmergencyVisitById = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;

    const visit = await prisma.emergencyVisit.findUnique({
      where: { id: emergencyVisitId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        triage: true,
        assignedDoctor: {
          include: {
            user: true,
          },
        },
        bed: true,
        vitals: {
          orderBy: { takenAt: 'desc' },
        },
        admission: true,
      },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Emergency visit not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: visit,
    });
  } catch (error: any) {
    console.error('Get visit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency visit',
      error: error.message,
    });
  }
};

// ==================== STATISTICS & DASHBOARD ====================

export const getEmergencyStatistics = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total patients in ER (active)
    const patientsInER = await prisma.emergencyVisit.count({
      where: {
        status: {
          in: ['REGISTERED', 'WAITING', 'IN_TREATMENT', 'UNDER_OBSERVATION', 'AWAITING_RESULTS', 'READY_FOR_DISPOSITION'],
        },
      },
    });

    // By triage level (active only)
    const byTriageLevel = await prisma.emergencyVisit.groupBy({
      by: ['triageLevel'],
      where: {
        status: {
          in: ['REGISTERED', 'WAITING', 'IN_TREATMENT', 'UNDER_OBSERVATION', 'AWAITING_RESULTS', 'READY_FOR_DISPOSITION'],
        },
      },
      _count: true,
    });

    // Patients waiting for doctor
    const waitingForDoctor = await prisma.emergencyVisit.count({
      where: {
        status: 'WAITING',
        firstSeenByDoctorAt: null,
      },
    });

    // Calculate average waiting time
    const visitsWithWaitTime = await prisma.emergencyVisit.findMany({
      where: {
        waitingTime: { not: null },
        arrivalTime: { gte: today, lt: tomorrow },
      },
      select: { waitingTime: true },
    });

    const avgWaitingTime =
      visitsWithWaitTime.length > 0
        ? Math.round(
            visitsWithWaitTime.reduce((sum, v) => sum + (v.waitingTime || 0), 0) / visitsWithWaitTime.length
          )
        : 0;

    // Bed occupancy
    const totalBeds = await prisma.emergencyBed.count({ where: { isActive: true } });
    const occupiedBeds = await prisma.emergencyBed.count({
      where: { isActive: true, status: 'OCCUPIED' },
    });
    const bedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Dispositions today
    const dispositionsToday = await prisma.emergencyVisit.groupBy({
      by: ['disposition'],
      where: {
        dispositionTime: { gte: today, lt: tomorrow },
      },
      _count: true,
    });

    // Arrivals today
    const arrivalsToday = await prisma.emergencyVisit.count({
      where: {
        arrivalTime: { gte: today, lt: tomorrow },
      },
    });

    // Critical patients (Level 1 & 2)
    const criticalPatients = await prisma.emergencyVisit.count({
      where: {
        triageLevel: {
          in: ['LEVEL_1_RESUSCITATION', 'LEVEL_2_EMERGENT'],
        },
        status: {
          in: ['WAITING', 'IN_TREATMENT', 'UNDER_OBSERVATION'],
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        patientsInER,
        byTriageLevel,
        waitingForDoctor,
        avgWaitingTime,
        bedOccupancy: {
          occupied: occupiedBeds,
          total: totalBeds,
          percentage: bedOccupancy,
        },
        dispositionsToday,
        arrivalsToday,
        criticalPatients,
      },
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

// Update visit status
export const updateVisitStatus = async (req: Request, res: Response) => {
  try {
    const { emergencyVisitId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const visit = await prisma.emergencyVisit.update({
      where: { id: emergencyVisitId },
      data: { status },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        triage: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: visit,
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message,
    });
  }
};
