import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Wedding ID is required' },
        { status: 400 }
      );
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
                preferredPayment: true,
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
      return NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(wedding);
  } catch (error) {
    console.error('Error fetching wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Wedding ID is required' },
        { status: 400 }
      );
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
                preferredPayment: true,
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

    return NextResponse.json(updatedWedding);
  } catch (error) {
    console.error('Error updating wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to update wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Wedding ID is required' },
        { status: 400 }
      );
    }

    // Delete wedding (cascade will handle related records)
    await prisma.wedding.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Wedding deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
