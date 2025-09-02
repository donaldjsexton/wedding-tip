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

    const response = NextResponse.json(weddings);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error fetching weddings:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch weddings' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coupleName, weddingDate, venue, notes, coordinatorEmail } = body;

    if (!coupleName || !weddingDate || !coordinatorEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: coupleName, weddingDate, coordinatorEmail' },
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

    // Create the wedding (simplified - no vendors)
    const wedding = await prisma.wedding.create({
      data: {
        slug,
        coupleName,
        weddingDate: new Date(weddingDate),
        venue,
        notes,
        coordinatorId: coordinator.id,
      },
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

    const response = NextResponse.json(wedding, { status: 201 });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error creating wedding:', error);
    
    // More detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to create wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
