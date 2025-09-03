const { PrismaClient } = require('@prisma/client');

async function migratePaymentMethods() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting payment methods migration...');
    
    // Check if migration is needed
    try {
      await prisma.$queryRaw`SELECT "preferredPayment" FROM vendors LIMIT 1`;
      console.log('✅ Found preferredPayment column - migration needed');
    } catch (error) {
      if (error.message.includes('column "preferredPayment" does not exist')) {
        console.log('✅ Migration already completed - preferredPayment column not found');
        return;
      }
      throw error;
    }

    console.log('📊 Adding new payment method columns...');
    
    // Add new columns
    await prisma.$executeRaw`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS "acceptsStripe" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "acceptsVenmo" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "acceptsCashApp" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "acceptsZelle" BOOLEAN DEFAULT false
    `;

    console.log('🔄 Migrating existing payment method data...');
    
    // Migrate data from old structure to new
    await prisma.$executeRaw`UPDATE vendors SET "acceptsStripe" = true, "acceptsVenmo" = false, "acceptsCashApp" = false, "acceptsZelle" = false WHERE "preferredPayment" = 'STRIPE'`;
    await prisma.$executeRaw`UPDATE vendors SET "acceptsStripe" = false, "acceptsVenmo" = true, "acceptsCashApp" = false, "acceptsZelle" = false WHERE "preferredPayment" = 'VENMO'`;
    await prisma.$executeRaw`UPDATE vendors SET "acceptsStripe" = false, "acceptsVenmo" = false, "acceptsCashApp" = true, "acceptsZelle" = false WHERE "preferredPayment" = 'CASHAPP'`;
    await prisma.$executeRaw`UPDATE vendors SET "acceptsStripe" = false, "acceptsVenmo" = false, "acceptsCashApp" = false, "acceptsZelle" = true WHERE "preferredPayment" = 'ZELLE'`;

    console.log('🗑️  Dropping old preferredPayment column...');
    
    // Drop the old column
    await prisma.$executeRaw`ALTER TABLE vendors DROP COLUMN "preferredPayment"`;

    console.log('🔧 Ensuring data consistency...');
    
    // Ensure no NULLs
    await prisma.$executeRaw`
      UPDATE vendors SET 
        "acceptsStripe" = COALESCE("acceptsStripe", true),
        "acceptsVenmo" = COALESCE("acceptsVenmo", false),
        "acceptsCashApp" = COALESCE("acceptsCashApp", false),
        "acceptsZelle" = COALESCE("acceptsZelle", false)
      WHERE "acceptsStripe" IS NULL OR "acceptsVenmo" IS NULL OR "acceptsCashApp" IS NULL OR "acceptsZelle" IS NULL
    `;

    console.log('✅ Payment methods migration completed successfully!');
    
    // Verify migration
    const sampleVendor = await prisma.vendor.findFirst({
      select: {
        id: true,
        name: true,
        acceptsStripe: true,
        acceptsVenmo: true,
        acceptsCashApp: true,
        acceptsZelle: true
      }
    });
    
    if (sampleVendor) {
      console.log('✅ Migration verification successful:', sampleVendor);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migratePaymentMethods();
}

module.exports = migratePaymentMethods;
