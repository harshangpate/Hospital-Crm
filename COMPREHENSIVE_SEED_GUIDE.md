# Comprehensive Database Seed Guide

## 🎯 What This Does

This comprehensive seed script will populate your **entire hospital management system** with realistic, demo-ready data including:

### Data Included:

#### 👥 **Users (50+ users)**
- 1 Super Admin
- 1 Admin
- 15 Doctors (across 15 specializations)
- 9 Staff members (Nurses, Lab Technicians, Pharmacists, Receptionists)
- 30 Patients with complete profiles

#### 📅 **Appointments (50 appointments)**
- Various statuses: Scheduled, Confirmed, In Progress, Completed, Cancelled, No-Show
- Different types: New, Follow-up, Emergency
- Distributed across multiple doctors and patients

#### 📋 **Medical Records (20 records)**
- Complete patient histories
- Physical examination details
- Diagnoses with ICD codes
- Treatment plans

#### 💊 **Pharmacy**
- 15 Different medications (Paracetamol, Antibiotics, etc.)
- Full inventory management with:
  - Batch numbers
  - Expiry dates
  - Stock levels (some low stock for testing alerts)
  - Reorder levels

#### 💉 **Prescriptions (15+ prescriptions)**
- Multiple items per prescription
- Dosage, frequency, and duration
- Instructions for each medication
- Active and completed statuses

#### 🔬 **Laboratory**
- 10 Test types in catalog (CBC, LFT, KFT, Lipid Profile, etc.)
- 25 Lab tests with various statuses:
  - Pending
  - Sample Collected
  - In Progress
  - Completed
  - Reported

#### 📷 **Radiology**
- 10 Imaging types (X-Ray, CT, MRI, Ultrasound, etc.)
- 20 Radiology tests with different statuses
- Complete with findings and reports

#### 🏨 **IPD (In-Patient Department)**
- 7 Wards (General, ICU, CCU, Private, VIP)
- 60+ Beds across all wards
- 10 Active admissions with:
  - Some discharged
  - Some still admitted
  - Emergency and planned admissions

#### 🏥 **Operation Theaters**
- 4 OTs (2 Major, 1 Minor, 1 Emergency)
- Complete equipment lists
- Ready for surgery scheduling

#### 💰 **Billing & Invoices (20 invoices)**
- Paid, Pending, and Partially Paid statuses
- Detailed invoice items
- Multiple payment methods
- Tax calculations

#### 🔔 **Notifications (30 notifications)**
- Appointment reminders
- Lab results ready
- Payment dues
- System announcements

---

## 🚀 How to Run

### Method 1: Run the Comprehensive Seed

```bash
cd server
npm run seed:full
```

This will populate **EVERYTHING** in one go!

### Method 2: Reset Database & Seed Fresh

If you want to start completely fresh:

```bash
cd server

# Reset the database (CAUTION: This deletes all data!)
npx prisma migrate reset --force

# Generate Prisma Client
npx prisma generate

# Run comprehensive seed
npm run seed:full
```

---

## 🔑 Login Credentials

After seeding, you can log in with these accounts:

| Email | Password | Role |
|-------|----------|------|
| `superadmin@hospital.com` | `Password123!` | Super Admin |
| `admin@hospital.com` | `Password123!` | Admin |
| `sarah.johnson@hospital.com` | `Password123!` | Doctor (Cardiology) |
| `michael.chen@hospital.com` | `Password123!` | Doctor (General Medicine) |
| `nurse1@hospital.com` | `Password123!` | Nurse |
| `lab1@hospital.com` | `Password123!` | Lab Technician |
| `pharmacist1@hospital.com` | `Password123!` | Pharmacist |
| `receptionist1@hospital.com` | `Password123!` | Receptionist |

**All users have the password:** `Password123!`

---

## 📊 What You'll See

### Dashboard Features to Showcase:

1. **Admin Dashboard**
   - User management with 50+ users
   - Complete system statistics
   - All roles visible

2. **Doctor Dashboard**
   - 50 appointments to manage
   - Patient medical records
   - Prescription history

3. **Pharmacy Module**
   - 15 medications in inventory
   - Low stock alerts (some items below reorder level)
   - Expiring medicines alerts

4. **Laboratory**
   - 25 tests in various stages
   - Pending tests to process
   - Completed tests with results
   - Test catalog with 10 test types

5. **Radiology**
   - 20 imaging tests
   - Multiple modalities (X-Ray, CT, MRI, Ultrasound)
   - Scheduled and completed tests

6. **IPD Management**
   - 7 wards with 60+ beds
   - 10 admissions (some active, some discharged)
   - Bed availability tracking

7. **Billing & Invoicing**
   - 20 invoices with different statuses
   - Payment tracking
   - Outstanding balances

8. **Operation Theaters**
   - 4 OTs ready for surgeries
   - Equipment tracking
   - Availability management

---

## 📹 Recording Checklist

Perfect scenarios to demonstrate in your recording:

### ✅ User Management
- [x] Show all user types (Admin, Doctors, Nurses, etc.)
- [x] User list with action buttons visible
- [x] Dark theme throughout

### ✅ Appointments
- [x] Multiple appointments with different statuses
- [x] Calendar view populated
- [x] Appointment booking flow

### ✅ Patient Management
- [x] 30 patients with complete profiles
- [x] Patient search functionality
- [x] Medical history

### ✅ Pharmacy
- [x] Medication inventory
- [x] Low stock alerts
- [x] Expiring medicines
- [x] Prescription fulfillment

### ✅ Laboratory
- [x] Test ordering
- [x] Sample collection
- [x] Result entry
- [x] Report generation

### ✅ Radiology
- [x] Imaging test scheduling
- [x] Multiple modalities
- [x] Report viewing

### ✅ IPD
- [x] Ward and bed management
- [x] Patient admission
- [x] Bed occupancy
- [x] Discharge process

### ✅ Billing
- [x] Invoice generation
- [x] Payment processing
- [x] Outstanding balances
- [x] Payment history

### ✅ Surgery & OT
- [x] Operation theaters
- [x] Equipment management
- [x] Surgery scheduling

---

## 🎬 Suggested Recording Flow

1. **Start with Admin Dashboard** (2 min)
   - Show comprehensive statistics
   - Navigate through different modules

2. **User Management** (2 min)
   - Show all user types
   - Demonstrate action buttons
   - Show dark theme consistency

3. **Patient Management** (3 min)
   - Search and filter patients
   - View patient details
   - Show medical history

4. **Appointments** (3 min)
   - Calendar view with multiple appointments
   - Different statuses
   - Booking workflow

5. **Medical Records** (2 min)
   - View existing records
   - Diagnoses and treatment plans

6. **Pharmacy Module** (3 min)
   - Inventory management
   - Low stock alerts
   - Prescription fulfillment

7. **Laboratory** (3 min)
   - Test catalog
   - Order tests
   - View results
   - Pending tests workflow

8. **Radiology** (2 min)
   - Imaging catalog
   - Schedule tests
   - View reports

9. **IPD Management** (3 min)
   - Ward overview
   - Bed status
   - Admission/discharge

10. **Billing & Invoicing** (2 min)
    - Invoice list
    - Payment processing
    - Outstanding balances

11. **Surgery & OT** (2 min)
    - OT availability
    - Equipment tracking
    - Surgery dashboard

12. **Reports & Analytics** (2 min)
    - System statistics
    - Revenue reports
    - Patient analytics

**Total: ~30 minutes of comprehensive demonstration**

---

## ⚠️ Important Notes

1. **Data is for DEMO purposes only** - Don't use in production
2. **All data is randomly generated** - Names, dates, and values are fictional
3. **Low stock items included** - Some medications have low stock to show alerts
4. **Expired items included** - Some items are near expiry to show warnings
5. **Various statuses** - All modules have items in different states for complete demonstration

---

## 🔧 Troubleshooting

### If seed fails:

1. **Check database connection**
   ```bash
   # Make sure PostgreSQL is running
   # Check .env file has correct DATABASE_URL
   ```

2. **Reset and try again**
   ```bash
   npx prisma migrate reset --force
   npx prisma generate
   npm run seed:full
   ```

3. **Check for existing data**
   - The seed script handles duplicates gracefully
   - It will skip existing records and continue

### If you see "already exists" messages:
- This is normal! The script detects existing data and skips it
- The seed is idempotent (safe to run multiple times)

---

## 📞 Need More Data?

The script is designed to be **comprehensive yet realistic**. If you need more:

- **More patients**: Increase the loop count in SECTION 4
- **More appointments**: Increase the loop count in SECTION 10
- **More lab tests**: Increase the loop count in SECTION 13

---

## ✨ You're All Set!

Your hospital system is now **fully populated** and ready for:
- ✅ Comprehensive testing
- ✅ Recording demos
- ✅ Client presentations
- ✅ User training
- ✅ Feature showcasing

**Happy Recording! 🎥**
