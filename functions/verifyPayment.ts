import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    console.log('Verifying payment for session:', sessionId);
    
    if (!sessionId) {
      return Response.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('Stripe session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      metadata: session.metadata
    });
    
    if (session.payment_status !== 'paid') {
      return Response.json({ 
        error: 'Payment not completed', 
        payment_status: session.payment_status,
        session_status: session.status 
      }, { status: 400 });
    }

    const requestId = session.metadata?.request_id;
    
    if (!requestId) {
      return Response.json({ error: 'No request ID in session' }, { status: 400 });
    }

    // Update the service request
    await base44.asServiceRole.entities.ServiceRequest.update(requestId, {
      payment_status: 'paid',
      status: 'accepted',
      stripe_payment_intent_id: session.payment_intent
    });

    return Response.json({ success: true, requestId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});