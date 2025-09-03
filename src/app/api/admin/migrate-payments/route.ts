import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Basic security check - only allow in development or with admin key
    const adminKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_MIGRATION_KEY || 'dev-migration-key';
    
    if (adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting payment methods migration...');
    
    // Check if migration is needed
    let needsMigration = false;
    try {
      await prisma.$queryRaw`SELECT "preferredPayment" FROM vendors LIMIT 1`;
      needsMigration = true;
      console.log('✅ Found preferredPayment column - migration needed');
    } catch (error: any) {
      if (error.message.includes('column') && error.message.includes('preferredPayment') && error.message.includes('does not exist')) {
        console.log('✅ Migration already completed - preferredPayment column not found');
        return NextResponse.json({ 
          success: true, 
          message: 'Migration already completed',
          alreadyMigrated: true 
        });
      }
      throw error;
    }

    if (!needsMigration) {
      return NextResponse.json({ 
        success: true, 
        message: 'No migration needed',
        alreadyMigrated: true 
      });
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment methods migration completed successfully',
      migrated: true,
      sampleVendor: sampleVendor
    });

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    // Check if old column still exists
    let hasPrefPayment = false;
    try {
      await prisma.$queryRaw`SELECT "preferredPayment" FROM vendors LIMIT 1`;
      hasPrefPayment = true;
    } catch (error: any) {
      if (error.message.includes('column') && error.message.includes('preferredPayment') && error.message.includes('does not exist')) {
        hasPrefPayment = false;
      } else {
        throw error;
      }
    }

    // Check if new columns exist
    let hasNewColumns = false;
    try {
      await prisma.$queryRaw`SELECT "acceptsStripe", "acceptsVenmo", "acceptsCashApp", "acceptsZelle" FROM vendors LIMIT 1`;
      hasNewColumns = true;
    } catch (error) {
      hasNewColumns = false;
    }

    return NextResponse.json({
      needsMigration: hasPrefPayment,
      hasOldSchema: hasPrefPayment,
      hasNewSchema: hasNewColumns,
      migrationComplete: !hasPrefPayment && hasNewColumns
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to check migration status', 
      details: error.message 
    }, { status: 500 });
  }
}
