# 🚀 Production Deployment Guide

## Database Setup for Vercel

**⚠️ IMPORTANT**: SQLite doesn't work on Vercel! You need PostgreSQL for production.

### Option 1: Neon PostgreSQL (Recommended - Free Tier)

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for free account
   - Create a new project

2. **Get Connection String**
   - Copy the connection string (looks like: `postgresql://user:pass@host/db?sslmode=require`)

3. **Update Vercel Environment Variables**
   - Go to your Vercel project settings
   - Add environment variable:
     ```
     DATABASE_URL=postgresql://your-connection-string-here
     ```

### Option 2: Supabase PostgreSQL

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Create new project

2. **Get Database URL**
   - Go to Settings > Database
   - Copy the connection string

3. **Add to Vercel**
   - Set `DATABASE_URL` in Vercel environment variables

### Option 3: Vercel Postgres

1. **Add Vercel Postgres**
   - In your Vercel dashboard
   - Go to Storage tab
   - Create new Postgres database

2. **Connection String**
   - Vercel will automatically set the `DATABASE_URL` environment variable

## Database Migration

After setting up PostgreSQL, run database migration:

```bash
# In your local project
npm run build  # This runs prisma generate
npx prisma db push  # Creates tables in production database
```

Or trigger a new deployment - Vercel will run the migration automatically.

## Troubleshooting

### Check Database Health
Visit: `https://your-app.vercel.app/api/health/db`

This endpoint will tell you:
- ✅ Database connection status
- ✅ Whether DATABASE_URL is set
- ✅ Basic query test results

### Common Issues

1. **500 Error on Auth**
   - Usually means database connection failed
   - Check DATABASE_URL is set correctly
   - Verify PostgreSQL is accessible

2. **"connect ECONNREFUSED"**
   - Database server is not accessible
   - Check connection string format
   - Verify database is running

3. **"relation does not exist"**
   - Tables haven't been created
   - Run `npx prisma db push` to create tables

### Environment Variables Needed

```bash
# Required for production
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Optional - for Stripe payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
```

## Testing Production Setup

1. **Database Health**: `/api/health/db`
2. **Auth Test**: Try logging in with demo account
3. **Wedding Creation**: Test coordinator functionality

## Support

If you continue having issues:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Test database connection string locally
4. Ensure database allows connections from Vercel IPs
