# Wedding Tipping App 💍

A Next.js application that simplifies wedding vendor tipping for couples and coordinators.

## Features

### For Wedding Coordinators 👩‍💼
- **Dashboard**: Manage multiple weddings and vendor setups
- **Wedding Creation**: Set up couples with personalized vendor lists
- **Tip Customization**: Configure custom tip amounts and payment methods
- **Vendor Management**: Add vendors with payment preferences (Stripe, Venmo, CashApp)

### For Couples 💑
- **Personalized Experience**: Access via unique wedding code/slug
- **Smart Recommendations**: AI-powered tip suggestions based on service type and hours
- **Multiple Payment Options**: 
  - Credit/Debit Cards (Stripe)
  - Venmo (@username)
  - CashApp ($username)
- **Progress Tracking**: Visual progress as you tip each vendor
- **Educational Tips**: Learning tipping etiquette throughout the process

### Vendor Types (MVP)
- 👨‍💼 **Officiant**: Religious/civil ceremony leaders
- 📋 **Coordinator**: Wedding day coordinators and planners  
- 🔧 **Setup Attendant**: Setup and breakdown crew
- 📸 **Photographer**: Photography and videography services

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma with SQLite (dev) / PostgreSQL (prod)
- **Payments**: Stripe API integration
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Getting Started

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   cd wedding-tip-app
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Add your database URL and Stripe keys
   ```

3. **Initialize database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Visit the app**:
   - Main app: http://localhost:3000
   - Coordinator dashboard: http://localhost:3000/coordinator  
   - Sample couple experience: http://localhost:3000/couple/sample-wedding-abc123

## Usage Flow

### For Coordinators:
1. Access coordinator dashboard
2. Create new wedding with couple details
3. Add vendors with roles and payment preferences
4. Set custom tip amounts or use automatic calculations
5. Share unique wedding code with couple

### For Couples:
1. Receive wedding code from coordinator
2. Access personalized tipping interface
3. Review vendor list and tip recommendations
4. Pay tips via preferred payment methods
5. Track progress as vendors are tipped

## Payment Integration

The app supports three payment methods:

- **Stripe**: Full credit/debit card processing with secure tokenization
- **Venmo**: Direct links to vendor Venmo handles  
- **CashApp**: Direct links to vendor CashApp handles

## Database Schema

- **Coordinators**: Wedding professional accounts
- **Weddings**: Individual wedding events with unique slugs
- **Vendors**: Service providers with payment preferences
- **WeddingVendors**: Junction table linking vendors to specific weddings
- **Tips**: Transaction records with payment status tracking

## Deployment

Ready for Vercel deployment:

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## Environment Variables

```bash
# Database
DATABASE_URL="your-database-url"

# Stripe (for credit card processing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Future Enhancements

- Multi-coordinator accounts with authentication
- Additional vendor types (DJ, caterer, venue staff, etc.)
- Expense reporting and analytics
- Email notifications and receipts
- Mobile app versions
- Integration with popular wedding planning platforms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for your wedding business! 💝