export default async function handler(req, base44) {
  const user = await base44.auth.getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const profiles = await base44.entities.WorkerProfile.filter({ user_email: user.email });
  if (!profiles.length || !profiles[0].stripe_account_id) {
    return { onboarding_complete: false };
  }

  const profile = profiles[0];
  const account = await stripe.accounts.retrieve(profile.stripe_account_id);

  const onboardingComplete = account.details_submitted && account.charges_enabled;

  if (onboardingComplete && !profile.stripe_onboarding_complete) {
    await base44.entities.WorkerProfile.update(profile.id, {
      stripe_onboarding_complete: true
    });
  }

  return {
    onboarding_complete: onboardingComplete,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled
  };
}