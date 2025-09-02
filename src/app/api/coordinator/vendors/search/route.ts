import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const role = searchParams.get('role');
    const coordinatorId = searchParams.get('coordinatorId');

    if (!coordinatorId) {
      return NextResponse.json(
        { error: 'Coordinator ID is required' },
        { status: 400 }
      );
    }

    // Build where clause for search
    const whereClause: any = {
      status: 'ACTIVE',
      isProfileComplete: true,
    };

    // Add search query filter
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { serviceArea: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Add role filter
    if (role && role !== 'ALL') {
      whereClause.role = role as 'OFFICIANT' | 'COORDINATOR' | 'SETUP_ATTENDANT' | 'PHOTOGRAPHER';
    }

    const vendors = await prisma.vendor.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        bio: true,
        website: true,
        serviceArea: true,
        preferredPayment: true,
        venmoHandle: true,
        cashAppHandle: true,
        zelleContact: true,
        // Count how many weddings they've worked
        _count: {
          select: {
            weddingVendors: true
          }
        }
      },
      orderBy: [
        { _relevance: query ? { fields: ['name'], search: query, sort: 'desc' } : undefined },
        { name: 'asc' }
      ].filter(Boolean),
      take: 50 // Limit results
    });

    // For each vendor, check if they're already added to any of coordinator's weddings
    const vendorsWithStats = await Promise.all(vendors.map(async (vendor) => {
      const coordinatorWeddings = await prisma.weddingVendor.count({
        where: {
          vendorId: vendor.id,
          wedding: {
            coordinatorId
          }
        }
      });

      return {
        ...vendor,
        weddingsWorked: vendor._count.weddingVendors,
        weddingsWithCoordinator: coordinatorWeddings
      };
    }));

    return NextResponse.json({
      vendors: vendorsWithStats,
      total: vendorsWithStats.length,
      query
    });

  } catch (error) {
    console.error('Error searching vendors:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to search vendors',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
