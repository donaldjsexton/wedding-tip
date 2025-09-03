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
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      resendApiKey: process.env.RESEND_API_KEY ? (process.env.RESEND_API_KEY === 'dummy-key-for-build' ? 'Dummy key' : 'Set') : 'Not set',
      environment: process.env.NODE_ENV || 'unknown'
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
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        resendApiKey: process.env.RESEND_API_KEY ? (process.env.RESEND_API_KEY === 'dummy-key-for-build' ? 'Dummy key' : 'Set') : 'Not set',
        environment: process.env.NODE_ENV || 'unknown'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
