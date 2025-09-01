import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For MVP, we'll have a simple demo account and auto-create coordinators
    // In production, you'd have proper password hashing and verification
    
    // Demo account for testing
    if (email === 'demo@weddingcoordinator.com' && password === 'demo123') {
      let coordinator = await prisma.coordinator.findUnique({
        where: { email }
      });

      if (!coordinator) {
        coordinator = await prisma.coordinator.create({
          data: {
            email,
            name: 'Demo Coordinator',
            company: 'Demo Wedding Company'
          }
        });
      }

      return NextResponse.json({
        coordinator: {
          id: coordinator.id,
          email: coordinator.email,
          name: coordinator.name,
          company: coordinator.company
        }
      });
    }

    // For MVP, auto-create coordinator accounts with email as password
    // This is NOT secure and should be replaced with proper auth in production
    const simplePassword = email.split('@')[0]; // Use email prefix as password
    
    if (password === simplePassword) {
      let coordinator = await prisma.coordinator.findUnique({
        where: { email }
      });

      if (!coordinator) {
        coordinator = await prisma.coordinator.create({
          data: {
            email,
            name: email.split('@')[0].replace(/[._-]/g, ' '), // Convert email to name
            company: email.split('@')[1] // Use domain as company
          }
        });
      }

      return NextResponse.json({
        coordinator: {
          id: coordinator.id,
          email: coordinator.email,
          name: coordinator.name,
          company: coordinator.company
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    
    // More detailed error logging for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
