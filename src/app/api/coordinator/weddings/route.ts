import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coordinatorId = searchParams.get('coordinatorId');

    // Build the where clause based on coordinator ID
    const whereClause = coordinatorId ? { coordinatorId } : {};
    
    const weddings = await prisma.wedding.findMany({
      where: whereClause,
      include: {
        coordinator: true,
        vendors: {
          include: {
            vendor: true
          }
        },
        tips: {
          include: {
            vendor: true
          }
        }
      },
      orderBy: {
        weddingDate: 'desc'
      }
    });

    return NextResponse.json(weddings);
  } catch (error) {
    console.error('Error fetching weddings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weddings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coupleName, weddingDate, venue, notes, coordinatorEmail, vendors = [] } = body;

    if (!coupleName || !weddingDate || !coordinatorEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: coupleName, weddingDate, coordinatorEmail' },
        { status: 400 }
      );
    }

    // Validate vendors
    if (vendors.length === 0) {
      return NextResponse.json(
        { error: 'At least one vendor is required' },
        { status: 400 }
      );
    }

    // Find or create coordinator
    let coordinator = await prisma.coordinator.findUnique({
      where: { email: coordinatorEmail }
    });

    if (!coordinator) {
      coordinator = await prisma.coordinator.create({
        data: {
          email: coordinatorEmail,
          name: coordinatorEmail.split('@')[0], // Default name from email
        }
      });
    }

    // Generate unique slug
    const generateSlug = (name: string) => {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      return `${baseSlug}-${randomSuffix}`;
    };

    const slug = generateSlug(coupleName);

    // Use a transaction to create wedding and vendors atomically
    const wedding = await prisma.$transaction(async (prisma) => {
      // Create the wedding
      const newWedding = await prisma.wedding.create({
        data: {
          slug,
          coupleName,
          weddingDate: new Date(weddingDate),
          venue,
          notes,
          coordinatorId: coordinator.id,
        }
      });

      // Create vendors and link them to the wedding
      const vendorPromises = vendors.map(async (vendorData: {
        name: string;
        role: string;
        email?: string;
        phone?: string;
        preferredPayment: string;
        venmoHandle?: string;
        cashAppHandle?: string;
        serviceHours?: number;
        serviceRate?: number;
        customTipAmount?: number;
        notes?: string;
      }) => {
        // First, find or create the vendor
        let vendor = await prisma.vendor.findFirst({
          where: {
            email: vendorData.email,
            role: vendorData.role as 'OFFICIANT' | 'COORDINATOR' | 'SETUP_ATTENDANT' | 'PHOTOGRAPHER'
          }
        });

        if (!vendor) {
          vendor = await prisma.vendor.create({
            data: {
              name: vendorData.name,
              email: vendorData.email,
              phone: vendorData.phone,
              role: vendorData.role as 'OFFICIANT' | 'COORDINATOR' | 'SETUP_ATTENDANT' | 'PHOTOGRAPHER',
              preferredPayment: vendorData.preferredPayment as 'STRIPE' | 'VENMO' | 'CASHAPP',
              venmoHandle: vendorData.venmoHandle,
              cashAppHandle: vendorData.cashAppHandle,
            }
          });
        }

        // Create the wedding-vendor relationship
        return prisma.weddingVendor.create({
          data: {
            weddingId: newWedding.id,
            vendorId: vendor.id,
            serviceHours: vendorData.serviceHours,
            serviceRate: vendorData.serviceRate,
            customTipAmount: vendorData.customTipAmount,
            notes: vendorData.notes,
          },
          include: {
            vendor: true
          }
        });
      });

      await Promise.all(vendorPromises);

      // Return the wedding with all relations
      return prisma.wedding.findUnique({
        where: { id: newWedding.id },
        include: {
          coordinator: true,
          vendors: {
            include: {
              vendor: true
            }
          },
          tips: {
            include: {
              vendor: true
            }
          }
        }
      });
    });

    return NextResponse.json(wedding, { status: 201 });
  } catch (error) {
    console.error('Error creating wedding:', error);
    
    // More detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
