import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Try a simple query
    const coordinatorCount = await prisma.coordinator.count();
    
    return NextResponse.json({
      status: 'connected',
      message: 'Database connection successful',
      coordinatorCount,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
