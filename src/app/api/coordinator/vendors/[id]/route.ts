import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/coordinator/vendors/[id] - Get a specific vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        weddingVendors: {
          include: {
            wedding: {
              select: {
                id: true,
                coupleName: true,
                weddingDate: true,
                coordinatorId: true,
                coordinator: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tips: {
          where: {
            paymentStatus: 'COMPLETED'
          },
          include: {
            wedding: {
              select: {
                coupleName: true
              }
            }
          }
        },
        _count: {
          select: {
            weddingVendors: true,
            tips: {
              where: {
                paymentStatus: 'COMPLETED'
              }
            }
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      ...vendor,
      totalWeddings: vendor._count.weddingVendors,
      completedTips: vendor._count.tips,
      totalTipsAmount: vendor.tips.reduce((sum, tip) => sum + tip.amount, 0)
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// PUT /api/coordinator/vendors/[id] - Update a vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      role,
      bio,
      website,
      serviceArea,
      preferredPayment,
      venmoHandle,
      cashAppHandle,
      zelleContact,
      status
    } = body;

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== existingVendor.email) {
      const emailExists = await prisma.vendor.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'A vendor with this email already exists' },
          { status: 400 }
        );
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role && { role }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(website !== undefined && { website: website || null }),
        ...(serviceArea !== undefined && { serviceArea: serviceArea || null }),
        ...(preferredPayment && { preferredPayment }),
        ...(venmoHandle !== undefined && { venmoHandle: venmoHandle || null }),
        ...(cashAppHandle !== undefined && { cashAppHandle: cashAppHandle || null }),
        ...(zelleContact !== undefined && { zelleContact: zelleContact || null }),
        ...(status && { status })
      },
      include: {
        _count: {
          select: {
            weddingVendors: true,
            tips: {
              where: {
                paymentStatus: 'COMPLETED'
              }
            }
          }
        }
      }
    });

    const response = NextResponse.json({
      vendor: {
        ...updatedVendor,
        totalWeddings: updatedVendor._count.weddingVendors,
        completedTips: updatedVendor._count.tips
      }
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Error updating vendor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to update vendor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );

    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return errorResponse;
  }
}

// DELETE /api/coordinator/vendors/[id] - Delete a vendor (soft delete by changing status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        weddingVendors: true,
        tips: true
      }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // If vendor has active weddings or tips, soft delete (suspend)
    if (vendor.weddingVendors.length > 0 || vendor.tips.length > 0) {
      await prisma.vendor.update({
        where: { id },
        data: {
          status: 'SUSPENDED'
        }
      });

      const response = NextResponse.json({
        message: 'Vendor suspended (has wedding history)',
        action: 'suspended'
      });

      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;
    }

    // If no history, hard delete
    await prisma.vendor.delete({
      where: { id }
    });

    const response = NextResponse.json({
      message: 'Vendor deleted successfully',
      action: 'deleted'
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Error deleting vendor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to delete vendor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );

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
