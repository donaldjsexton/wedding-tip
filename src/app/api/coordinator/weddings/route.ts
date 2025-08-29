import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // For MVP, we'll use a simple approach without authentication
    // In production, you'd want to authenticate the coordinator first
    
    const weddings = await prisma.wedding.findMany({
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
    const { coupleName, weddingDate, venue, notes, coordinatorEmail } = body;

    if (!coupleName || !weddingDate || !coordinatorEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create wedding
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
        }
      }
    });

    return NextResponse.json(wedding, { status: 201 });
  } catch (error) {
    console.error('Error creating wedding:', error);
    return NextResponse.json(
      { error: 'Failed to create wedding' },
      { status: 500 }
    );
  }
}
