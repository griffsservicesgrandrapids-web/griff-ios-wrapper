import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { event, data } = await req.json();
    
    if (event?.type !== 'create' || event?.entity_name !== 'ServiceRequest') {
      return Response.json({ skipped: true });
    }

    if (data?.status !== 'pending') {
      return Response.json({ skipped: true });
    }

    const workers = await base44.asServiceRole.entities.WorkerProfile.filter({
      is_approved: true,
      is_available: true
    });

    const serviceType = data.service_type;
    const relevantWorkers = workers.filter(w => 
      w.services_offered?.includes(serviceType)
    );

    await Promise.all(
      relevantWorkers.map(worker =>
        base44.asServiceRole.functions.invoke('sendPushNotification', {
          userEmail: worker.user_email,
          title: '🎯 New Gig Available',
          body: `${data.title} - $${data.worker_pay}`,
          url: '/WorkerDashboard'
        })
      )
    );

    return Response.json({ 
      success: true, 
      notified: relevantWorkers.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});