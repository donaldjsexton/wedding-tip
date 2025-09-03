-- Migration: Add multiple payment methods support
-- This replaces the single preferredPayment field with multiple boolean fields

-- Add new payment method fields
ALTER TABLE vendors 
ADD COLUMN "acceptsStripe" BOOLEAN DEFAULT true,
ADD COLUMN "acceptsVenmo" BOOLEAN DEFAULT false,
ADD COLUMN "acceptsCashApp" BOOLEAN DEFAULT false,
ADD COLUMN "acceptsZelle" BOOLEAN DEFAULT false;

-- Migrate existing data from preferredPayment to new fields
UPDATE vendors SET "acceptsStripe" = true WHERE "preferredPayment" = 'STRIPE';
UPDATE vendors SET "acceptsVenmo" = true, "acceptsStripe" = false WHERE "preferredPayment" = 'VENMO';
UPDATE vendors SET "acceptsCashApp" = true, "acceptsStripe" = false WHERE "preferredPayment" = 'CASHAPP';  
UPDATE vendors SET "acceptsZelle" = true, "acceptsStripe" = false WHERE "preferredPayment" = 'ZELLE';

-- Drop the old preferredPayment column
ALTER TABLE vendors DROP COLUMN "preferredPayment";

-- Update any existing NULL values to have Stripe enabled by default
UPDATE vendors SET "acceptsStripe" = true WHERE "acceptsStripe" IS NULL;
UPDATE vendors SET "acceptsVenmo" = false WHERE "acceptsVenmo" IS NULL;
UPDATE vendors SET "acceptsCashApp" = false WHERE "acceptsCashApp" IS NULL;
UPDATE vendors SET "acceptsZelle" = false WHERE "acceptsZelle" IS NULL;
