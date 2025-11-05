# 🔐 Hospital CRM - Login Credentials

## Admin Users

### Super Admin (Full Access)
```
📧 Email: superadmin@hospital.com
🔑 Password: SuperAdmin@123
👤 Role: SUPER_ADMIN
```

### Admin (User Management Access)
```
📧 Email: admin@hospital.com
🔑 Password: Admin@123
👤 Role: ADMIN
```

---

## Doctor Users (8 Test Accounts)

### 1. Dr. Sarah Johnson - Cardiologist
```
📧 Email: sarah.johnson@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Cardiology
💼 Qualification: MD, FACC
```

### 2. Dr. Michael Chen - General Medicine
```
📧 Email: michael.chen@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: General Medicine
💼 Qualification: MBBS, MD
```

### 3. Dr. Emily Brown - Dermatologist
```
📧 Email: emily.brown@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Dermatology
💼 Qualification: MD, Dermatology Board Certified
```

### 4. Dr. David Wilson - Orthopedics
```
📧 Email: david.wilson@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Orthopedics
💼 Qualification: MD, MS (Ortho)
```

### 5. Dr. Jessica Martinez - Pediatrician
```
📧 Email: jessica.martinez@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Pediatrics
💼 Qualification: MD, Board Certified Pediatrician
```

### 6. Dr. Robert Taylor - Neurologist
```
📧 Email: robert.taylor@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Neurology
💼 Qualification: MD, DNB (Neurology)
```

### 7. Dr. Amanda Lee - Gynecologist
```
📧 Email: amanda.lee@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Gynecology
💼 Qualification: MD, DGO
```

### 8. Dr. James Anderson - Psychiatrist
```
📧 Email: james.anderson@hospital.com
🔑 Password: Doctor@123
👤 Role: DOCTOR
🏥 Specialization: Psychiatry
💼 Qualification: MD (Psychiatry)
```

---

## Patient Users

Currently, patients need to **self-register** through the registration page at:
```
http://localhost:3000/register
```

Patient registration creates accounts with:
- Role: PATIENT
- Auto-generated Patient ID (PT-2025-XXXX)
- Password: User-defined during registration

---

## Quick Access URLs

### Frontend
- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Patient Dashboard**: http://localhost:3000/dashboard/patient
- **Doctor Dashboard**: http://localhost:3000/dashboard/doctor
- **Admin Dashboard**: http://localhost:3000/dashboard/admin
- **User Management**: http://localhost:3000/dashboard/admin/users

### Backend API
- **Base URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **API v1**: http://localhost:5000/api/v1
- **Login**: POST http://localhost:5000/api/v1/auth/login
- **Users API**: http://localhost:5000/api/v1/users

---

## Testing Workflow

### 1. Test Admin Access
1. Login with `admin@hospital.com` / `Admin@123`
2. Navigate to "User Management" in sidebar
3. View list of all users
4. Create a new user (try creating a nurse or staff member)
5. Test filters and search
6. Toggle user status (activate/deactivate)

### 2. Test Super Admin Access
1. Login with `superadmin@hospital.com` / `SuperAdmin@123`
2. Access all admin features
3. Full system access

### 3. Test Doctor Access
1. Login with any doctor account
2. View doctor dashboard
3. Access appointment management
4. View patient records (when implemented)

### 4. Test Patient Access
1. Register a new patient account
2. Login with patient credentials
3. View patient dashboard
4. Book appointments
5. View appointment history

---

## Creating Additional Test Users

### Via Admin Interface
1. Login as admin
2. Go to User Management
3. Click "Add User"
4. Fill in details and select role
5. Submit to create

### Via Script (Backend)
If you need to create users programmatically, run:
```bash
cd server
npm run create-admin      # Creates admin user
npm run create-superadmin # Creates super admin user
npm run seed              # Seeds 8 doctors
```

---

## Security Notes

⚠️ **Important**: These are **development/testing credentials**. 

For production:
- Change all default passwords
- Implement password complexity requirements
- Enable two-factor authentication
- Use environment variables for sensitive data
- Implement rate limiting on login attempts
- Add email verification for new accounts

---

## Troubleshooting

### Can't Login?
1. Check if backend server is running (port 5000)
2. Check if frontend is running (port 3000)
3. Verify database connection
4. Check browser console for errors
5. Clear browser cache and cookies

### User Not Found?
1. Run `npm run create-admin` in server directory
2. Check database using `npm run prisma:studio`
3. Verify email spelling is correct

### Wrong Password?
Use the exact passwords listed above (case-sensitive):
- Admin: `Admin@123`
- Super Admin: `SuperAdmin@123`
- Doctors: `Doctor@123`

---

## Need More Help?

Run these commands to check system status:

```bash
# Backend status
cd server
npm run dev

# Frontend status  
cd client
npm run dev

# Database GUI
cd server
npm run prisma:studio
```

---

**Last Updated**: October 25, 2025  
**System Version**: 1.0.0  
**Total Users**: 10 (2 admins + 8 doctors)
