import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVendorInvitation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      vendorName, 
      role, 
      weddingId, 
      coordinatorId, 
      message 
    } = body;

    if (!email || !vendorName || !role || !weddingId || !coordinatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if vendor already exists with this email
    const existingVendor = await prisma.vendor.findUnique({
      where: { email }
    });

    if (existingVendor && existingVendor.status === 'ACTIVE') {
      // Vendor already exists and is active - just add them to the wedding
      const existingWeddingVendor = await prisma.weddingVendor.findFirst({
        where: {
          weddingId,
          vendorId: existingVendor.id
        }
      });

      if (existingWeddingVendor) {
        return NextResponse.json(
          { error: 'This vendor is already added to this wedding' },
          { status: 400 }
        );
      }

      // Add existing vendor to wedding
      const weddingVendor = await prisma.weddingVendor.create({
        data: {
          weddingId,
          vendorId: existingVendor.id
        },
        include: {
          vendor: true,
          wedding: true
        }
      });

      return NextResponse.json({
        type: 'existing_vendor_added',
        weddingVendor,
        message: 'Existing vendor added to wedding successfully'
      });
    }

    // Check if there's already a pending invitation for this email/wedding
    const existingInvitation = await prisma.vendorInvitation.findFirst({
      where: {
        email,
        weddingId,
        status: 'SENT'
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this vendor for this wedding' },
        { status: 400 }
      );
    }

    // Create new vendor invitation
    const invitation = await prisma.vendorInvitation.create({
      data: {
        email,
        vendorName,
        role,
        message,
        weddingId,
        coordinatorId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        wedding: {
          select: {
            coupleName: true,
            weddingDate: true,
            venue: true
          }
        },
        coordinator: {
          select: {
            name: true,
            company: true,
            email: true
          }
        }
      }
    });

    // Send invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/vendor/register/${invitation.token}`;

    try {
      // Send the email
      await sendVendorInvitation({
        vendorName,
        vendorEmail: email,
        coordinatorName: invitation.coordinator.name,
        coordinatorCompany: invitation.coordinator.company || undefined,
        coordinatorEmail: invitation.coordinator.email,
        weddingDetails: {
          coupleName: invitation.wedding.coupleName,
          weddingDate: invitation.wedding.weddingDate.toISOString(),
          venue: invitation.wedding.venue || undefined
        },
        role,
        invitationUrl,
        message
      });

      console.log(`Vendor invitation email sent successfully to ${email}`);

      return NextResponse.json({
        type: 'invitation_sent',
        invitation,
        invitationUrl,
        message: 'Vendor invitation sent successfully'
      }, { status: 201 });

    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      
      // Email failed, but invitation was created in database
      // Return success but with email warning
      return NextResponse.json({
        type: 'invitation_created_email_failed',
        invitation,
        invitationUrl,
        message: 'Vendor invitation created but email delivery failed. Please send the registration link manually.',
        warning: 'Email delivery failed - check RESEND_API_KEY environment variable'
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating vendor invitation:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create vendor invitation',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET - List pending invitations for a coordinator
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

    const invitations = await prisma.vendorInvitation.findMany({
      where: {
        coordinatorId,
        status: {
          in: ['SENT', 'ACCEPTED']
        }
      },
      include: {
        wedding: {
          select: {
            coupleName: true,
            weddingDate: true
          }
        },
        vendor: {
          select: {
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching vendor invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
