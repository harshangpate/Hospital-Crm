import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';
import doctorRoutes from './routes/doctor.routes';
import userRoutes from './routes/user.routes';
import emailRoutes from './routes/email.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import prescriptionRoutes from './routes/prescription.routes';
import invoiceRoutes from './routes/invoice.routes';
import labTestRoutes from './routes/labTest.routes';
import radiologyTestRoutes from './routes/radiologyTest.routes';
import imagingCatalogRoutes from './routes/imagingCatalog.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import medicationRoutes from './routes/medication.routes';
import admissionRoutes from './routes/admission.routes';
import bedRoutes from './routes/bed.routes';
import billingRoutes from './routes/billing.routes';
import testCatalogRoutes from './routes/testCatalog.routes';
import securityRoutes from './routes/security.routes';
import notificationRoutes from './routes/notification.routes';
import surgeryRoutes from './routes/surgery.routes';
import operationTheaterRoutes from './routes/operationTheater.routes';
import surgeryRecordsRoutes from './routes/surgeryRecords.routes';
import equipmentRoutes from './routes/equipment.routes';
import { startAppointmentReminderCron } from './cron/appointmentReminders';
import { startDailyBedChargesCron } from './cron/dailyBedCharges';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDatabase();

// Start cron jobs
startAppointmentReminderCron();
startDailyBedChargesCron();

// ============================================
// MIDDLEWARE
// ============================================

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    // Extra logging for available-slots
    if (req.path.includes('available-slots')) {
      console.log('🔍 AVAILABLE SLOTS REQUEST DETECTED!');
      console.log('Full URL:', req.url);
      console.log('Query params:', req.query);
      console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    }
    
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Hospital CRM Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API v1 routes
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Hospital CRM API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      patients: '/api/v1/patients',
      doctors: '/api/v1/doctors',
      appointments: '/api/v1/appointments',
      medicalRecords: '/api/v1/medical-records',
      prescriptions: '/api/v1/prescriptions',
      pharmacy: '/api/v1/pharmacy',
      lab: '/api/v1/lab',
      billing: '/api/v1/billing',
    },
  });
});

// Import routes (will be created later)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/lab-tests', labTestRoutes);
app.use('/api/v1/radiology-tests', radiologyTestRoutes);
app.use('/api/v1/imaging-catalog', imagingCatalogRoutes);
app.use('/api/v1/test-catalog', testCatalogRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/medications', medicationRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/ipd', bedRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/surgeries', surgeryRoutes);
app.use('/api/v1/operation-theaters', operationTheaterRoutes);
app.use('/api/v1/surgery-records', surgeryRecordsRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
// app.use('/api/v1/patients', patientRoutes);
// ... more routes

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🏥 Hospital CRM Server');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API v1: http://localhost:${PORT}/api/v1`);
  console.log('='.repeat(50));
});

export default app;
