import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/coordinator/vendors - List all vendors for a coordinator
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coordinatorId = searchParams.get('coordinatorId');

    if (!coordinatorId) {
      return NextResponse.json(
        { error: 'Coordinator ID is required' },
        { status: 400 }
      );
    }

    // Get vendors that this coordinator has worked with
    const vendors = await prisma.vendor.findMany({
      where: {
        weddingVendors: {
          some: {
            wedding: {
              coordinatorId: coordinatorId
            }
          }
        }
      },
      include: {
        weddingVendors: {
          include: {
            wedding: {
              select: {
                id: true,
                coupleName: true,
                weddingDate: true,
                coordinatorId: true
              }
            }
          }
        },
        _count: {
          select: {
            weddingVendors: true,
            tips: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Transform data to include statistics
    const vendorsWithStats = vendors.map(vendor => ({
      ...vendor,
      totalWeddings: vendor._count.weddingVendors,
      completedTips: vendor._count.tips,
      weddingsWithCoordinator: vendor.weddingVendors.filter(
        wv => wv.wedding.coordinatorId === coordinatorId
      ).length,
      recentWeddings: vendor.weddingVendors
        .filter(wv => wv.wedding.coordinatorId === coordinatorId)
        .slice(0, 3)
        .map(wv => wv.wedding)
    }));

    return NextResponse.json({ vendors: vendorsWithStats });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/coordinator/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      role,
      website,
      serviceArea,
      preferredPayment,
      venmoHandle,
      cashAppHandle,
      zelleContact,
      coordinatorId
    } = body;

    if (!name || !role || !coordinatorId) {
      return NextResponse.json(
        { error: 'Name, role, and coordinator ID are required' },
        { status: 400 }
      );
    }

    // Check if vendor with this email already exists
    if (email) {
      const existingVendor = await prisma.vendor.findFirst({
        where: { email: email }
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: 'A vendor with this email already exists' },
          { status: 400 }
        );
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        role,
        website: website || null,
        serviceArea: serviceArea || null,
        preferredPayment: preferredPayment || 'STRIPE',
        venmoHandle: venmoHandle || null,
        cashAppHandle: cashAppHandle || null,
        zelleContact: zelleContact || null,
        isProfileComplete: true,
        registeredAt: new Date()
      },
      include: {
        _count: {
          select: {
            weddingVendors: true,
            tips: true
          }
        }
      }
    });

    return NextResponse.json({
      vendor: {
        ...vendor,
        totalWeddings: vendor._count.weddingVendors,
        completedTips: vendor._count.tips,
        weddingsWithCoordinator: 0,
        recentWeddings: []
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to create vendor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
