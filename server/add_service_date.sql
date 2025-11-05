-- Add serviceDate column to invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS "serviceDate" TIMESTAMP(3);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "invoice_items_serviceDate_idx" ON invoice_items("serviceDate");
