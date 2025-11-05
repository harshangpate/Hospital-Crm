<div align="center">

# 🏥 Hospital CRM - Modern Healthcare Management System

### A comprehensive, production-ready Hospital Management System built with cutting-edge technologies

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [Core Modules](#-core-modules)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Hospital CRM** is a full-stack, enterprise-grade hospital management system designed to streamline healthcare operations. Built with modern web technologies, it offers a seamless experience for managing patients, appointments, medical records, billing, pharmacy, laboratory tests, and more.

### Why This Project?

- ✅ **Production-Ready**: Built with enterprise best practices
- ✅ **Scalable Architecture**: Microservices-ready design
- ✅ **Beautiful UI**: Dark mode, animations, and responsive design
- ✅ **Real-Time Features**: Live notifications and updates
- ✅ **Comprehensive**: 12+ modules covering all hospital operations
- ✅ **Type-Safe**: Full TypeScript implementation
- ✅ **Well-Documented**: Extensive documentation and API specs

---

## 🚀 Key Features

### 🎨 **Modern User Interface**
- 🌓 **Dark/Light Mode** - Smooth theme transitions with system preference detection
- ✨ **Framer Motion Animations** - Fluid page transitions and micro-interactions
- 🔍 **Global Search** - Instant search with keyboard shortcuts (⌘K / Ctrl+K)
- 💡 **Tooltips & Hints** - Context-aware guidance throughout the app
- 📱 **Fully Responsive** - Optimized for desktop, tablet, and mobile
- 🎯 **Loading States** - Shimmer effects and skeleton loaders

### 👥 **Multi-Role Access System** (7 Roles)
- 🔐 **Super Admin** - Complete system control and configuration
- 👔 **Admin** - Hospital-wide management and oversight
- 👨‍⚕️ **Doctor** - Patient care, prescriptions, and medical records
- 👩‍⚕️ **Nurse** - IPD management and patient monitoring
- 💁 **Receptionist** - Patient registration and appointment scheduling
- 🔬 **Lab Technician** - Laboratory test management
- 💊 **Pharmacist** - Medication inventory and dispensing

### 📅 **Appointment Management**
- Online appointment booking with real-time availability
- Doctor schedule management with time slot configuration
- Automated email and SMS reminders
- Appointment status tracking (Pending, Confirmed, Completed, Cancelled)
- Patient history integration
- Recurring appointment support

### 🏥 **Patient Management**
- Comprehensive patient profiles with demographics
- Medical history and chronic conditions tracking
- Document uploads (reports, prescriptions, images)
- Family member linking
- Insurance information management
- Multi-visit tracking

### 💊 **Pharmacy Module**
- Complete medication inventory management
- Low stock alerts with automated notifications
- Expiring medication tracking
- Batch number and expiry date management
- Prescription fulfillment workflow
- Stock adjustment and audit trail
- Supplier management

### 🔬 **Laboratory System**
- Test catalog with 50+ predefined tests
- Sample collection and tracking
- Result entry with critical value alerts
- Multi-parameter test support
- PDF report generation with hospital branding
- Test categories: Hematology, Biochemistry, Microbiology, Serology
- Automated doctor notifications on result completion

### 🏥 **IPD (In-Patient Department)**
- Ward and bed management system
- Patient admission and discharge workflows
- Bed occupancy tracking and availability
- Daily bed charges calculation (automated)
- Transfer between wards/beds
- Discharge summary generation

### 💰 **Billing & Invoicing**
- Comprehensive invoice generation
- Multiple payment methods (Cash, Card, Insurance, UPI)
- Partial payment support
- Discount and tax management
- Payment history tracking
- Receipt generation
- Outstanding balance tracking
- Financial reports

### 🩻 **Radiology Module**
- Imaging test catalog (X-Ray, CT, MRI, Ultrasound)
- Test ordering and scheduling
- Result management with image uploads
- PACS integration ready
- Radiologist assignment

### 📋 **Medical Records (EHR)**
- Electronic health records with version control
- Diagnosis tracking (ICD-10 codes)
- Treatment plans and progress notes
- Prescription history
- Lab and radiology results integration
- Secure access with audit logs

### 🔔 **Notification System**
- Real-time in-app notifications
- Email notifications for critical events
- 8 notification types (Appointment, Lab Result, Prescription, Billing, etc.)
- Notification preferences management
- Auto-refresh every 30 seconds
- Mark as read/unread functionality
- Notification history

### 📊 **Reports & Analytics**
- Patient statistics and demographics
- Revenue reports and trends
- Appointment analytics
- Inventory reports
- Lab test statistics
- Bed occupancy reports

### 🔐 **Security Features**
- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption (bcrypt)
- Secure password reset via email
- Session management
- API rate limiting ready
- Audit logs for sensitive operations

---

## 🛠️ Technology Stack

<div align="center">

### **Frontend**
![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.x-FF0055?logo=framer&logoColor=white)

### **Backend**
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-316192?logo=postgresql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)

### **Tools & Libraries**
![Zustand](https://img.shields.io/badge/Zustand-4.x-000000)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4)
![Zod](https://img.shields.io/badge/Zod-3.x-3E67B1)
![Nodemailer](https://img.shields.io/badge/Nodemailer-6.x-0F9DCE)

</div>

### Detailed Stack

#### **Frontend** (`/client`)
- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Custom components + shadcn/ui primitives
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Zustand for global state
- **HTTP Client**: Axios with interceptors
- **Form Validation**: Zod schemas
- **Icons**: Lucide React (40+ icons)
- **Notifications**: Sonner for toast notifications
- **Date Handling**: date-fns

#### **Backend** (`/server`)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5 (Type-safe database client)
- **Authentication**: JWT with bcryptjs
- **Email Service**: Nodemailer (Gmail SMTP)
- **PDF Generation**: PDFKit for reports
- **Validation**: Zod for request validation
- **Scheduled Tasks**: node-cron for automated jobs
- **Dev Tools**: nodemon, ts-node

#### **Development Tools**
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript rules
- **Code Formatting**: Prettier (optional)
- **Version Control**: Git
- **API Testing**: Thunder Client / Postman

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Next.js 16)                      │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   App    │  Pages   │Components│   API    │  Stores  │  │
│  │  Router  │   62+    │   UI     │  Client  │ (Zustand)│  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         │ (Axios)
┌────────────────────────┴────────────────────────────────────┐
│                   Server (Express.js)                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Routes  │Controller│Middleware│ Services │ Utilities│  │
│  │   API    │ Business │   Auth   │  Email   │   PDF    │  │
│  │ Endpoints│  Logic   │   JWT    │  Cron    │  Crypto  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma ORM
                         │
┌────────────────────────┴────────────────────────────────────┐
│                PostgreSQL Database                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tables: User, Patient, Doctor, Appointment,        │   │
│  │  MedicalRecord, Prescription, LabTest, Invoice,     │   │
│  │  Medication, Ward, Bed, Admission, Notification     │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** (comes with Node.js)
- **Git** for version control

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hospital-crm.git
cd hospital-crm
```

#### 2️⃣ Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

#### 3️⃣ Database Setup

```bash
cd server

# Create .env file from example
cp .env.example .env

# Edit .env and add your PostgreSQL credentials:
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hospital_crm"
# JWT_SECRET="your-super-secret-jwt-key"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
```

#### 4️⃣ Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
```

#### 5️⃣ Create Super Admin (Optional)

```bash
# Create a super admin user
npx ts-node prisma/create-superadmin.ts

# Follow the prompts to enter:
# - Email
# - Password
# - First Name
# - Last Name
```

#### 6️⃣ Start Development Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
# ✓ Server running on http://localhost:5000
```

**Terminal 2 - Frontend Client:**
```bash
cd client
npm run dev
# ✓ Client running on http://localhost:3000
```

#### 7️⃣ Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## 📁 Project Structure

```
hospital-crm/
│
├── 📂 client/                        # Next.js Frontend Application
│   ├── 📂 app/                       # App Router (Next.js 16)
│   │   ├── 📂 dashboard/             # Dashboard routes (62 pages)
│   │   │   ├── 📂 admin/             # Admin pages
│   │   │   ├── 📂 appointments/      # Appointment management
│   │   │   ├── 📂 billing/           # Billing & invoicing
│   │   │   ├── 📂 doctor/            # Doctor dashboard
│   │   │   ├── 📂 laboratory/        # Lab management
│   │   │   ├── 📂 pharmacy/          # Pharmacy module
│   │   │   ├── 📂 patients/          # Patient management
│   │   │   ├── 📂 ipd/               # In-patient department
│   │   │   └── 📂 ...                # Other modules
│   │   ├── 📄 layout.tsx             # Root layout with providers
│   │   ├── 📄 page.tsx               # Landing page
│   │   ├── 📄 login/page.tsx         # Login page
│   │   └── 📄 register/page.tsx      # Registration page
│   │
│   ├── 📂 components/                # React Components
│   │   ├── 📂 ui/                    # Reusable UI components
│   │   │   ├── AnimatedCard.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── GlobalSearch.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── ...
│   │   ├── DashboardLayout.tsx       # Main dashboard layout
│   │   └── ProtectedRoute.tsx        # Auth guard component
│   │
│   ├── 📂 lib/                       # Libraries & Utilities
│   │   ├── 📂 api/                   # API client modules
│   │   │   ├── appointments.ts
│   │   │   ├── auth.ts
│   │   │   ├── notifications.ts
│   │   │   ├── prescriptions.ts
│   │   │   └── users.ts
│   │   ├── api-client.ts             # Axios instance
│   │   ├── auth-store.ts             # Authentication store
│   │   └── utils.ts                  # Utility functions
│   │
│   ├── 📂 contexts/                  # React Contexts
│   │   └── ThemeContext.tsx          # Dark mode context
│   │
│   ├── 📄 package.json               # Dependencies
│   ├── 📄 next.config.ts             # Next.js configuration
│   ├── 📄 tailwind.config.ts         # Tailwind CSS config
│   └── 📄 tsconfig.json              # TypeScript config
│
├── 📂 server/                        # Express.js Backend
│   ├── 📂 prisma/                    # Database Schema & Migrations
│   │   ├── 📄 schema.prisma          # Database schema
│   │   ├── 📂 migrations/            # Database migrations
│   │   ├── 📄 seed.ts                # Database seeding
│   │   └── 📄 create-superadmin.ts   # Admin creation script
│   │
│   ├── 📂 src/
│   │   ├── 📂 controllers/           # Request Handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── appointment.controller.ts
│   │   │   ├── billing.controller.ts
│   │   │   ├── labTest.controller.ts
│   │   │   ├── pharmacy.controller.ts
│   │   │   └── ...
│   │   │
│   │   ├── 📂 routes/                # API Routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── appointment.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── ...
│   │   │
│   │   ├── 📂 middleware/            # Express Middleware
│   │   │   └── auth.ts               # JWT verification
│   │   │
│   │   ├── 📂 services/              # Business Logic
│   │   │   └── email.service.ts      # Email sending
│   │   │
│   │   ├── 📂 utils/                 # Utility Functions
│   │   │   ├── emailService.ts       # Nodemailer config
│   │   │   ├── pdfGenerator.ts       # PDF generation
│   │   │   └── auth.ts               # JWT utilities
│   │   │
│   │   ├── 📂 validators/            # Zod Schemas
│   │   │   ├── auth.validator.ts
│   │   │   ├── appointment.validator.ts
│   │   │   └── user.validator.ts
│   │   │
│   │   ├── 📂 cron/                  # Scheduled Jobs
│   │   │   ├── appointmentReminders.ts
│   │   │   └── dailyBedCharges.ts
│   │   │
│   │   └── 📄 index.ts               # Server entry point
│   │
│   ├── 📄 package.json               # Dependencies
│   ├── 📄 tsconfig.json              # TypeScript config
│   ├── 📄 .env.example               # Environment template
│   └── 📄 nodemon.json               # Nodemon config
│
├── 📂 shared/                        # Shared Code (Future)
│   └── 📄 types.ts                   # Shared TypeScript types
│
├── 📄 .gitignore                     # Git ignore rules
├── 📄 README.md                      # This file
├── 📄 package.json                   # Root package.json
└── 📄 LICENSE                        # MIT License

```

---

## 👤 User Roles & Permissions

| Role | Access Level | Key Permissions |
|------|-------------|----------------|
| **Super Admin** | Full System | All modules, User management, System settings |
| **Admin** | Hospital-wide | All clinical modules, Reports, Staff management |
| **Doctor** | Clinical | Patients, Appointments, Prescriptions, Medical records |
| **Nurse** | Patient Care | IPD management, Patient monitoring, Basic records |
| **Receptionist** | Front Desk | Patient registration, Appointments, Check-in/out |
| **Lab Technician** | Laboratory | Lab tests, Sample collection, Results entry |
| **Pharmacist** | Pharmacy | Medication inventory, Prescription fulfillment |

---

## 🔧 Core Modules

### 1. **Authentication & Authorization**
- JWT-based secure authentication
- Role-based access control
- Password reset via email
- Session management

### 2. **Appointment System**
- Real-time availability checking
- Multiple appointment types
- Doctor schedule management
- Automated reminders

### 3. **Patient Management**
- Comprehensive patient profiles
- Medical history tracking
- Document management
- Family linking

### 4. **Laboratory System**
- 50+ predefined tests
- Sample tracking
- Result management
- Critical value alerts
- PDF reports

### 5. **Pharmacy Management**
- Inventory tracking
- Stock alerts
- Prescription fulfillment
- Batch management

### 6. **IPD Management**
- Ward/bed allocation
- Admission workflow
- Daily charges
- Discharge summary

### 7. **Billing & Invoicing**
- Invoice generation
- Payment processing
- Outstanding tracking
- Financial reports

### 8. **Medical Records**
- Electronic health records
- Diagnosis tracking
- Treatment plans
- Prescription history

### 9. **Notification System**
- Real-time alerts
- Email notifications
- In-app notification center
- User preferences

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # User login
POST   /api/auth/refresh-token     # Refresh JWT token
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password with token
GET    /api/auth/me                # Get current user
```

### Example Request

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "Doctor@123"
  }'

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "doctor@hospital.com",
    "role": "DOCTOR",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Protected Routes

All protected routes require Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

For complete API documentation, see [API_TESTING.md](API_TESTING.md)

---

## 🔑 Default Credentials

After running the seed script, you can login with:

### Super Admin
- **Email**: `superadmin@hospital.com`
- **Password**: `SuperAdmin@123`

### Admin
- **Email**: `admin@hospital.com`
- **Password**: `Admin@123`

### Doctor
- **Email**: `doctor@hospital.com`
- **Password**: `Doctor@123`

### Other Roles
- **Nurse**: `nurse@hospital.com` / `Nurse@123`
- **Receptionist**: `receptionist@hospital.com` / `Receptionist@123`
- **Lab Technician**: `lab@hospital.com` / `Lab@123`
- **Pharmacist**: `pharmacist@hospital.com` / `Pharmacist@123`

⚠️ **Important**: Change these passwords in production!

---

## 🌐 Environment Variables

### Server (`server/.env`)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hospital_crm"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# Email (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-digit-app-password"
SMTP_FROM="Hospital CRM <noreply@hospital.com>"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:3000"
```

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Deployment

### Frontend (Vercel)

1. **Push to GitHub**
2. **Import to Vercel**: https://vercel.com/new
3. **Configure**:
   - Framework: Next.js
   - Root Directory: `client`
   - Environment Variables: `NEXT_PUBLIC_API_URL`
4. **Deploy**

### Backend (Railway/Render)

1. **Create PostgreSQL Database**
2. **Deploy Backend**:
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
3. **Set Environment Variables**
4. **Run Migrations**: `npx prisma migrate deploy`

---

## 🧪 Testing

```bash
# Run backend in development
cd server
npm run dev

# Run frontend in development
cd client
npm run dev

# Build for production
cd client
npm run build

cd server
npm run build
```

---

## 📝 Available Scripts

### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Server
```bash
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm run start        # Start production server
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma generate  # Generate Prisma Client
npx prisma migrate   # Run migrations
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Harsh**

- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- Email: harsh@example.com

---

## 🙏 Acknowledgments

Special thanks to:

- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [shadcn/ui](https://ui.shadcn.com/) - UI component inspiration
- [Lucide](https://lucide.dev/) - Beautiful icon set

---

## 📞 Support

For support, please:
- 📧 Email: harsh@example.com
- 🐛 Open an issue on GitHub
- 💬 Join our Discord community (coming soon)

---

## 🗺️ Roadmap

### Version 2.0 (Upcoming)
- [ ] Mobile app (React Native)
- [ ] Telemedicine integration
- [ ] AI-powered diagnosis assistance
- [ ] Multi-language support
- [ ] HIPAA compliance features
- [ ] HL7 FHIR integration
- [ ] Backup and restore system
- [ ] Advanced analytics dashboard

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ for better healthcare management**

[Report Bug](https://github.com/YOUR_USERNAME/hospital-crm/issues) • [Request Feature](https://github.com/YOUR_USERNAME/hospital-crm/issues)

</div>
