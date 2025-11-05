-- Hospital CRM Database Setup Script
-- Run this in PostgreSQL to create the database

-- Create database
CREATE DATABASE hospital_crm;

-- Connect to database
\c hospital_crm;

-- Create extension for UUID generation (optional, Prisma handles this)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Database is ready for Prisma migrations
