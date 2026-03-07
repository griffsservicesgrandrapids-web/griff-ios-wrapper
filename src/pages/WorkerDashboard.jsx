import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Briefcase, MapPin, Calendar, DollarSign, Check, Play, 
  CheckCircle, User, Settings, TrendingUp, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { serviceIcons, serviceLabels, serviceColors } from '@/components/services/ServiceCard';
import StatusBadge from '@/components/common/StatusBadge';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';

export default function WorkerDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: workerProfile } = useQuery({
    queryKey: ['worker-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ user_email: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: availableGigs = [] } = useQuery({
    queryKey: ['available-gigs', workerProfile?.services_offered, workerProfile?.is_approved],
    queryFn: async () => {
      if (!workerProfile?.services_offered?.length || !workerProfile?.is_approved) return [];
      const gigs = await base44.entities.ServiceRequest.filter({ status: 'pending' }, '-created_date');
      return gigs.filter(g => workerProfile.services_offered.includes(g.service_type));
    },
    enabled: !!workerProfile?.services_offered?.length && workerProfile?.is_approved === true,
    refetchInterval: 5000
  });

  // Real-time subscription for new gigs
  useEffect(() => {
    if (!workerProfile?.is_approved) return;
    
    const unsubscribe = base44.entities.ServiceRequest.subscribe((event) => {
      if (event.type === 'update' && event.data.status === 'pending') {
        queryClient.invalidateQueries({ queryKey: ['available-gigs'] });
      }
    });
    
    return unsubscribe;
  }, [workerProfile?.is_approved, queryClient]);

  const { data: myGigs = [] } = useQuery({
    queryKey: ['my-gigs', user?.email],
    queryFn: async () => {
      const gigs = await base44.entities.ServiceRequest.filter({ worker_email: user.email }, '-created_date');
      return gigs.filter(g => g.status !== 'pending');
    },
    enabled: !!user?.email
  });

  const acceptGigMutation = useMutation({
    mutationFn: (gig) => base44.entities.ServiceRequest.update(gig.id, {
      status: 'awaiting_worker_approval',
      worker_email: user.email,
      worker_name: workerProfile?.display_name || user.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-gigs'] });
      queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      toast.success('Request sent! Awaiting admin approval.');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ServiceRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      toast.success('Status updated!');
    }
  });

  if (!workerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-slate-800 rounded-3xl shadow-xl border border-orange-500/20 max-w-md mx-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Set Up Your Profile</h2>
          <p className="text-slate-300 mb-6">Create your worker profile to start receiving gigs</p>
          <Link to={createPageUrl('WorkerProfile')}>
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl px-6">
              <Settings className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (workerProfile && !workerProfile.is_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-slate-800 rounded-3xl shadow-xl border border-orange-500/20 max-w-md mx-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pending Approval</h2>
          <p className="text-slate-300 mb-6">
            Your worker profile has been submitted and is awaiting approval from Griff's Services admin team.
          </p>
          <p className="text-sm text-slate-400">
            You'll be notified once your profile is approved and you can start accepting gigs.
          </p>
          <Link to={createPageUrl('WorkerProfile')} className="mt-6 inline-block">
            <Button variant="outline" className="rounded-xl border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
              <User className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const activeGigs = myGigs.filter(g => g.status === 'accepted' || g.status === 'in_progress');
  const completedGigs = myGigs.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{availableGigs.length}</p>
            <p className="text-sm text-slate-400">Available Gigs</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{activeGigs.length}</p>
            <p className="text-sm text-slate-400">Active Jobs</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{completedGigs.length}</p>
            <p className="text-sm text-slate-400">Completed</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">${workerProfile.hourly_rate || '—'}</p>
            <p className="text-sm text-slate-400">Hourly Rate</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border border-slate-700 shadow-sm">
              <TabsTrigger value="available" className="gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400">
                <Briefcase className="w-4 h-4" />
                Available Gigs
              </TabsTrigger>
              <TabsTrigger value="my-gigs" className="gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400">
                <User className="w-4 h-4" />
                My Jobs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'available' ? (
            <motion.div
              key="available"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {availableGigs.length === 0 ? (
                <div className="text-center py-16 px-6 bg-slate-800 rounded-3xl border border-slate-700">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No gigs available</h3>
                  <p className="text-slate-400">New requests matching your services will appear here</p>
                </div>
              ) : (
                availableGigs.map((gig, i) => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    index={i}
                    onAccept={() => acceptGigMutation.mutate(gig)}
                    isAccepting={acceptGigMutation.isPending}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="my-gigs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {myGigs.length === 0 ? (
                <div className="text-center py-16 px-6 bg-slate-800 rounded-3xl border border-slate-700">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No jobs yet</h3>
                  <p className="text-slate-400">Accept gigs to see them here</p>
                </div>
              ) : (
                myGigs.map((gig, i) => (
                  <MyGigCard
                    key={gig.id}
                    gig={gig}
                    index={i}
                    onUpdateStatus={(status) => updateStatusMutation.mutate({ id: gig.id, status })}
                    isUpdating={updateStatusMutation.isPending}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {user && <NotificationPrompt userEmail={user.email} />}
    </div>
  );
}

function GigCard({ gig, index, onAccept, isAccepting }) {
  const Icon = serviceIcons[gig.service_type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden hover:shadow-lg hover:border-orange-500/50 transition-all"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${serviceColors[gig.service_type]} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{gig.title}</h3>
              <p className="text-sm text-slate-400">{serviceLabels[gig.service_type]}</p>
            </div>
          </div>
          <Button
            onClick={onAccept}
            disabled={isAccepting}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl"
          >
            <Check className="w-4 h-4 mr-2" />
            Request Job
          </Button>
        </div>

        {gig.description && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">{gig.description}</p>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{gig.location}</span>
          </div>
          {gig.preferred_date && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(gig.preferred_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          {gig.worker_pay && (
            <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
              <DollarSign className="w-4 h-4" />
              <span>${gig.worker_pay}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MyGigCard({ gig, index, onUpdateStatus, isUpdating }) {
  const Icon = serviceIcons[gig.service_type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${serviceColors[gig.service_type]} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{gig.title}</h3>
              <p className="text-sm text-slate-400">{gig.customer_name || 'Customer'}</p>
            </div>
          </div>
          <StatusBadge status={gig.status} />
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{gig.location}</span>
          </div>
          {gig.preferred_date && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(gig.preferred_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          {gig.worker_pay && (
            <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
              <DollarSign className="w-4 h-4" />
              <span>${gig.worker_pay}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {gig.status !== 'completed' && gig.status !== 'cancelled' && (
          <div className="flex gap-2 pt-4 border-t border-slate-700">
            {gig.status === 'accepted' && (
              <Button
                onClick={() => onUpdateStatus('in_progress')}
                disabled={isUpdating}
                variant="outline"
                className="rounded-xl border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Job
              </Button>
            )}
            {gig.status === 'in_progress' && (
              <Button
                onClick={() => onUpdateStatus('completed')}
                disabled={isUpdating}
                className="rounded-xl bg-orange-500 hover:bg-orange-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}