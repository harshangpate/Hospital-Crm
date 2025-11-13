# Quick Database Population Script

## Since the comprehensive TypeScript seed has schema mismatches, here's an alternative approach:

### Run this in your terminal (from project root):

```powershell
# Navigate to server directory
cd server

# Run basic seed first (already done)
npm run seed

# Now let's add more data using Prisma Studio
npx prisma studio
```

Then manually add data through Prisma Studio, OR use this quicker approach:

### Option 2: Run Simple Additions

Create a file `quick-additions.ts` and run it:

```typescript
// Run this: npx ts-node prisma/quick-additions.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addMoreData() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  // Add 10 more patients
  for (let i = 3; i <= 12; i++) {
    try {
      const user = await prisma.user.create({
        data: {
          email: `patient${i}@test.com`,
          username: `patient${i}`,
          password: hashedPassword,
          role: 'PATIENT',
          firstName: `Patient${i}`,
          lastName: `Test`,
          phone: `+1-555-300${i}`,
          isActive: true,
          isEmailVerified: true,
          patient: {
            create: {
              patientId: `PT-2025-${String(i).padStart(4, '0')}`,
            },
          },
        },
      });
      console.log(`✅ Created patient${i}@test.com`);
    } catch (error) {
      console.log(`ℹ️  patient${i}@test.com already exists`);
    }
  }
  
  console.log('✅ Additional data added!');
}

addMoreData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## For Your Recording - What You Have Now:

### ✅ Ready to Use:
1. **Users**: Admin, 2 Doctors, Nurse, Lab Tech, Pharmacist, Receptionist, 1 Patient
2. **Medications**: 8 medications with inventory
3. **Wards & Beds**: 3 wards with beds

### 🎬 For Recording Demo:

Since you need more comprehensive data quickly, I recommend:

1. **Use Prisma Studio** (fastest way):
   ```bash
   cd server
   npx prisma studio
   ```
   Then manually add:
   - 10-15 more patients (copy/paste and modify)
   - 5-10 appointments
   - Some medical records
   - Some prescriptions

2. **OR** Let me create manual test data that you can import

Would you like me to:
A) Fix the TypeScript seed file completely (will take some time to match all schema fields)
B) Create SQL INSERT statements you can run directly  
C) Create a simpler TypeScript seed that adds specific data you need

What would you prefer for your recording?
