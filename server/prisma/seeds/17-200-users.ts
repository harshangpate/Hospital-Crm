import { PrismaClient, BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const cities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
];

const specializations = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
  'Gynecology', 'Ophthalmology', 'ENT', 'General Medicine', 'Psychiatry',
  'Urology', 'Nephrology', 'Gastroenterology', 'Endocrinology', 'Oncology'
];

const qualifications = [
  'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, DM', 'MBBS, MCh',
  'MBBS, MD, DM', 'MBBS, MS, MCh', 'MBBS, MD, FACC', 'MBBS, MD, FRCP'
];

const departments = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency',
  'ICU', 'General Ward', 'Surgery', 'Laboratory', 'Radiology',
  'Pharmacy', 'Administration', 'Reception', 'Accounts'
];

const bloodGroups: BloodGroup[] = [
  BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE,
  BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE
];

// Doctor names (30)
const doctorNames = [
  { firstName: 'Rajesh', lastName: 'Kumar' },
  { firstName: 'Priya', lastName: 'Sharma' },
  { firstName: 'Amit', lastName: 'Patel' },
  { firstName: 'Sneha', lastName: 'Reddy' },
  { firstName: 'Vikram', lastName: 'Singh' },
  { firstName: 'Meera', lastName: 'Iyer' },
  { firstName: 'Arjun', lastName: 'Desai' },
  { firstName: 'Kavya', lastName: 'Nair' },
  { firstName: 'Rahul', lastName: 'Gupta' },
  { firstName: 'Anjali', lastName: 'Verma' },
  { firstName: 'Sanjay', lastName: 'Mehta' },
  { firstName: 'Pooja', lastName: 'Shah' },
  { firstName: 'Karthik', lastName: 'Rao' },
  { firstName: 'Divya', lastName: 'Pillai' },
  { firstName: 'Arun', lastName: 'Krishnan' },
  { firstName: 'Nisha', lastName: 'Joshi' },
  { firstName: 'Suresh', lastName: 'Menon' },
  { firstName: 'Lakshmi', lastName: 'Bhat' },
  { firstName: 'Deepak', lastName: 'Agarwal' },
  { firstName: 'Ritu', lastName: 'Malhotra' },
  { firstName: 'Manish', lastName: 'Chopra' },
  { firstName: 'Swati', lastName: 'Kapoor' },
  { firstName: 'Nitin', lastName: 'Bansal' },
  { firstName: 'Preeti', lastName: 'Sinha' },
  { firstName: 'Vivek', lastName: 'Pandey' },
  { firstName: 'Aarti', lastName: 'Kulkarni' },
  { firstName: 'Harsh', lastName: 'Tiwari' },
  { firstName: 'Neha', lastName: 'Saxena' },
  { firstName: 'Rohan', lastName: 'Bhatt' },
  { firstName: 'Shruti', lastName: 'Mishra' },
];

// Nurse names (25)
const nurseNames = [
  { firstName: 'Sunita', lastName: 'Devi' },
  { firstName: 'Radha', lastName: 'Kumari' },
  { firstName: 'Geeta', lastName: 'Rani' },
  { firstName: 'Parvati', lastName: 'Bai' },
  { firstName: 'Anita', lastName: 'Singh' },
  { firstName: 'Seema', lastName: 'Sharma' },
  { firstName: 'Rekha', lastName: 'Patel' },
  { firstName: 'Madhuri', lastName: 'Nair' },
  { firstName: 'Shobha', lastName: 'Iyer' },
  { firstName: 'Kamala', lastName: 'Reddy' },
  { firstName: 'Pushpa', lastName: 'Verma' },
  { firstName: 'Savita', lastName: 'Gupta' },
  { firstName: 'Asha', lastName: 'Mehta' },
  { firstName: 'Lata', lastName: 'Desai' },
  { firstName: 'Usha', lastName: 'Shah' },
  { firstName: 'Vandana', lastName: 'Pillai' },
  { firstName: 'Namita', lastName: 'Joshi' },
  { firstName: 'Kiran', lastName: 'Menon' },
  { firstName: 'Sangita', lastName: 'Bhat' },
  { firstName: 'Jyoti', lastName: 'Agarwal' },
  { firstName: 'Mamta', lastName: 'Malhotra' },
  { firstName: 'Rita', lastName: 'Chopra' },
  { firstName: 'Suman', lastName: 'Kapoor' },
  { firstName: 'Nirmala', lastName: 'Bansal' },
  { firstName: 'Padma', lastName: 'Sinha' },
];

// Staff names for other roles (55 total: 10 Receptionists, 10 Pharmacists, 15 Lab Techs, 10 Radiologists, 10 Accountants)
const staffNames = [
  // Receptionists (10)
  { firstName: 'Riya', lastName: 'Khanna' },
  { firstName: 'Simran', lastName: 'Sethi' },
  { firstName: 'Tanvi', lastName: 'Dubey' },
  { firstName: 'Ishita', lastName: 'Arora' },
  { firstName: 'Prachi', lastName: 'Sood' },
  { firstName: 'Ritika', lastName: 'Kohli' },
  { firstName: 'Aditi', lastName: 'Bhatia' },
  { firstName: 'Nidhi', lastName: 'Garg' },
  { firstName: 'Sakshi', lastName: 'Singhal' },
  { firstName: 'Megha', lastName: 'Mittal' },
  // Pharmacists (10)
  { firstName: 'Vishal', lastName: 'Jain' },
  { firstName: 'Gaurav', lastName: 'Aggarwal' },
  { firstName: 'Sachin', lastName: 'Goyal' },
  { firstName: 'Mohit', lastName: 'Taneja' },
  { firstName: 'Varun', lastName: 'Sabharwal' },
  { firstName: 'Ashish', lastName: 'Dhawan' },
  { firstName: 'Pankaj', lastName: 'Bhardwaj' },
  { firstName: 'Naveen', lastName: 'Chawla' },
  { firstName: 'Sumit', lastName: 'Kalra' },
  { firstName: 'Rakesh', lastName: 'Batra' },
  // Lab Technicians (15)
  { firstName: 'Sandeep', lastName: 'Kumar' },
  { firstName: 'Manoj', lastName: 'Singh' },
  { firstName: 'Ravi', lastName: 'Sharma' },
  { firstName: 'Ajay', lastName: 'Patel' },
  { firstName: 'Vinod', lastName: 'Yadav' },
  { firstName: 'Prakash', lastName: 'Reddy' },
  { firstName: 'Dinesh', lastName: 'Nair' },
  { firstName: 'Ramesh', lastName: 'Iyer' },
  { firstName: 'Mahesh', lastName: 'Desai' },
  { firstName: 'Naresh', lastName: 'Pillai' },
  { firstName: 'Sushil', lastName: 'Gupta' },
  { firstName: 'Anil', lastName: 'Verma' },
  { firstName: 'Sunil', lastName: 'Mehta' },
  { firstName: 'Mukesh', lastName: 'Shah' },
  { firstName: 'Yogesh', lastName: 'Rao' },
  // Radiologists (10)
  { firstName: 'Ashok', lastName: 'Krishnan' },
  { firstName: 'Satish', lastName: 'Joshi' },
  { firstName: 'Rajiv', lastName: 'Menon' },
  { firstName: 'Anand', lastName: 'Bhat' },
  { firstName: 'Mohan', lastName: 'Agarwal' },
  { firstName: 'Gopal', lastName: 'Malhotra' },
  { firstName: 'Krishna', lastName: 'Chopra' },
  { firstName: 'Shyam', lastName: 'Kapoor' },
  { firstName: 'Hari', lastName: 'Bansal' },
  { firstName: 'Kishore', lastName: 'Sinha' },
  // Accountants (10)
  { firstName: 'Rajat', lastName: 'Pandey' },
  { firstName: 'Nikhil', lastName: 'Kulkarni' },
  { firstName: 'Abhishek', lastName: 'Tiwari' },
  { firstName: 'Saurabh', lastName: 'Saxena' },
  { firstName: 'Akash', lastName: 'Bhatt' },
  { firstName: 'Tarun', lastName: 'Mishra' },
  { firstName: 'Kunal', lastName: 'Thakur' },
  { firstName: 'Aman', lastName: 'Shukla' },
  { firstName: 'Kartik', lastName: 'Dubey' },
  { firstName: 'Yash', lastName: 'Chaturvedi' },
];

// Patient names (90)
const patientNames = [
  { firstName: 'Aarav', lastName: 'Kumar' },
  { firstName: 'Vivaan', lastName: 'Sharma' },
  { firstName: 'Aditya', lastName: 'Patel' },
  { firstName: 'Vihaan', lastName: 'Singh' },
  { firstName: 'Arjun', lastName: 'Reddy' },
  { firstName: 'Sai', lastName: 'Iyer' },
  { firstName: 'Arnav', lastName: 'Nair' },
  { firstName: 'Ayaan', lastName: 'Desai' },
  { firstName: 'Krishna', lastName: 'Gupta' },
  { firstName: 'Ishaan', lastName: 'Verma' },
  { firstName: 'Shaurya', lastName: 'Mehta' },
  { firstName: 'Atharv', lastName: 'Shah' },
  { firstName: 'Advik', lastName: 'Rao' },
  { firstName: 'Pranav', lastName: 'Pillai' },
  { firstName: 'Reyansh', lastName: 'Joshi' },
  { firstName: 'Aadhya', lastName: 'Menon' },
  { firstName: 'Ananya', lastName: 'Bhat' },
  { firstName: 'Pari', lastName: 'Agarwal' },
  { firstName: 'Anika', lastName: 'Malhotra' },
  { firstName: 'Isha', lastName: 'Chopra' },
  { firstName: 'Diya', lastName: 'Kapoor' },
  { firstName: 'Anvi', lastName: 'Bansal' },
  { firstName: 'Sara', lastName: 'Sinha' },
  { firstName: 'Navya', lastName: 'Pandey' },
  { firstName: 'Kiara', lastName: 'Kulkarni' },
  { firstName: 'Saanvi', lastName: 'Tiwari' },
  { firstName: 'Myra', lastName: 'Saxena' },
  { firstName: 'Avni', lastName: 'Bhatt' },
  { firstName: 'Riya', lastName: 'Mishra' },
  { firstName: 'Shanaya', lastName: 'Thakur' },
  { firstName: 'Prakash', lastName: 'Das' },
  { firstName: 'Suresh', lastName: 'Roy' },
  { firstName: 'Ramesh', lastName: 'Bose' },
  { firstName: 'Mahesh', lastName: 'Sen' },
  { firstName: 'Naresh', lastName: 'Chatterjee' },
  { firstName: 'Ganesh', lastName: 'Mukherjee' },
  { firstName: 'Mukesh', lastName: 'Ghosh' },
  { firstName: 'Rajesh', lastName: 'Banerjee' },
  { firstName: 'Dinesh', lastName: 'Dutta' },
  { firstName: 'Umesh', lastName: 'Mitra' },
  { firstName: 'Kamlesh', lastName: 'Chakraborty' },
  { firstName: 'Nilesh', lastName: 'Bhattacharya' },
  { firstName: 'Jignesh', lastName: 'Majumdar' },
  { firstName: 'Hitesh', lastName: 'Sarkar' },
  { firstName: 'Ritesh', lastName: 'Dasgupta' },
  { firstName: 'Priyanka', lastName: 'Bhardwaj' },
  { firstName: 'Deepika', lastName: 'Chawla' },
  { firstName: 'Sonali', lastName: 'Kalra' },
  { firstName: 'Shilpa', lastName: 'Batra' },
  { firstName: 'Pallavi', lastName: 'Khanna' },
  { firstName: 'Komal', lastName: 'Sethi' },
  { firstName: 'Radhika', lastName: 'Arora' },
  { firstName: 'Rashmi', lastName: 'Sood' },
  { firstName: 'Sapna', lastName: 'Kohli' },
  { firstName: 'Sonia', lastName: 'Garg' },
  { firstName: 'Nisha', lastName: 'Singhal' },
  { firstName: 'Reena', lastName: 'Mittal' },
  { firstName: 'Seema', lastName: 'Jain' },
  { firstName: 'Meena', lastName: 'Aggarwal' },
  { firstName: 'Heena', lastName: 'Goyal' },
  { firstName: 'Manish', lastName: 'Tandon' },
  { firstName: 'Piyush', lastName: 'Rastogi' },
  { firstName: 'Ankit', lastName: 'Bajaj' },
  { firstName: 'Rohit', lastName: 'Suri' },
  { firstName: 'Sumit', lastName: 'Kapur' },
  { firstName: 'Amit', lastName: 'Dua' },
  { firstName: 'Lalit', lastName: 'Sachdeva' },
  { firstName: 'Ajit', lastName: 'Ahuja' },
  { firstName: 'Mohit', lastName: 'Khosla' },
  { firstName: 'Rohit', lastName: 'Bahl' },
  { firstName: 'Sanjay', lastName: 'Bakshi' },
  { firstName: 'Vijay', lastName: 'Grover' },
  { firstName: 'Manoj', lastName: 'Anand' },
  { firstName: 'Arun', lastName: 'Chadha' },
  { firstName: 'Varun', lastName: 'Dhingra' },
  { firstName: 'Tarun', lastName: 'Wadhwa' },
  { firstName: 'Karan', lastName: 'Khurana' },
  { firstName: 'Sahil', lastName: 'Talwar' },
  { firstName: 'Nikhil', lastName: 'Sawhney' },
  { firstName: 'Akhil', lastName: 'Luthra' },
  { firstName: 'Vishal', lastName: 'Sodhi' },
  { firstName: 'Gaurav', lastName: 'Chandhok' },
  { firstName: 'Saurabh', lastName: 'Thapar' },
  { firstName: 'Abhishek', lastName: 'Chugh' },
  { firstName: 'Rakesh', lastName: 'Gulati' },
  { firstName: 'Lokesh', lastName: 'Manchanda' },
  { firstName: 'Yogesh', lastName: 'Nagpal' },
  { firstName: 'Ramesh', lastName: 'Bajwa' },
  { firstName: 'Sunil', lastName: 'Bindra' },
  { firstName: 'Anil', lastName: 'Malik' },
];

function generatePhone(): string {
  return `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

function generatePincode(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

function generateLicenseNumber(): string {
  return `MCI${Math.floor(Math.random() * 900000) + 100000}`;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomCity() {
  return cities[Math.floor(Math.random() * cities.length)];
}

async function seed200Users() {
  console.log('🌱 Starting to seed 200 users...\n');

  const credentialsList: any[] = [];

  // 1. DOCTORS (30)
  console.log('👨‍⚕️ Creating 30 Doctors...');
  for (let i = 0; i < 30; i++) {
    const name = doctorNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Dr${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const specialization = specializations[i % specializations.length];
    const dob = getRandomDate(new Date(1970, 0, 1), new Date(1990, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'DOCTOR',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['MG Road', 'Park Street', 'Brigade Road', 'Anna Salai', 'Marine Drive'][i % 5]}`,
        city: location.city,
        state: location.state,
        pincode: generatePincode(),
        isActive: true,
        isEmailVerified: true,
      },
    });

    await prisma.doctor.create({
      data: {
        userId: user.id,
        doctorId: `DOC${String(i + 1).padStart(4, '0')}`,
        specialization,
        qualification: qualifications[i % qualifications.length],
        experience: Math.floor(Math.random() * 25) + 5,
        licenseNumber: generateLicenseNumber(),
        consultationFee: (Math.floor(Math.random() * 20) + 10) * 100,
        isAvailable: true,
        department: specialization,
        designation: ['Senior Consultant', 'Consultant', 'Head of Department'][i % 3],
      },
    });

    credentialsList.push({
      role: 'DOCTOR',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      specialization,
      department: specialization,
    });
  }

  // 2. NURSES (25)
  console.log('👩‍⚕️ Creating 25 Nurses...');
  for (let i = 0; i < 25; i++) {
    const name = nurseNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Nurse${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1980, 0, 1), new Date(2000, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'NURSE',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: 'FEMALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['Nehru Nagar', 'Gandhi Road', 'Ambedkar Street', 'Tilak Marg'][i % 4]}`,
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
        staffId: `NUR${String(i + 1).padStart(4, '0')}`,
        department: departments[i % 7],
        designation: ['Staff Nurse', 'Senior Nurse', 'Head Nurse'][i % 3],
        joiningDate: getRandomDate(new Date(2015, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'NURSE',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: departments[i % 7],
    });
  }

  // 3. RECEPTIONISTS (10)
  console.log('📋 Creating 10 Receptionists...');
  for (let i = 0; i < 10; i++) {
    const name = staffNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Recep${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1985, 0, 1), new Date(2003, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'RECEPTIONIST',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: 'FEMALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['Station Road', 'College Street', 'Market Area'][i % 3]}`,
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
        staffId: `REC${String(i + 1).padStart(4, '0')}`,
        department: 'Reception',
        designation: ['Receptionist', 'Senior Receptionist', 'Front Desk Manager'][i % 3],
        joiningDate: getRandomDate(new Date(2018, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'RECEPTIONIST',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: 'Reception',
    });
  }

  // 4. PHARMACISTS (10)
  console.log('💊 Creating 10 Pharmacists...');
  for (let i = 10; i < 20; i++) {
    const name = staffNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Pharma${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1980, 0, 1), new Date(1998, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'PHARMACIST',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: 'MALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['City Center', 'Commercial Complex', 'Business District'][i % 3]}`,
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
        staffId: `PHA${String(i - 9).padStart(4, '0')}`,
        department: 'Pharmacy',
        designation: ['Pharmacist', 'Senior Pharmacist', 'Chief Pharmacist'][i % 3],
        joiningDate: getRandomDate(new Date(2016, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'PHARMACIST',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: 'Pharmacy',
    });
  }

  // 5. LAB TECHNICIANS (15)
  console.log('🔬 Creating 15 Lab Technicians...');
  for (let i = 20; i < 35; i++) {
    const name = staffNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Lab${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1982, 0, 1), new Date(2000, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'LAB_TECHNICIAN',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: 'MALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['Industrial Area', 'Tech Park', 'Medical Complex'][i % 3]}`,
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
        staffId: `LAB${String(i - 19).padStart(4, '0')}`,
        department: 'Laboratory',
        designation: ['Lab Technician', 'Senior Lab Technician', 'Lab Supervisor'][i % 3],
        joiningDate: getRandomDate(new Date(2017, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'LAB_TECHNICIAN',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: 'Laboratory',
    });
  }

  // 6. RADIOLOGISTS (10)
  console.log('📸 Creating 10 Radiologists...');
  for (let i = 35; i < 45; i++) {
    const name = staffNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Radio${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1975, 0, 1), new Date(1995, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'RADIOLOGIST',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: 'MALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['Diagnostic Center', 'Imaging Wing', 'Scan Center'][i % 3]}`,
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
        staffId: `RAD${String(i - 34).padStart(4, '0')}`,
        department: 'Radiology',
        designation: ['Radiologist', 'Senior Radiologist', 'Chief Radiologist'][i % 3],
        joiningDate: getRandomDate(new Date(2014, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'RADIOLOGIST',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: 'Radiology',
    });
  }

  // 7. ACCOUNTANTS (10)
  console.log('💰 Creating 10 Accountants...');
  for (let i = 45; i < 55; i++) {
    const name = staffNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@hospital.com`;
    const password = `Acc${name.firstName}@${2026 + i}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1978, 0, 1), new Date(1998, 11, 31));

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ACCOUNTANT',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: 'MALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['Finance Wing', 'Admin Block', 'Accounts Section'][i % 3]}`,
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
        staffId: `ACC${String(i - 44).padStart(4, '0')}`,
        department: 'Accounts',
        designation: ['Accountant', 'Senior Accountant', 'Finance Manager'][i % 3],
        joiningDate: getRandomDate(new Date(2015, 0, 1), new Date(2025, 11, 31)),
      },
    });

    credentialsList.push({
      role: 'ACCOUNTANT',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      department: 'Accounts',
    });
  }

  // 8. PATIENTS (90)
  console.log('🏥 Creating 90 Patients...');
  for (let i = 0; i < 90; i++) {
    const name = patientNames[i];
    const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i + 1}@gmail.com`;
    const password = `Patient${i + 1}@2026`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const location = getRandomCity();
    const dob = getRandomDate(new Date(1940, 0, 1), new Date(2020, 11, 31));
    const bloodGroup = bloodGroups[i % bloodGroups.length];

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'PATIENT',
        firstName: name.firstName,
        lastName: name.lastName,
        phone: generatePhone(),
        dateOfBirth: dob,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        address: `${Math.floor(Math.random() * 500) + 1}, ${['Residency Road', 'Green Park', 'Lajpat Nagar', 'Koramangala', 'Banjara Hills'][i % 5]}`,
        city: location.city,
        state: location.state,
        pincode: generatePincode(),
        isActive: true,
        isEmailVerified: true,
      },
    });

    await prisma.patient.create({
      data: {
        userId: user.id,
        patientId: `PAT${String(i + 11).padStart(4, '0')}`,
        bloodGroup,
        emergencyContactName: `${name.firstName}'s Guardian`,
        emergencyContactPhone: generatePhone(),
        emergencyContactRelation: ['Father', 'Mother', 'Spouse', 'Brother', 'Sister'][i % 5],
      },
    });

    credentialsList.push({
      role: 'PATIENT',
      name: `${name.firstName} ${name.lastName}`,
      email,
      password,
      bloodGroup,
      patientId: `PAT${String(i + 11).padStart(4, '0')}`,
    });
  }

  console.log('\n✅ Successfully created all 200 users!\n');
  return credentialsList;
}

export default async function seed200UsersWrapper() {
  try {
    const credentials = await seed200Users();
    console.log('📝 Login credentials have been generated!\n');
    return credentials;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seed200UsersWrapper()
    .then((credentials) => {
      console.log('✅ Seeding completed successfully!');
      console.log(`📊 Total users created: ${credentials.length}`);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
