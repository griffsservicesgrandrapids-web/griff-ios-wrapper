export default async function handler(req, base44) {
  const user = await base44.auth.getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  // Get worker profile
  const profiles = await base44.entities.WorkerProfile.filter({ user_email: user.email });
  if (!profiles.length) throw new Error('Worker profile not found');
  
  const profile = profiles[0];

  // Create or retrieve Stripe Connect account
  let accountId = profile.stripe_account_id;
  
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        transfers: { requested: true }
      }
    });
    accountId = account.id;
    
    await base44.entities.WorkerProfile.update(profile.id, {
      stripe_account_id: accountId
    });
  }

  // Create account link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${req.headers.origin || 'http://localhost:5173'}/worker-profile?refresh=true`,
    return_url: `${req.headers.origin || 'http://localhost:5173'}/worker-profile?success=true`,
    type: 'account_onboarding'
  });

  return { url: accountLink.url };
}