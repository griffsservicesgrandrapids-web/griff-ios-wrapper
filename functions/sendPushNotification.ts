import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

webpush.setVapidDetails(
  'mailto:support@griffservices.com',
  vapidPublicKey,
  vapidPrivateKey
);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { userEmail, title, body, url } = await req.json();
    
    if (!userEmail || !title || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
      user_email: userEmail,
      is_active: true
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            JSON.stringify({ title, body, url })
          );
          return { success: true };
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await base44.asServiceRole.entities.PushSubscription.update(sub.id, {
              is_active: false
            });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    return Response.json({ 
      success: true, 
      sent: successful,
      total: subscriptions.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});