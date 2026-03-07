import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { amount, requestId, title, serviceType } = await req.json();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    if (!amount || !requestId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: title || 'Service Payment',
              description: serviceType || 'Service Request'
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/PaymentCancelled`,
      metadata: { request_id: requestId },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});