# Hospital CRM Database Seeding Guide

## 📁 Seed Files Structure

All seed files are organized in the `server/prisma/seeds/` directory:

```
prisma/
├── seed.ts                          # Main orchestration file
└── seeds/
    ├── 01-users.ts                  # Users (Admin, Doctors, Staff, Patients)
    ├── 02-patients.ts               # Patient profiles
    ├── 03-doctors.ts                # Doctor profiles
    ├── 04-staff.ts                  # Staff members
    ├── 05-doctor-schedules.ts       # Doctor weekly availability
    ├── 06-appointments.ts           # Appointments
    ├── 07-allergies.ts              # Patient allergies
    ├── 08-medical-history.ts        # Medical history records
    ├── 09-medications.ts            # Medication catalog
    ├── 10-medicine-inventory.ts     # Pharmacy inventory
    ├── 11-wards.ts                  # Hospital wards
    ├── 12-beds.ts                   # Hospital beds
    ├── 13-admissions.ts             # Patient admissions
    ├── 14-settings.ts               # System settings
    ├── 15-notifications.ts          # Notifications
    └── 16-audit-logs.ts             # Audit logs
```

## 🚀 Running the Seeds

### Run All Seeds
```bash
cd server
npx ts-node prisma/seed.ts
```

### Run Individual Seed File
```bash
cd server
npx ts-node -e "import('./prisma/seeds/01-users').then(m => m.seedUsers())"
```

## 📊 Seeded Data Summary

### Users (01-users.ts)
- **1 Super Admin**: superadmin@hospital.com / SuperAdmin@123
- **1 Admin**: admin@hospital.com / Admin@123
- **6 Doctors**: sarah.johnson@hospital.com, michael.chen@hospital.com, etc. / Doctor@123
- **2 Nurses**: mary.williams@hospital.com, jennifer.davis@hospital.com / Staff@123
- **2 Receptionists**: lisa.thompson@hospital.com, karen.moore@hospital.com / Staff@123
- **2 Pharmacists**: john.pharmacist@hospital.com, patricia.white@hospital.com / Staff@123
- **2 Lab Technicians**: thomas.lab@hospital.com, nancy.rodriguez@hospital.com / Staff@123
- **1 Radiologist**: daniel.martin@hospital.com / Doctor@123
- **1 Accountant**: richard.accountant@hospital.com / Staff@123
- **10 Patients**: john.doe@email.com, jane.smith@email.com, etc. / Patient@123

### Patients (02-patients.ts)
- 10 patients with complete profiles
- Blood groups, emergency contacts, insurance details
- Chronic conditions and current medications

### Doctors (03-doctors.ts)
- 6 specialists: Cardiology, General Medicine, Dermatology, Orthopedics, Pediatrics, Neurology
- Consultation fees: $150-$250
- Experience: 10-22 years

### Doctor Schedules (05-doctor-schedules.ts)
- Weekly schedules for all 6 doctors
- Varying availability patterns (weekdays/weekends)
- Working hours from 8:00 AM to 6:00 PM

### Appointments (06-appointments.ts)
- 14 appointments (past, present, future)
- Various statuses: Completed, Scheduled, Confirmed, Cancelled, No-Show
- Different appointment types: New Consultation, Follow-up, Routine Checkup

### Allergies (07-allergies.ts)
- 12 allergy records
- Types: Medication, Food, Environmental
- Severity levels: Mild, Moderate, Severe, Life-Threatening

### Medical History (08-medical-history.ts)
- 15 medical history records
- Chronic conditions, surgeries, acute illnesses
- Both resolved and ongoing conditions

### Medications (09-medications.ts)
- 20 medications covering major categories:
  - Cardiovascular (Lisinopril, Atorvastatin, Metoprolol, Aspirin)
  - Diabetes (Metformin, Insulin)
  - Respiratory (Albuterol, Montelukast)
  - Antibiotics (Amoxicillin, Azithromycin, Ciprofloxacin)
  - Pain Relief (Acetaminophen, Ibuprofen, Tramadol)
  - Others (Levothyroxine, Omeprazole, etc.)

### Medicine Inventory (10-medicine-inventory.ts)
- 20 inventory records with batch numbers
- Expiry dates, quantity, reorder levels
- Supplier information and storage locations

### Wards & Beds (11-wards.ts, 12-beds.ts)
- 6 wards: ICU, General (Male/Female), Private, Semi-Private, Pediatric
- 88 beds across all wards
- Various bed statuses: Available, Occupied

### Admissions (13-admissions.ts)
- 5 admission records
- Mix of emergency and planned admissions
- Active and discharged patients

### Settings (14-settings.ts)
- Hospital configuration
- Working hours, contact information
- System preferences

### Notifications (15-notifications.ts)
- 10 sample notifications
- Types: Appointments, Lab Results, Prescriptions, Billing

### Audit Logs (16-audit-logs.ts)
- 8 audit log entries
- User actions: Login, Create, Update
- IP addresses and user agents

## 🎯 Modifying Seeds

### Add More Data to Existing Seeds
Edit the relevant seed file in `seeds/` directory and add new records to the array.

Example (adding a doctor):
```typescript
// seeds/03-doctors.ts
const doctors = [
  // ... existing doctors
  {
    id: 'doctor-007',
    userId: 'user-doctor-007',
    doctorId: 'DOC007',
    specialization: 'Psychiatry',
    qualification: 'MD (Psychiatry)',
    experience: 14,
    licenseNumber: 'MED-NY-78901',
    consultationFee: 200.0,
    isAvailable: true,
    department: 'Psychiatry',
    designation: 'Consultant Psychiatrist',
  },
];
```

### Create New Seed File
1. Create a new file: `seeds/17-your-table.ts`
2. Export an async function: `export async function seedYourTable()`
3. Import and call it in `seed.ts`

## 📝 Notes

- Seeds use `upsert` where possible to avoid duplicates
- IDs are predefined for easy cross-referencing
- All dates are relative to current date for realism
- Passwords are properly hashed using bcrypt
- Foreign key relationships are maintained

## 🔒 Security

- Default passwords are for development only
- Change all passwords before deploying to production
- Review and customize sensitive data

## 🆘 Troubleshooting

### "Unique constraint violation"
- Run `npx prisma db push --force-reset` to reset the database
- Then run the seed script again

### "Foreign key constraint failed"
- Ensure seeds run in correct order (dependencies first)
- Check that referenced IDs exist

### TypeScript errors
- Ensure Prisma client is generated: `npx prisma generate`
- Check that all imports are correct
