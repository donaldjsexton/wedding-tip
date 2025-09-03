import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invitationToken,
      name,
      email,
      phone,
      bio,
      website,
      serviceArea,
      acceptsStripe,
      acceptsVenmo,
      acceptsCashApp,
      acceptsZelle,
      stripeAccountId,
      venmoHandle,
      cashAppHandle,
      zelleContact
    } = body;

    if (!invitationToken || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that at least one payment method is enabled
    const hasPaymentMethod = acceptsStripe || acceptsVenmo || acceptsCashApp || acceptsZelle;
    if (!hasPaymentMethod) {
      return NextResponse.json(
        { error: 'At least one payment method must be enabled' },
        { status: 400 }
      );
    }

    // Validate payment method specific fields
    if (acceptsVenmo && !venmoHandle) {
      return NextResponse.json(
        { error: 'Venmo handle is required when Venmo is enabled' },
        { status: 400 }
      );
    }

    if (acceptsCashApp && !cashAppHandle) {
      return NextResponse.json(
        { error: 'Cash App handle is required when Cash App is enabled' },
        { status: 400 }
      );
    }

    if (acceptsZelle && !zelleContact) {
      return NextResponse.json(
        { error: 'Zelle contact information is required when Zelle is enabled' },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.vendorInvitation.findUnique({
      where: { token: invitationToken },
      include: {
        wedding: true,
        coordinator: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation has already been accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    // Use a transaction to create vendor and update invitation
    const result = await prisma.$transaction(async (prisma) => {
      // Check if vendor already exists with this email
      let vendor = await prisma.vendor.findUnique({
        where: { email }
      });

      if (vendor) {
        // Update existing vendor
        vendor = await prisma.vendor.update({
          where: { id: vendor.id },
          data: {
            name,
            phone,
            bio,
            website,
            serviceArea,
            // Payment method enablement
            acceptsStripe: acceptsStripe ?? true,
            acceptsVenmo: acceptsVenmo ?? false,
            acceptsCashApp: acceptsCashApp ?? false,
            acceptsZelle: acceptsZelle ?? false,
            // Payment method details
            stripeAccountId,
            venmoHandle,
            cashAppHandle,
            zelleContact,
            status: 'ACTIVE',
            isProfileComplete: true,
            registeredAt: new Date()
          }
        });
      } else {
        // Create new vendor
        vendor = await prisma.vendor.create({
          data: {
            name,
            email,
            phone,
            role: invitation.role,
            bio,
            website,
            serviceArea,
            // Payment method enablement
            acceptsStripe: acceptsStripe ?? true,
            acceptsVenmo: acceptsVenmo ?? false,
            acceptsCashApp: acceptsCashApp ?? false,
            acceptsZelle: acceptsZelle ?? false,
            // Payment method details
            stripeAccountId,
            venmoHandle,
            cashAppHandle,
            zelleContact,
            status: 'ACTIVE',
            isProfileComplete: true,
            invitedBy: invitation.coordinatorId,
            registeredAt: new Date()
          }
        });
      }

      // Update invitation status
      await prisma.vendorInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          vendorId: vendor.id
        }
      });

      // Create wedding-vendor relationship
      const existingWeddingVendor = await prisma.weddingVendor.findFirst({
        where: {
          weddingId: invitation.weddingId,
          vendorId: vendor.id
        }
      });

      if (!existingWeddingVendor) {
        await prisma.weddingVendor.create({
          data: {
            weddingId: invitation.weddingId,
            vendorId: vendor.id
          }
        });
      }

      return {
        vendor,
        wedding: invitation.wedding,
        coordinator: invitation.coordinator
      };
    });

    return NextResponse.json({
      message: 'Vendor registration completed successfully',
      vendor: {
        id: result.vendor.id,
        name: result.vendor.name,
        email: result.vendor.email,
        role: result.vendor.role,
        status: result.vendor.status
      },
      wedding: {
        coupleName: result.wedding.coupleName,
        weddingDate: result.wedding.weddingDate
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering vendor:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to register vendor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
