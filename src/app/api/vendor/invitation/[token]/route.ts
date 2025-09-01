import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const invitation = await prisma.vendorInvitation.findUnique({
      where: { token },
      include: {
        wedding: {
          select: {
            id: true,
            coupleName: true,
            weddingDate: true,
            venue: true
          }
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error fetching vendor invitation:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch invitation',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
