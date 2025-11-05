# 🏥 Hospital CRM - Comprehensive Hospital Management System

A modern, full-stack Hospital Management System built with **Next.js 16**, **Express.js**, **Prisma**, and **PostgreSQL**. Features a beautiful dark mode UI with smooth animations, real-time notifications, and comprehensive hospital operations management.

![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?logo=postgresql)

## ✨ Features

### 🎨 Modern UI/UX
- **Dark Mode Support** with smooth transitions
- **Framer Motion animations** for fluid interactions
- **Global Search** with keyboard shortcuts (Ctrl+K)
- **Page Transitions** with loading bars
- **Tooltips** and micro-interactions
- **Real-time Notifications** with auto-refresh
- **Responsive Design** optimized for all devices

### 👥 User Management (7 Roles)
- **Super Admin** - Full system control
- **Admin** - Hospital management
- **Doctor** - Patient care and prescriptions
- **Nurse** - IPD management
- **Receptionist** - Patient registration and appointments
- **Lab Technician** - Lab test management
- **Pharmacist** - Medication and inventory

### 📅 Appointment System
- Online appointment booking
- Doctor availability management
- Schedule visualization
- Automated email reminders
- Status tracking (pending, confirmed, completed, cancelled)

### 🏥 Patient Management
- Comprehensive patient profiles
- Medical history tracking
- Vital signs monitoring
- Document uploads
- Multi-role access control

### 💊 Pharmacy Module
- Medication inventory management
- Stock alerts (low stock & expiring items)
- Prescription fulfillment
- Batch tracking
- Automated notifications

### 🔬 Laboratory System
- Test catalog management
- Sample tracking
- Result entry with critical value alerts
- Multiple test types (Hematology, Biochemistry, Microbiology, etc.)
- PDF report generation
- Automatic notifications

### 🏥 IPD Management
- Ward and bed management
- Patient admission/discharge
- Bed occupancy tracking
- Daily charge calculations
- Real-time availability

### 💰 Billing System
- Invoice generation
- Payment processing (Cash, Card, Insurance, UPI)
- Bill tracking
- Discount management
- Payment reports

### 📊 Radiology Module
- Imaging test catalog
- Test ordering
- Result management
- PACS integration ready

### 📋 Medical Records
- Electronic health records
- Diagnosis tracking
- Treatment plans
- Prescription history
- Secure access control

### 🔔 Notification System
- Real-time notifications (8 types)
- Email notifications
- In-app notification center
- Configurable preferences
- Auto-refresh every 30 seconds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/hospital-crm.git
cd hospital-crm
```

2. **Install dependencies**
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

3. **Setup Database**
```bash
cd server

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your PostgreSQL credentials
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hospital_crm"

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

4. **Create Super Admin** (Optional but recommended)
```bash
cd server
npx ts-node prisma/create-superadmin.ts
```

5. **Start Development Servers**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Client runs on http://localhost:3000
```

## 📁 Project Structure

```
hospital-crm/
├── client/                    # Next.js frontend
│   ├── app/                   # App router pages
│   │   ├── dashboard/        # Dashboard pages (62 routes)
│   │   ├── login/            # Authentication pages
│   │   └── page.tsx          # Landing page
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── DashboardLayout.tsx
│   ├── lib/                  # Utilities and API clients
│   │   ├── api/             # API integration
│   │   └── auth-store.ts    # Authentication state
│   └── contexts/            # React contexts
│
├── server/                   # Express.js backend
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Prisma schema
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities (email, PDF)
│   │   ├── cron/            # Scheduled jobs
│   │   └── index.ts         # Server entry point
│   └── package.json
│
└── shared/                   # Shared types/utilities
```

## 🔑 Default Credentials

After seeding the database:

**Super Admin:**
- Email: `superadmin@hospital.com`
- Password: `SuperAdmin@123`

**Admin:**
- Email: `admin@hospital.com`
- Password: `Admin@123`

**Doctor:**
- Email: `doctor@hospital.com`
- Password: `Doctor@123`

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **State Management:** Zustand
- **HTTP Client:** Axios
- **UI Components:** Custom + shadcn/ui
- **Icons:** Lucide React

### Backend
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT
- **Email:** Nodemailer
- **PDF Generation:** PDFKit
- **Validation:** Zod
- **Scheduling:** node-cron

## 📦 Key Packages

### Client
```json
{
  "next": "^16.0.0",
  "framer-motion": "^11.x",
  "tailwindcss": "^4.0.0",
  "zustand": "^4.x",
  "axios": "^1.x",
  "lucide-react": "latest",
  "sonner": "^1.x"
}
```

### Server
```json
{
  "express": "^4.x",
  "@prisma/client": "^5.x",
  "bcryptjs": "^2.x",
  "jsonwebtoken": "^9.x",
  "nodemailer": "^6.x",
  "pdfkit": "^0.x",
  "node-cron": "^3.x",
  "zod": "^3.x"
}
```

## 🎯 Features Implemented

### ✅ Core Features
- [x] Multi-role authentication system
- [x] Dark mode with theme toggle
- [x] Global search (Ctrl+K)
- [x] Real-time notifications
- [x] Email notifications
- [x] Page transitions
- [x] Responsive design

### ✅ Modules
- [x] User Management (7 roles)
- [x] Appointment Booking
- [x] Patient Management
- [x] Doctor Management
- [x] Pharmacy & Inventory
- [x] Laboratory System
- [x] IPD Management
- [x] Billing & Invoicing
- [x] Radiology Module
- [x] Medical Records
- [x] Prescription Management
- [x] Notification System

### ✅ Automation
- [x] Automated appointment reminders
- [x] Daily bed charges calculation
- [x] Critical lab value alerts
- [x] Low stock notifications
- [x] Expiring medication alerts

## 🎨 UI Components

- **StatCard** - Animated statistic cards
- **AnimatedCard** - Cards with hover effects
- **GlassCard** - Glassmorphism cards
- **FormField** - Form inputs with floating labels
- **GradientButton** - Buttons with gradients
- **LoadingSkeleton** - Shimmer loading states
- **PageTransition** - Page change animations
- **GlobalSearch** - Command palette search
- **Tooltip** - Hover tooltips
- **NotificationDropdown** - Real-time notifications

## 📝 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
```http
POST /auth/register
POST /auth/login
POST /auth/refresh-token
POST /auth/forgot-password
POST /auth/reset-password
```

### Appointments
```http
GET    /appointments
POST   /appointments
GET    /appointments/:id
PUT    /appointments/:id
DELETE /appointments/:id
PATCH  /appointments/:id/status
```

### Patients (and 10+ more modules)
See `API_TESTING.md` for full API documentation.

## 🔐 Environment Variables

### Server (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_crm"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Hospital CRM <noreply@hospital.com>"
```

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

- **User** - User accounts and authentication
- **Patient** - Patient information
- **Doctor** - Doctor profiles and specializations
- **Appointment** - Appointment scheduling
- **MedicalRecord** - Medical history
- **Prescription** - Prescriptions and medications
- **LabTest** - Laboratory tests and results
- **RadiologyTest** - Radiology imaging tests
- **Invoice** - Billing and payments
- **Ward** - Hospital wards
- **Bed** - Bed management
- **Admission** - Patient admissions
- **Medication** - Pharmacy inventory
- **Notification** - User notifications

See `server/prisma/schema.prisma` for complete schema.

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test

# Build for production
cd client
npm run build

cd server
npm run build
```

## 📈 Performance

- **Build Size:** Optimized with Next.js Turbopack
- **Loading:** Skeleton loaders and lazy loading
- **Caching:** API response caching
- **Database:** Indexed queries with Prisma
- **Images:** Next.js Image optimization

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
vercel deploy
```

### Backend (Railway/Render)
```bash
cd server
# Configure PostgreSQL database
# Set environment variables
# Deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Harsh**

## 🙏 Acknowledgments

- Next.js team for amazing framework
- Tailwind CSS for utility-first CSS
- Framer Motion for animations
- Prisma for database ORM
- shadcn/ui for component inspiration

## 📞 Support

For support, email harsh@example.com or open an issue on GitHub.

---

**Made with ❤️ for better healthcare management**
