-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "appointmentType" TEXT NOT NULL DEFAULT 'CONSULTATION',
ADD COLUMN     "doctorNotes" TEXT,
ADD COLUMN     "rescheduledReason" TEXT;
