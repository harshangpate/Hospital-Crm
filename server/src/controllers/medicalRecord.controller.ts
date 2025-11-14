import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateMedicalRecordPDF } from '../utils/pdfGenerator';
import { sendMedicalRecordEmail } from '../utils/emailService';

const prisma = new PrismaClient();

// ============================================
// MEDICAL RECORDS CRUD
// ============================================

/**
 * Get all medical records with pagination and filters
 */
export const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      patientId,
      doctorId,
      recordType,
      search
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};
    
    // IMPORTANT: Filter by user role for security
    if (req.user?.role === 'PATIENT') {
      // Patients can only see their own medical records
      const patient = await prisma.patient.findFirst({
        where: { userId: req.user.id },
        select: { id: true }
      });
      
      if (patient) {
        where.patientId = patient.id;
      } else {
        // If no patient record found, return empty array
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    }
    
    if (patientId) where.patientId = patientId as string;
    if (doctorId) where.doctorId = doctorId as string;
    if (recordType) where.recordType = recordType as string;
    
    if (search) {
      where.OR = [
        { chiefComplaint: { contains: search as string, mode: 'insensitive' } },
        { diagnosis: { contains: search as string, mode: 'insensitive' } },
        { treatment: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Fetch records with relations
    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          doctor: {
            select: {
              specialization: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          diagnoses: true,
          vitalSigns: true,
          documents: true,
          appointment: {
            select: {
              appointmentNumber: true,
              appointmentDate: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.medicalRecord.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching medical records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      error: error.message
    });
  }
};

/**
 * Get single medical record by ID
 */
export const getMedicalRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            bloodGroup: true,
            height: true,
            weight: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
                gender: true
              }
            },
            allergiesList: {
              select: {
                id: true,
                allergen: true,
                severity: true,
                reaction: true,
                diagnosedDate: true,
                isActive: true
              },
              where: { isActive: true }
            },
            medicalHistory: {
              select: {
                id: true,
                condition: true,
                conditionType: true,
                diagnosisDate: true,
                treatmentDetails: true,
                notes: true,
                isResolved: true
              },
              where: { isResolved: false }
            }
          }
        },
        doctor: {
          select: {
            specialization: true,
            qualification: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        diagnoses: true,
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 5
        },
        documents: true,
        prescriptions: {
          include: {
            items: {
              include: {
                medication: true
              }
            }
          }
        },
        appointment: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // SECURITY: If user is a patient, verify they can only access their own records
    if (req.user?.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: req.user.id },
        select: { id: true }
      });
      
      if (!patient || record.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own medical records.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error: any) {
    console.error('Error fetching medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record',
      error: error.message
    });
  }
};

/**
 * Create new medical record
 */
export const createMedicalRecord = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      recordType,
      chiefComplaint,
      presentIllness,
      examination,
      diagnosis,
      treatment,
      notes,
      followUpDate,
      diagnoses,
      vitalSigns
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !recordType || !chiefComplaint || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create medical record with nested data
    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        appointmentId: appointmentId || undefined,
        recordType,
        chiefComplaint,
        presentIllness,
        examination,
        diagnosis,
        treatment,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        diagnoses: diagnoses ? {
          create: diagnoses.map((d: any) => ({
            icdCode: d.icdCode,
            diagnosisName: d.diagnosisName,
            diagnosisType: d.diagnosisType,
            status: d.status,
            severity: d.severity,
            onsetDate: d.onsetDate ? new Date(d.onsetDate) : undefined,
            notes: d.notes
          }))
        } : undefined,
        vitalSigns: vitalSigns ? {
          create: {
            patientId,
            recordedBy: doctorId,
            bloodPressureSystolic: vitalSigns.bloodPressureSystolic,
            bloodPressureDiastolic: vitalSigns.bloodPressureDiastolic,
            heartRate: vitalSigns.heartRate,
            temperature: vitalSigns.temperature,
            respiratoryRate: vitalSigns.respiratoryRate,
            oxygenSaturation: vitalSigns.oxygenSaturation,
            bloodGlucose: vitalSigns.bloodGlucose,
            weight: vitalSigns.weight,
            height: vitalSigns.height,
            bmi: vitalSigns.bmi,
            notes: vitalSigns.notes
          }
        } : undefined
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        diagnoses: true,
        vitalSigns: true
      }
    });

    // Automatically send email with medical record PDF
    try {
      // Fetch record with full user details for email
      const recordWithEmail = await prisma.medicalRecord.findUnique({
        where: { id: record.id },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      const patientEmail = recordWithEmail?.patient.user.email;
      if (patientEmail) {
        await sendMedicalRecordEmail(record.id, patientEmail);
        console.log(`✅ Medical record email sent automatically to ${patientEmail}`);
      }
    } catch (emailError: any) {
      console.error('⚠️ Failed to send medical record email:', emailError.message);
      // Don't fail the request if email fails, just log it
    }

    return res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: record,
      emailSent: true
    });
  } catch (error: any) {
    console.error('Error creating medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create medical record',
      error: error.message
    });
  }
};

/**
 * Update medical record
 */
export const updateMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      chiefComplaint,
      presentIllness,
      examination,
      diagnosis,
      treatment,
      notes,
      followUpDate
    } = req.body;

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: {
        chiefComplaint,
        presentIllness,
        examination,
        diagnosis,
        treatment,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        diagnoses: true,
        vitalSigns: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      data: record
    });
  } catch (error: any) {
    console.error('Error updating medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update medical record',
      error: error.message
    });
  }
};

/**
 * Delete medical record (soft delete)
 */
export const deleteMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // In production, implement soft delete
    // For now, we'll just delete
    await prisma.medicalRecord.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete medical record',
      error: error.message
    });
  }
};

// ============================================
// VITAL SIGNS
// ============================================

/**
 * Record vital signs for a patient
 */
export const createVitalSigns = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      medicalRecordId,
      recordedBy,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      bloodGlucose,
      weight,
      height,
      bmi,
      notes
    } = req.body;

    if (!patientId || !recordedBy) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and recorded by are required'
      });
    }

    const vitalSigns = await prisma.vitalSign.create({
      data: {
        patientId,
        medicalRecordId: medicalRecordId || undefined,
        recordedBy,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        heartRate,
        temperature,
        respiratoryRate,
        oxygenSaturation,
        bloodGlucose,
        weight,
        height,
        bmi,
        notes
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Vital signs recorded successfully',
      data: vitalSigns
    });
  } catch (error: any) {
    console.error('Error recording vital signs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record vital signs',
      error: error.message
    });
  }
};

/**
 * Get patient vital signs history
 */
export const getPatientVitalSigns = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { limit = 20 } = req.query;

    const vitalSigns = await prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      take: Number(limit)
    });

    return res.status(200).json({
      success: true,
      data: vitalSigns
    });
  } catch (error: any) {
    console.error('Error fetching vital signs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vital signs',
      error: error.message
    });
  }
};

// ============================================
// ALLERGIES
// ============================================

/**
 * Add allergy for a patient
 */
export const createAllergy = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      allergen,
      allergyType,
      severity,
      reaction,
      diagnosedDate,
      notes
    } = req.body;

    if (!patientId || !allergen || !allergyType || !severity || !reaction) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const allergy = await prisma.allergy.create({
      data: {
        patientId,
        allergen,
        allergyType,
        severity,
        reaction,
        diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : undefined,
        notes
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Allergy added successfully',
      data: allergy
    });
  } catch (error: any) {
    console.error('Error adding allergy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add allergy',
      error: error.message
    });
  }
};

/**
 * Get patient allergies
 */
export const getPatientAllergies = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { active = 'true' } = req.query;

    const where: any = { patientId };
    if (active === 'true') {
      where.isActive = true;
    }

    const allergies = await prisma.allergy.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: allergies
    });
  } catch (error: any) {
    console.error('Error fetching allergies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch allergies',
      error: error.message
    });
  }
};

/**
 * Update allergy
 */
export const updateAllergy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, notes } = req.body;

    const allergy = await prisma.allergy.update({
      where: { id },
      data: {
        isActive,
        notes
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Allergy updated successfully',
      data: allergy
    });
  } catch (error: any) {
    console.error('Error updating allergy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update allergy',
      error: error.message
    });
  }
};

// ============================================
// MEDICAL HISTORY
// ============================================

/**
 * Get patient's complete medical history
 */
export const getPatientMedicalHistory = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    // Get patient with all medical data
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientId: true,
        bloodGroup: true,
        height: true,
        weight: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true
          }
        },
        medicalRecords: {
          include: {
            doctor: {
              select: {
                specialization: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            diagnoses: true,
            prescriptions: {
              include: {
                items: {
                  include: {
                    medication: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        },
        allergiesList: {
          where: { isActive: true }
        },
        medicalHistory: {
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error: any) {
    console.error('Error fetching medical history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical history',
      error: error.message
    });
  }
};

/**
 * Add medical history entry
 */
export const createMedicalHistory = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      condition,
      conditionType,
      diagnosisDate,
      treatmentDetails,
      notes,
      isResolved
    } = req.body;

    if (!patientId || !condition || !conditionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const history = await prisma.medicalHistory.create({
      data: {
        patientId,
        condition,
        conditionType,
        diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : undefined,
        treatmentDetails,
        notes,
        isResolved: isResolved || false
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Medical history added successfully',
      data: history
    });
  } catch (error: any) {
    console.error('Error adding medical history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add medical history',
      error: error.message
    });
  }
};

// ============================================
// DOCUMENTS
// ============================================

/**
 * Upload document
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      medicalRecordId,
      uploadedBy,
      documentType,
      title,
      description,
      fileUrl,
      fileSize,
      mimeType
    } = req.body;

    if (!patientId || !uploadedBy || !documentType || !title || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const document = await prisma.document.create({
      data: {
        patientId,
        medicalRecordId: medicalRecordId || undefined,
        uploadedBy,
        documentType,
        title,
        description,
        fileUrl,
        fileSize,
        mimeType
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * Get patient documents
 */
export const getPatientDocuments = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { documentType } = req.query;

    const where: any = { patientId };
    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.document.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

/**
 * Download medical record as PDF
 */
export const downloadMedicalRecordPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await generateMedicalRecordPDF(id, res);
  } catch (error: any) {
    console.error('Download medical record PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating medical record PDF',
      error: error.message,
    });
  }
};

/**
 * Send medical record via email
 */
export const emailMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    await sendMedicalRecordEmail(id, email);

    res.status(200).json({
      success: true,
      message: `Medical record sent successfully to ${email}`,
    });
  } catch (error: any) {
    console.error('Email medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending medical record email',
      error: error.message,
    });
  }
};
