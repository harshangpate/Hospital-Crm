import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

// Use singleton Prisma client to avoid multiple connections
const prisma = new PrismaClient();

// Run daily at midnight (00:01 AM) to add bed charges for all active admissions
export const startDailyBedChargesCron = () => {
  // Schedule: "1 0 * * *" = Every day at 00:01 AM (1 minute past midnight)
  cron.schedule('1 0 * * *', async () => {
    console.log('🏥 Running daily bed charges cron job...');
    
    try {
      // Find all active admissions (ADMITTED or UNDER_TREATMENT)
      const activeAdmissions = await prisma.admission.findMany({
        where: {
          status: {
            in: ['ADMITTED', 'UNDER_TREATMENT']
          }
        },
        include: {
          bed: {
            include: {
              ward: true
            }
          },
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      });

      console.log(`💰 Found ${activeAdmissions.length} active admissions to charge`);

      let totalChargesAdded = 0;
      let totalInvoicesUpdated = 0;

      // Process each admission
      for (const admission of activeAdmissions) {
        try {
          // Skip if no bed assigned
          if (!admission.bed) {
            console.log(`⏭️  Skipping ${admission.admissionNumber} - No bed assigned`);
            continue;
          }

          // Calculate days since admission
          const admissionDate = new Date(admission.admissionDate);
          const today = new Date();
          const daysSinceAdmission = Math.floor(
            (today.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Skip if admitted today (Day 1 charges already added during admission)
          if (daysSinceAdmission === 0) {
            console.log(`⏭️  Skipping ${admission.admissionNumber} - Admitted today`);
            continue;
          }

          // Find the invoice for this admission
          const invoice = await prisma.invoice.findFirst({
            where: {
              invoiceNumber: {
                contains: admission.admissionNumber
              }
            },
            include: {
              invoiceItems: true
            }
          });

          if (!invoice) {
            console.log(`⚠️  No invoice found for admission ${admission.admissionNumber}`);
            continue;
          }

          // Check if charge for this day already exists
          const dayLabel = `Day ${daysSinceAdmission + 1}`;
          const existingDayCharge = invoice.invoiceItems.find(
            item => item.itemType === 'BED_CHARGES' && item.itemName.includes(dayLabel)
          );

          if (existingDayCharge) {
            console.log(`✓ Charge already exists for ${admission.admissionNumber} - ${dayLabel}`);
            continue;
          }

          // Add today's bed charge in a transaction
          await prisma.$transaction(async (tx) => {
            // TypeScript: admission.bed is guaranteed to exist here due to the check above
            const bed = admission.bed!;
            const bedCharges = bed.ward.chargesPerDay;
            const wardName = bed.ward.wardName;
            const bedNumber = bed.bedNumber;

            // Add new invoice item for today's charge
            await tx.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                itemName: `${dayLabel} - ${wardName} (${bedNumber})`,
                description: `Bed charges for ${dayLabel}`,
                itemType: 'BED_CHARGES',
                quantity: 1,
                unitPrice: bedCharges,
                totalPrice: bedCharges,
              }
            });

            // Calculate new totals
            const newSubtotal = invoice.subtotal + bedCharges;
            const newTax = newSubtotal * 0.05; // 5% tax
            const newTotal = newSubtotal + newTax;
            const newBalance = newTotal - invoice.paidAmount;

            // Update invoice totals
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                subtotal: newSubtotal,
                tax: newTax,
                totalAmount: newTotal,
                balanceAmount: newBalance,
                paymentStatus: newBalance > 0 
                  ? (invoice.paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING')
                  : 'PAID'
              }
            });
          });

          totalChargesAdded++;
          totalInvoicesUpdated++;
          
          const patientName = `${admission.patient.user.firstName} ${admission.patient.user.lastName}`;
          const bed = admission.bed!;
          console.log(
            `✅ Added ${dayLabel} charge (₹${bed.ward.chargesPerDay}) for ${patientName} (${admission.admissionNumber})`
          );
        } catch (error) {
          console.error(`❌ Failed to add charges for admission ${admission.admissionNumber}:`, error);
        }
      }

      console.log('');
      console.log('📊 Daily Bed Charges Summary:');
      console.log(`   Total Active Admissions: ${activeAdmissions.length}`);
      console.log(`   Charges Added: ${totalChargesAdded}`);
      console.log(`   Invoices Updated: ${totalInvoicesUpdated}`);
      console.log('✅ Daily bed charges cron job completed');
      console.log('');
    } catch (error) {
      console.error('❌ Error in daily bed charges cron job:', error);
    }
  });

  console.log('✅ Daily bed charges cron job scheduled (runs at 00:01 AM every day)');
};
