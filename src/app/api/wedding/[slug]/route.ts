import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const wedding = await prisma.wedding.findUnique({
      where: { slug },
      include: {
        coordinator: true,
        vendors: {
          include: {
            vendor: true
          }
        },
        tips: {
          include: {
            vendor: true,
            weddingVendor: true
          }
        }
      }
    });

    if (!wedding) {
      const errorResponse = NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      );
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return errorResponse;
    }

    // Transform the data to match the expected format for the couple page
    const transformedWedding = {
      id: wedding.id,
      slug: wedding.slug,
      coupleName: wedding.coupleName,
      weddingDate: wedding.weddingDate.toISOString(),
      venue: wedding.venue,
      vendors: wedding.vendors.map(wv => ({
        id: wv.vendor.id,
        name: wv.vendor.name,
        role: wv.vendor.role,
        email: wv.vendor.email,
        phone: wv.vendor.phone,
        preferredPayment: determinePreferredPayment(wv.vendor),
        venmoHandle: wv.vendor.venmoHandle,
        cashAppHandle: wv.vendor.cashAppHandle,
        serviceHours: wv.serviceHours,
        serviceRate: wv.serviceRate,
        customTipAmount: wv.customTipAmount,
      }))
    };

    const response = NextResponse.json(transformedWedding);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error fetching wedding by slug:', error);
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch wedding',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
      },
      { status: 500 }
    );
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return errorResponse;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to determine preferred payment method based on vendor's enabled methods
function determinePreferredPayment(vendor: {
  acceptsStripe: boolean;
  stripeAccountId: string | null;
  acceptsVenmo: boolean;
  venmoHandle: string | null;
  acceptsCashApp: boolean;
  cashAppHandle: string | null;
  acceptsZelle: boolean;
  zelleContact: string | null;
}): string {
  // Priority order: STRIPE (most common), VENMO, CASHAPP, ZELLE
  if (vendor.acceptsStripe && vendor.stripeAccountId) return 'STRIPE';
  if (vendor.acceptsVenmo && vendor.venmoHandle) return 'VENMO';
  if (vendor.acceptsCashApp && vendor.cashAppHandle) return 'CASHAPP';
  if (vendor.acceptsZelle && vendor.zelleContact) return 'ZELLE';
  
  // Fallback to STRIPE as default
  return 'STRIPE';
}
