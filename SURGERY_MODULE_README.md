# Surgery & Operation Theater Management Module

## Overview

A comprehensive Surgery and Operation Theater Management System for Hospital CRM, featuring complete surgical workflow management from scheduling to post-operative care, with real-time OT monitoring, equipment tracking, billing, and analytics.

## 🎯 Features

### 1. Operation Theater Dashboard
- **Real-time Monitoring**: Live OT status with availability tracking
- **Statistics**: Total OTs, today's surgeries, in-progress operations, utilization rate
- **Status Filtering**: Available, Occupied, Reserved, Cleaning, Under Maintenance
- **Visual Grid**: Interactive 3D cards showing OT details, equipment, and features

### 2. Surgery Scheduler
- **Calendar View**: Time-slot grid (8 AM - 8 PM, 30-minute intervals)
- **Date Navigation**: Previous/next day, quick "Today" button
- **OT Filtering**: Filter by specific operation theater
- **Priority Color Coding**: Critical (red), High (orange), Medium (yellow), Low (green)
- **Summary Statistics**: Total, critical, emergency, and elective surgeries

### 3. Pre-Operative Management
- **30+ Checklist Items** organized in 7 categories:
  - Patient Preparation (consent, identity, allergies, fasting)
  - Lab & Investigations (blood tests, X-ray, ECG)
  - Medications (pre-medication, current meds, anticoagulants)
  - Equipment & Supplies (OT preparation, sterilization, blood, implants)
  - Anesthesia Assessment
  - Final Checks (site marking, jewelry removal, IV line, catheter)
  - WHO Safety Checklist
- **Completion Tracking**: Real-time percentage with visual progress bar
- **Auto-status Update**: Surgery status updates when all required items complete

### 4. Intra-Operative Documentation
- **Timeline Tracking**: 6 key time points (patient in/out, anesthesia start/end, surgery start/end)
- **Vitals Monitoring**: Dynamic entry with multiple readings (HR, BP, SpO2, temp, RR)
- **Anesthesia Details**: Type, drugs used, complications
- **Fluid Management**: IV fluids, blood transfused, blood loss, urine output
- **Procedure Documentation**: Position, approach, findings, procedure performed
- **Surgical Counts**: Swabs, instruments, needles with verification
- **Team Notes**: Surgeon, anesthesia, and nursing notes

### 5. Post-Operative Care
- **ABCD Assessment**: Airway, Breathing, Circulation, Consciousness level
- **Pain Management**: 0-10 pain score slider with color coding
- **Output Monitoring**: Drains and catheter output tracking
- **Medication Management**: Pain management, antibiotics, other medications
- **Complications Tracking**: Detailed complication logging
- **Discharge Planning**: Condition, location, instructions, prescriptions
- **Follow-up Scheduling**: Date, provider, instructions

### 6. Equipment Management
- **Inventory Tracking**: Complete equipment catalog with serial numbers
- **Status Management**: Available, In Use, Under Maintenance, Out of Service
- **Maintenance Alerts**: Automatic alerts 30 days before due date
- **Grid/List Views**: Toggle between visual grid and detailed table
- **Search & Filter**: By name, serial number, type, or status
- **Usage Statistics**: Track equipment utilization

### 7. Surgery Billing
- **Auto-Calculation**: Generates billing based on surgery parameters
  - OT charges (based on type and duration)
  - Surgeon fees (based on priority)
  - Anesthesia fees (based on type and duration)
  - Team member fees
  - Standard consumables
- **Itemized Breakdown**: Add/edit/remove billing items
- **Adjustments**: Discount (percentage/fixed), tax rate, insurance coverage
- **Financial Summary**: Subtotal, discount, tax, total, patient copay
- **Invoice Generation**: PDF export (coming soon)

### 8. Analytics & Reports
- **Overview Metrics**: Total surgeries, completion rate, average duration, revenue
- **OT Utilization**: Per-theater utilization percentages with visual bars
- **Surgery Distribution**: By type and priority with percentages
- **Clinical Metrics**: Complication, infection, re-operation, mortality rates
- **Financial Performance**: Revenue, profit, margins, average per surgery
- **Monthly Trends**: Surgeries, revenue, utilization over time
- **Export Functionality**: Download reports (coming soon)

## 📊 Database Schema

### Core Models

#### OperationTheater
```prisma
model OperationTheater {
  id                String      @id @default(uuid())
  name              String
  otNumber          String      @unique
  type              OTType
  status            OTStatus    @default(AVAILABLE)
  floor             String?
  building          String?
  capacity          Int?
  equipment         String[]
  lastMaintenanceDate DateTime?
  nextMaintenanceDate DateTime?
  isActive          Boolean     @default(true)
  surgeries         Surgery[]
  otEquipment       OTEquipment[]
  maintenanceLogs   OTMaintenanceLog[]
}
```

#### Surgery
```prisma
model Surgery {
  id                    String              @id @default(uuid())
  surgeryNumber         String              @unique
  surgeryName           String
  surgeryType           String
  description           String?
  diagnosis             String?
  scheduledDate         DateTime
  scheduledStartTime    DateTime
  scheduledEndTime      DateTime
  actualStartTime       DateTime?
  actualEndTime         DateTime?
  estimatedDuration     Int
  actualDuration        Int?
  status                SurgeryStatus       @default(SCHEDULED)
  priority              SurgeryPriority     @default(MEDIUM)
  anesthesiaType        String?
  patient               Patient             @relation
  primarySurgeon        Doctor              @relation("PrimarySurgeon")
  operationTheater      OperationTheater    @relation
  surgicalTeam          SurgicalTeamMember[]
  preOpChecklist        PreOpChecklist?
  intraOpRecord         IntraOpRecord?
  postOpRecord          PostOpRecord?
  billingItems          SurgeryBillingItem[]
  // ... additional fields
}
```

### Enums

- **OTType**: GENERAL, CARDIAC, NEURO, ORTHO, PEDIATRIC, TRAUMA, EMERGENCY
- **OTStatus**: AVAILABLE, OCCUPIED, RESERVED, CLEANING, UNDER_MAINTENANCE, OUT_OF_SERVICE
- **SurgeryStatus**: SCHEDULED, PRE_OP, IN_PROGRESS, POST_OP, COMPLETED, CANCELLED, POSTPONED
- **SurgeryPriority**: CRITICAL, HIGH, MEDIUM, LOW
- **SurgeryType**: ELECTIVE, EMERGENCY, URGENT
- **SurgicalTeamRole**: ASSISTANT_SURGEON, ANESTHESIOLOGIST, NURSE, SCRUB_NURSE, CIRCULATING_NURSE, SURGICAL_TECHNICIAN, RESIDENT, FELLOW

## 🚀 API Endpoints

### Surgery Management
```
GET    /api/v1/surgeries                     - Get all surgeries (with filters)
GET    /api/v1/surgeries/:id                 - Get surgery by ID
POST   /api/v1/surgeries                     - Create new surgery
PATCH  /api/v1/surgeries/:id                 - Update surgery
PATCH  /api/v1/surgeries/:id/status          - Update surgery status
DELETE /api/v1/surgeries/:id                 - Delete surgery
GET    /api/v1/surgeries/surgeon/:id/upcoming - Get surgeon's upcoming surgeries
GET    /api/v1/surgeries/patient/:id         - Get patient's surgery history
```

### Operation Theater Management
```
GET    /api/v1/operation-theaters            - Get all OTs
GET    /api/v1/operation-theaters/:id        - Get OT by ID
POST   /api/v1/operation-theaters            - Create new OT
PATCH  /api/v1/operation-theaters/:id        - Update OT
PATCH  /api/v1/operation-theaters/:id/status - Update OT status
DELETE /api/v1/operation-theaters/:id        - Delete OT
GET    /api/v1/operation-theaters/schedule   - Get OT schedule
GET    /api/v1/operation-theaters/availability - Get OT availability
GET    /api/v1/operation-theaters/stats      - Get dashboard statistics
POST   /api/v1/operation-theaters/:id/maintenance - Add maintenance log
```

### Surgery Records
```
GET    /api/v1/surgery-records/pre-op/:surgeryId    - Get pre-op checklist
PUT    /api/v1/surgery-records/pre-op/:surgeryId    - Update pre-op checklist
DELETE /api/v1/surgery-records/pre-op/:surgeryId    - Delete pre-op checklist
GET    /api/v1/surgery-records/intra-op/:surgeryId  - Get intra-op record
PUT    /api/v1/surgery-records/intra-op/:surgeryId  - Update intra-op record
GET    /api/v1/surgery-records/post-op/:surgeryId   - Get post-op record
PUT    /api/v1/surgery-records/post-op/:surgeryId   - Update post-op record
```

## 🎨 Frontend Pages

### Routes
```
/dashboard/operation-theaters              - OT Dashboard
/dashboard/operation-theaters/equipment    - Equipment Management
/dashboard/surgery/schedule               - Surgery Scheduler
/dashboard/surgery/[id]                   - Surgery Details (with tabs)
/dashboard/surgery/analytics              - Analytics Dashboard
```

### Components
```
client/components/surgery/
├── PreOpChecklist.tsx        - Pre-operative checklist form
├── IntraOpRecord.tsx         - Intra-operative monitoring
├── PostOpRecord.tsx          - Post-operative care
└── SurgeryBilling.tsx        - Billing calculator
```

## 💡 Key Features Implementation

### 1. Smart Conflict Detection
The surgery creation automatically checks for:
- OT availability during scheduled time
- Surgeon schedule conflicts
- Equipment availability
- Time slot overlaps

### 2. Auto-Status Management
Surgery status updates automatically trigger OT status changes:
- Surgery IN_PROGRESS → OT becomes OCCUPIED
- Surgery COMPLETED → OT becomes CLEANING
- Surgery CANCELLED → OT becomes AVAILABLE

### 3. Time Slot Availability
Intelligent algorithm calculates available 30-minute slots:
- Operating hours: 8 AM - 8 PM
- Checks existing surgery conflicts
- Returns available slots per OT

### 4. Auto-Billing Generation
Billing automatically calculated based on:
- OT type and duration
- Surgery priority level
- Anesthesia type
- Surgical team composition
- Standard consumables

### 5. Real-time Dashboard Stats
Live statistics updated based on current data:
- Total OTs and availability
- Today's surgeries and in-progress count
- Utilization rate calculation
- Maintenance schedules

## 🔧 Technology Stack

### Backend
- **Node.js** + **Express.js** - RESTful API
- **Prisma ORM** - Database management
- **PostgreSQL** - Primary database
- **TypeScript** - Type safety
- **Zod** - Schema validation

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## 📈 Usage Examples

### Creating a Surgery
```typescript
const surgeryData = {
  surgeryName: "Total Knee Replacement",
  surgeryType: "Orthopedic",
  patientId: "patient-uuid",
  primarySurgeonId: "doctor-uuid",
  operationTheaterId: "ot-uuid",
  scheduledDate: "2025-11-15",
  scheduledStartTime: "2025-11-15T09:00:00Z",
  estimatedDuration: 180,
  priority: "MEDIUM",
  anesthesiaType: "GENERAL"
};

const surgery = await createSurgery(surgeryData);
```

### Updating Pre-Op Checklist
```typescript
const checklistData = {
  consentSigned: true,
  patientIdentityVerified: true,
  allergiesVerified: true,
  bloodTestDone: true,
  ecgDone: true,
  // ... other checklist items
};

await updatePreOpChecklist(surgeryId, checklistData);
```

### Getting OT Availability
```typescript
const availability = await getOTAvailability(
  "2025-11-15",
  "ot-uuid" // optional
);
// Returns available time slots for the day
```

## 🎯 Performance Optimizations

1. **Database Indexing**: Optimized queries on surgeryNumber, otNumber, scheduledDate
2. **Pagination**: All list endpoints support pagination
3. **Lazy Loading**: Components load data on demand
4. **Code Splitting**: Next.js automatic code splitting
5. **Memoization**: React hooks for expensive calculations

## 🔒 Security Features

1. **Input Validation**: Zod schemas validate all API inputs
2. **SQL Injection Prevention**: Prisma parameterized queries
3. **XSS Protection**: React automatic escaping
4. **CORS Configuration**: Restricted origins
5. **Authentication**: JWT-based (integrate with existing auth)

## 📱 Responsive Design

All pages fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Dark mode support throughout the application.

## 🚧 Future Enhancements

1. **Real-time Updates**: WebSocket integration for live OT status
2. **Mobile App**: React Native mobile application
3. **Voice Notes**: Voice-to-text for intra-op documentation
4. **AI Predictions**: ML models for surgery duration estimation
5. **PDF Reports**: Comprehensive surgery reports and discharge summaries
6. **Print Invoices**: Professional invoice templates
7. **Email Notifications**: Automated reminders and alerts
8. **Integration**: PACS, Lab systems, Pharmacy integration
9. **Audit Logs**: Complete activity tracking
10. **Multi-language**: Internationalization support

## 📞 Support

For issues or questions, contact the development team or create an issue in the repository.

## 📄 License

Copyright © 2025 Hospital CRM. All rights reserved.

---

**Built with ❤️ for better healthcare management**
