# Hospital CRM - Installation Guide

## Step-by-Step Installation Instructions

### Prerequisites Required

Before starting, make sure you have these installed on your computer:

1. **Node.js** (Version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (Version 14 or higher)
   - Download from: https://www.postgresql.org/download/
   - During installation, remember your postgres password
   - Verify installation: `psql --version`

3. **Git** (Optional but recommended)
   - Download from: https://git-scm.com/

4. **VS Code** (Recommended code editor)
   - Download from: https://code.visualstudio.com/

---

## Installation Steps

### STEP 1: Project Structure Created ✓
- Root package.json created
- Monorepo structure initialized
- Git ignore file configured

**Status**: COMPLETED

### STEP 2: Install Server Dependencies
Navigate to server folder and install all required packages.

**Commands to run:**
```powershell
cd server
npm install
```

**What this does:**
- Installs Express.js (backend framework)
- Installs Prisma (database ORM)
- Installs authentication packages (JWT, bcrypt)
- Installs other essential server dependencies

### STEP 3: Install Shared Package Dependencies
Navigate to shared folder and install dependencies.

**Commands to run:**
```powershell
cd ..\shared
npm install
```

**What this does:**
- Installs TypeScript compiler
- Sets up shared types package

### STEP 4: Setup PostgreSQL Database
Create a new database for the hospital CRM.

**Steps:**
1. Open PostgreSQL command line (psql) or pgAdmin
2. Create a new database:
```sql
CREATE DATABASE hospital_crm;
```
3. Note down your database credentials:
   - Host: localhost
   - Port: 5432
   - Username: postgres (default)
   - Password: (your postgres password)
   - Database: hospital_crm

### STEP 5: Configure Environment Variables
Create .env file in the server folder.

**Commands to run:**
```powershell
cd ..\server
copy .env.example .env
```

Then edit the .env file with your database credentials.

### STEP 6: Initialize Prisma
Setup Prisma ORM and create database schema.

**Commands to run:**
```powershell
npx prisma init
```

**What this does:**
- Creates prisma folder
- Generates Prisma schema file
- Sets up database connection

### STEP 7: Create Database Schema
Define all database tables and relationships.

This will include tables for:
- Users (Doctors, Nurses, Staff, Patients)
- Appointments
- Medical Records
- Billing & Invoices
- Pharmacy & Inventory
- Laboratory Tests
- And many more...

### STEP 8: Run Database Migrations
Apply the schema to your PostgreSQL database.

**Commands to run:**
```powershell
npx prisma migrate dev --name init
npx prisma generate
```

**What this does:**
- Creates all database tables
- Sets up relationships
- Generates Prisma Client for type-safe queries

### STEP 9: Setup Frontend (Client)
The Next.js app is already created. Now we'll add additional packages.

**Commands to run:**
```powershell
cd ..\client
npm install
```

### STEP 10: Install UI Component Library
Install shadcn/ui for beautiful, modern components.

**Commands to run:**
```powershell
npx shadcn@latest init
```

**What this does:**
- Adds high-quality, customizable UI components
- Sets up design system
- Provides modern, professional look

### STEP 11: Create Server Entry Point
Create the main server file with Express setup.

### STEP 12: Test the Setup
Run both frontend and backend to verify everything works.

**Commands to run:**
```powershell
# From project root
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

---

## Current Status

✅ **COMPLETED:**
- Root project structure
- Next.js client setup
- Server folder structure
- Shared types package
- Configuration files

⏳ **PENDING:**
- Server dependencies installation (STEP 2)
- Database setup (STEP 4-8)
- Additional frontend packages (STEP 10)
- Core functionality implementation

---

## What We'll Build Next

After completing the installation steps, we'll implement:

1. **Authentication System** - Login, registration, role-based access
2. **Dashboard** - Different dashboards for different user roles
3. **Patient Management** - Registration, records, history
4. **Appointment System** - Scheduling, calendar, reminders
5. **Billing System** - Invoices, payments, insurance
6. And 400+ more features...

---

## Need Help?

If you encounter any errors during installation, note down:
1. The exact error message
2. Which step you're on
3. Your system information (Windows version, Node version)

---

**NEXT ACTION:** Type "DONE" when you're ready to proceed with STEP 2 (Server Dependencies Installation).
