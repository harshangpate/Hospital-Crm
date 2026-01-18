import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const cities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
];

const hrManagers = [
  { firstName: 'Priyanka', lastName: 'Sharma' },
  { firstName: 'Rajesh', lastName: 'Gupta' },
  { firstName: 'Sneha', lastName: 'Patel' },
  { firstName: 'Amit', lastName: 'Kumar' },
  { firstName: 'Kavita', lastName: 'Singh' },
];

function generatePhone(): string {
  return `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

function generatePincode(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedHRManagers() {
  console.log('🏢 Starting to seed HR Manager accounts...\n');

  const credentialsList: any[] = [];

  for (let i = 0; i < hrManagers.length; i++) {
    const name = hrManagers[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@hospital.com`;
    const password = `HR${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = cities[i % cities.length];
    const dob = getRandomDate(new Date(1980, 0, 1), new Date(1995, 11, 31));

    console.log(`Creating HR Manager: ${name.firstName} ${name.lastName}...`);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'HR_MANAGER',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['HR Wing', 'Admin Block', 'Management Office', 'Corporate Floor'][i % 4]}`,
        city: location.city,
        state: location.state,
        pincode: generatePincode(),
        isActive: true,
        isEmailVerified: true,
      },
    });

    await prisma.staff.create({
      data: {
        userId: user.id,
        staffId: `HR${String(i + 1).padStart(4, '0')}`,
        department: 'Human Resources',
        designation: ['HR Manager', 'Senior HR Manager', 'HR Director', 'Chief HR Officer', 'VP Human Resources'][i % 5],
        joiningDate: getRandomDate(new Date(2018, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'HR_MANAGER',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: 'Human Resources',
      staffId: `HR${String(i + 1).padStart(4, '0')}`,
    });

    console.log(`✅ Created: ${name.firstName} ${name.lastName}`);
  }

  console.log('\n✅ Successfully created all HR Manager accounts!\n');
  console.log('📝 Login Credentials:\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('| # | Name                | Email                                    | Password          |');
  console.log('═══════════════════════════════════════════════════════════════');
  credentialsList.forEach((cred, index) => {
    console.log(`| ${index + 1} | ${cred.name.padEnd(20)} | ${cred.email.padEnd(40)} | ${cred.password.padEnd(17)} |`);
  });
  console.log('═══════════════════════════════════════════════════════════════\n');

  return credentialsList;
}

async function main() {
  try {
    const credentials = await seedHRManagers();
    
    // Save credentials to file
    const fs = require('fs');
    const credentialsText = `
# 🏢 HR MANAGER ACCOUNTS - LOGIN CREDENTIALS
**Generated on:** ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

## HR Manager Accounts (${credentials.length})

| # | Name | Email | Password | Staff ID | Department |
|---|------|-------|----------|----------|------------|
${credentials.map((c, i) => `| ${i + 1} | ${c.name} | ${c.email} | ${c.password} | ${c.staffId} | ${c.department} |`).join('\n')}

---

## 🔑 Quick Access

**Primary HR Manager:**
- Email: ${credentials[0].email}
- Password: ${credentials[0].password}

**Access:** Login at http://localhost:3000/login and navigate to Dashboard → Staff → HR

---

## 📌 Features Available to HR Managers:

1. ✅ Full access to HR Portal
2. ✅ Attendance Management
3. ✅ Leave Management
4. ✅ Payroll System
5. ✅ Shift Scheduling
6. ✅ Performance Reviews
7. ✅ Staff Directory

---

**All accounts are active and ready to use!** 🎉
`;

    fs.writeFileSync('../HR_MANAGER_CREDENTIALS.md', credentialsText);
    console.log('📄 Credentials saved to HR_MANAGER_CREDENTIALS.md\n');
    
    console.log('🎉 HR Manager seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding HR Managers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
