export default async function handler(req, base44) {
  const user = await base44.auth.getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');

  const { requestId } = req.body;
  if (!requestId) throw new Error('Request ID required');

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  // Get the service request
  const request = await base44.entities.ServiceRequest.get(requestId);
  if (!request) throw new Error('Request not found');
  if (request.status !== 'in_progress') throw new Error('Job must be in progress');
  if (request.payment_status !== 'paid') throw new Error('Payment not received');

  // Get worker profile
  const profiles = await base44.entities.WorkerProfile.filter({ user_email: request.worker_email });
  if (!profiles.length) throw new Error('Worker profile not found');
  
  const workerProfile = profiles[0];
  if (!workerProfile.stripe_account_id || !workerProfile.stripe_onboarding_complete) {
    throw new Error('Worker has not completed Stripe onboarding');
  }

  // Create transfer to worker
  const transfer = await stripe.transfers.create({
    amount: Math.round(request.worker_pay * 100), // Convert to cents
    currency: 'usd',
    destination: workerProfile.stripe_account_id,
    description: `Payment for ${request.title}`
  });

  // Update request status and increment worker job count
  await base44.entities.ServiceRequest.update(requestId, {
    status: 'completed'
  });

  await base44.entities.WorkerProfile.update(workerProfile.id, {
    total_jobs: (workerProfile.total_jobs || 0) + 1
  });

  return { 
    success: true, 
    transfer_id: transfer.id,
    amount: request.worker_pay 
  };
}