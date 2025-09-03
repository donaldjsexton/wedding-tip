import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const errorResponse = NextResponse.json(
        { error: 'Wedding ID is required' },
        { status: 400 }
      );
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    const wedding = await prisma.wedding.findUnique({
      where: { id },
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        },
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                acceptsStripe: true,
                acceptsVenmo: true,
                acceptsCashApp: true,
                acceptsZelle: true,
                venmoHandle: true,
                cashAppHandle: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        tips: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    const response = NextResponse.json(wedding);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error fetching wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return errorResponse;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      const errorResponse = NextResponse.json(
        { error: 'Wedding ID is required' },
        { status: 400 }
      );
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    const { coupleName, weddingDate, venue, notes } = body;

    // Update wedding details
    const updatedWedding = await prisma.wedding.update({
      where: { id },
      data: {
        ...(coupleName && { coupleName }),
        ...(weddingDate && { weddingDate: new Date(weddingDate) }),
        ...(venue !== undefined && { venue }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        },
        vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                acceptsStripe: true,
                acceptsVenmo: true,
                acceptsCashApp: true,
                acceptsZelle: true,
                venmoHandle: true,
                cashAppHandle: true
              }
            }
          }
        },
        tips: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    const response = NextResponse.json(updatedWedding);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error updating wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to update wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return errorResponse;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      const errorResponse = NextResponse.json(
        { error: 'Wedding ID is required' },
        { status: 400 }
      );
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return errorResponse;
    }

    // Delete wedding (cascade will handle related records)
    await prisma.wedding.delete({
      where: { id }
    });

    const response = NextResponse.json(
      { message: 'Wedding deleted successfully' },
      { status: 200 }
    );
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error deleting wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to delete wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
    // Add CORS headers
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
