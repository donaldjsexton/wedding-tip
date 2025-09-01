import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weddingId, vendorId } = body;

    if (!weddingId || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields: weddingId, vendorId' },
        { status: 400 }
      );
    }

    // Check if vendor is already added to this wedding
    const existingWeddingVendor = await prisma.weddingVendor.findFirst({
      where: {
        weddingId,
        vendorId
      }
    });

    if (existingWeddingVendor) {
      return NextResponse.json(
        { error: 'Vendor is already added to this wedding' },
        { status: 400 }
      );
    }

    // Verify wedding and vendor exist
    const [wedding, vendor] = await Promise.all([
      prisma.wedding.findUnique({ where: { id: weddingId } }),
      prisma.vendor.findUnique({ where: { id: vendorId } })
    ]);

    if (!wedding) {
      return NextResponse.json(
        { error: 'Wedding not found' },
        { status: 404 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Create the wedding-vendor relationship
    const weddingVendor = await prisma.weddingVendor.create({
      data: {
        weddingId,
        vendorId
      },
      include: {
        vendor: true,
        wedding: {
          select: {
            coupleName: true,
            weddingDate: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Vendor added to wedding successfully',
      weddingVendor
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding vendor to wedding:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to add vendor to wedding',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
