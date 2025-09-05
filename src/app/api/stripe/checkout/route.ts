import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });
};

export async function POST(request: NextRequest) {
  try {
    const { vendorId, vendorName, amount, vendorStripeAccountId, returnUrl } = await request.json();

    if (!vendorStripeAccountId) {
      return NextResponse.json(
        { error: 'Vendor does not have Stripe connected' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create Checkout Session with Stripe Connect
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Wedding Tip for ${vendorName}`,
              description: `Thank you tip for ${vendorName}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?success=true&vendor=${encodeURIComponent(vendorId)}&amount=${amount}`,
      cancel_url: `${returnUrl}?cancelled=true`,
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 100 * 0.05), // 5% platform fee
        transfer_data: {
          destination: vendorStripeAccountId,
        },
      },
      metadata: {
        vendorId,
        vendorName,
        tipAmount: amount.toString(),
      },
    });

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

