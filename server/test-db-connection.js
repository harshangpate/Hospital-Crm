const { Client } = require('pg');

// Test different password possibilities
const passwords = ['harsh', 'Harsh', 'HARSH', 'harsh123', 'admin', 'root'];
const username = 'postgres';
const database = 'hospital_crm';

async function testConnection(password) {
  const client = new Client({
    user: username,
    host: 'localhost',
    database: 'postgres', // Connect to default postgres DB first
    password: password,
    port: 5432,
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS with password: "${password}"`);
    
    // Check if hospital_crm database exists
    const result = await client.query("SELECT datname FROM pg_database WHERE datname='hospital_crm'");
    if (result.rows.length > 0) {
      console.log('✅ hospital_crm database exists');
    } else {
      console.log('⚠️  hospital_crm database NOT found - will create it');
      await client.query('CREATE DATABASE hospital_crm');
      console.log('✅ Created hospital_crm database');
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with password: "${password}" - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing PostgreSQL connection...\n');
  
  for (const password of passwords) {
    const success = await testConnection(password);
    if (success) {
      console.log(`\n✅ Use this in your .env file:`);
      console.log(`DATABASE_URL="postgresql://${username}:${password}@localhost:5432/${database}"`);
      process.exit(0);
    }
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('Please check:');
  console.log('1. PostgreSQL service is running');
  console.log('2. Your actual PostgreSQL password');
  console.log('3. Username might be different from "postgres"');
}

main();
