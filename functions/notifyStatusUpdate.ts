import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { event, data, old_data } = await req.json();
    
    if (event?.type !== 'update' || event?.entity_name !== 'ServiceRequest') {
      return Response.json({ skipped: true });
    }

    if (data?.status === old_data?.status) {
      return Response.json({ skipped: true });
    }

    const statusMessages = {
      'awaiting_approval': {
        title: '💰 Price Proposal',
        body: `A worker has set a price of $${data.budget} for your request`
      },
      'awaiting_payment': {
        title: '💳 Ready for Payment',
        body: 'Your service request has been approved and is ready for payment'
      },
      'accepted': {
        title: '✅ Payment Confirmed',
        body: 'Your payment was successful! Your service is confirmed'
      },
      'in_progress': {
        title: '🚀 Service Started',
        body: `Your ${data.service_type} service has started`
      },
      'completed': {
        title: '🎉 Service Completed',
        body: `Your ${data.title} has been completed!`
      }
    };

    const notification = statusMessages[data.status];
    
    if (notification && data.customer_email) {
      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        userEmail: data.customer_email,
        title: notification.title,
        body: notification.body,
        url: '/MyRequests'
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});