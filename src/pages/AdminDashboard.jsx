import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Shield, MapPin, Calendar, DollarSign, Check, X, 
  User, Mail, Clock, AlertCircle, Briefcase, TrendingDown, Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { serviceIcons, serviceLabels, serviceColors } from '@/components/services/ServiceCard';
import StatusBadge from '@/components/common/StatusBadge';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending_approval');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role !== 'admin') {
        toast.error('Access denied. Admin only.');
      }
    }).catch(() => {});
  }, []);

  const { data: pendingReview = [] } = useQuery({
    queryKey: ['pending-review'],
    queryFn: () => base44.entities.ServiceRequest.filter({ status: 'pending_review' }, '-created_date'),
    enabled: user?.role === 'admin'
  });

  const { data: pendingApproval = [] } = useQuery({
    queryKey: ['pending-approval'],
    queryFn: () => base44.entities.ServiceRequest.filter({ status: 'awaiting_worker_approval' }, '-created_date'),
    enabled: user?.role === 'admin'
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['all-requests'],
    queryFn: () => base44.entities.ServiceRequest.list('-created_date'),
    enabled: user?.role === 'admin'
  });

  const { data: activeJobs = [] } = useQuery({
    queryKey: ['active-jobs'],
    queryFn: () => base44.entities.ServiceRequest.filter({ status: 'in_progress' }, '-created_date'),
    enabled: user?.role === 'admin'
  });

  const { data: pendingWorkers = [] } = useQuery({
    queryKey: ['pending-workers'],
    queryFn: () => base44.entities.WorkerProfile.filter({ is_approved: false }, '-created_date'),
    enabled: user?.role === 'admin'
  });

  const { data: allWorkers = [] } = useQuery({
    queryKey: ['all-workers'],
    queryFn: () => base44.entities.WorkerProfile.list('-created_date'),
    enabled: user?.role === 'admin'
  });

  const approveMutation = useMutation({
    mutationFn: (request) => base44.entities.ServiceRequest.update(request.id, {
      status: 'awaiting_payment'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approval'] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast.success('Worker approved! Customer can now pay.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (request) => base44.entities.ServiceRequest.update(request.id, {
      status: 'pending',
      worker_email: null,
      worker_name: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approval'] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast.success('Assignment rejected. Gig returned to available pool.');
    }
  });

  const approveWorkerMutation = useMutation({
    mutationFn: (worker) => base44.entities.WorkerProfile.update(worker.id, {
      is_approved: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-workers'] });
      queryClient.invalidateQueries({ queryKey: ['all-workers'] });
      toast.success('Worker approved!');
    }
  });

  const rejectWorkerMutation = useMutation({
    mutationFn: (worker) => base44.entities.WorkerProfile.delete(worker.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-workers'] });
      queryClient.invalidateQueries({ queryKey: ['all-workers'] });
      toast.success('Worker profile rejected and deleted.');
    }
  });

  const approveReviewMutation = useMutation({
    mutationFn: ({ request, customerPrice, workerPay }) => base44.entities.ServiceRequest.update(request.id, {
      status: 'awaiting_approval',
      budget: customerPrice,
      worker_pay: workerPay
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-review'] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast.success('Price set! Sent to customer for approval.');
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (request) => base44.entities.ServiceRequest.update(request.id, {
      status: 'cancelled'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-review'] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast.success('Request rejected and cancelled.');
    }
  });

  const [payingOut, setPayingOut] = useState(false);

  const completeJobMutation = useMutation({
    mutationFn: async (requestId) => {
      const res = await fetch('/api/payout-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payout failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['all-requests'] });
      toast.success(`Job completed! Paid $${data.amount} to worker.`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white rounded-3xl shadow-xl border border-red-100 max-w-md mx-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500">This page is only accessible to administrators.</p>
        </motion.div>
      </div>
    );
  }

  const stats = {
    pendingReview: pendingReview.length,
    pendingApproval: pendingApproval.length,
    pendingWorkers: pendingWorkers.length,
    totalRequests: allRequests.length,
    activeJobs: allRequests.filter(r => r.status === 'accepted' || r.status === 'in_progress').length,
    completed: allRequests.filter(r => r.status === 'completed').length,
    approvedWorkers: allWorkers.filter(w => w.is_approved).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-500">Manage service requests and worker assignments</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingApproval}</p>
              <p className="text-sm text-slate-500">Pending Approval</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.activeJobs}</p>
              <p className="text-sm text-slate-500">Active Jobs</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalRequests}</p>
              <p className="text-sm text-slate-500">Total Requests</p>
            </div>
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
            <TabsList className="bg-white border border-slate-200 shadow-sm">
              <TabsTrigger value="pending_review" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Review Requests ({pendingReview.length})
              </TabsTrigger>
              <TabsTrigger value="pending_workers" className="gap-2">
                <User className="w-4 h-4" />
                Pending Workers ({pendingWorkers.length})
              </TabsTrigger>
              <TabsTrigger value="pending_approval" className="gap-2">
                <Clock className="w-4 h-4" />
                Job Approvals ({pendingApproval.length})
              </TabsTrigger>
              <TabsTrigger value="active_jobs" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Complete Jobs ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="all_requests" className="gap-2">
                <Shield className="w-4 h-4" />
                All Requests
              </TabsTrigger>
              <TabsTrigger value="all_workers" className="gap-2">
                <User className="w-4 h-4" />
                All Workers ({allWorkers.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'pending_review' ? (
            <motion.div
              key="pending-review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {pendingReview.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-slate-500">No requests awaiting review</p>
                </div>
              ) : (
                pendingReview.map((request, i) => (
                  <RequestReviewCard
                    key={request.id}
                    request={request}
                    index={i}
                    onApprove={(customerPrice, workerPay) => approveReviewMutation.mutate({ request, customerPrice, workerPay })}
                    onReject={() => rejectRequestMutation.mutate(request)}
                    isProcessing={approveReviewMutation.isPending || rejectRequestMutation.isPending}
                  />
                ))
              )}
            </motion.div>
          ) : activeTab === 'pending_workers' ? (
            <motion.div
              key="pending-workers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {pendingWorkers.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-slate-500">No workers awaiting approval</p>
                </div>
              ) : (
                pendingWorkers.map((worker, i) => (
                  <WorkerApprovalCard
                    key={worker.id}
                    worker={worker}
                    index={i}
                    onApprove={() => approveWorkerMutation.mutate(worker)}
                    onReject={() => rejectWorkerMutation.mutate(worker)}
                    isProcessing={approveWorkerMutation.isPending || rejectWorkerMutation.isPending}
                  />
                ))
              )}
            </motion.div>
          ) : activeTab === 'pending_approval' ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {pendingApproval.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-slate-500">No pending approvals at the moment</p>
                </div>
              ) : (
                pendingApproval.map((request, i) => (
                  <ApprovalCard
                    key={request.id}
                    request={request}
                    index={i}
                    onApprove={() => approveMutation.mutate(request)}
                    onReject={() => rejectMutation.mutate(request)}
                    isProcessing={approveMutation.isPending || rejectMutation.isPending}
                  />
                ))
              )}
            </motion.div>
          ) : activeTab === 'active_jobs' ? (
            <motion.div
              key="active-jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {activeJobs.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No active jobs</h3>
                  <p className="text-slate-500">Jobs in progress will appear here</p>
                </div>
              ) : (
                activeJobs.map((request, i) => (
                  <ActiveJobCard
                    key={request.id}
                    request={request}
                    index={i}
                    onComplete={() => completeJobMutation.mutate(request.id)}
                    isProcessing={completeJobMutation.isPending}
                  />
                ))
              )}
            </motion.div>
          ) : activeTab === 'all_requests' ? (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {allRequests.map((request, i) => (
                <RequestOverviewCard key={request.id} request={request} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="all-workers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {allWorkers.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No workers yet</h3>
                  <p className="text-slate-500">Workers who sign up will appear here</p>
                </div>
              ) : (
                allWorkers.map((worker, i) => (
                  <AllWorkerCard key={worker.id} worker={worker} index={i} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ApprovalCard({ request, index, onApprove, onReject, isProcessing }) {
  const Icon = serviceIcons[request.service_type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${serviceColors[request.service_type]} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{request.title}</h3>
              <p className="text-sm text-slate-500">{serviceLabels[request.service_type]}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Request Details */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">Customer</p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{request.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-xs">{request.customer_email}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Proposed Worker</p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <User className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-indigo-600">{request.worker_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-xs">{request.worker_email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{request.location}</span>
          </div>
          {request.preferred_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(request.preferred_date), 'MMM d, yyyy')}</span>
              {request.preferred_time && (
                <span className="text-slate-400">• {request.preferred_time}</span>
              )}
            </div>
          )}
          {request.budget && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <DollarSign className="w-4 h-4" />
              <span>${request.budget}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={onReject}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve Assignment
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function WorkerApprovalCard({ worker, index, onApprove, onReject, isProcessing }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{worker.display_name}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="text-xs">{worker.user_email}</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </div>
        </div>

        {/* Bio */}
        {worker.bio && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">{worker.bio}</p>
          </div>
        )}

        {/* Services Offered */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2 font-medium">Services Offered:</p>
          <div className="flex flex-wrap gap-2">
            {worker.services_offered?.map(service => {
              const Icon = serviceIcons[service];
              return (
                <div
                  key={service}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br ${serviceColors[service]} text-white text-xs font-medium`}
                >
                  <Icon className="w-3 h-3" />
                  {serviceLabels[service]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          {worker.hourly_rate && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-emerald-600">${worker.hourly_rate}/hr</span>
            </div>
          )}
          {worker.service_area && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{worker.service_area}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={onReject}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve Worker
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function RequestReviewCard({ request, index, onApprove, onReject, isProcessing }) {
  const [customerPrice, setCustomerPrice] = React.useState('');
  const [workerPay, setWorkerPay] = React.useState('');
  const Icon = serviceIcons[request.service_type] || AlertCircle;
  const isCustom = request.service_type === 'custom';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl ${isCustom ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : `bg-gradient-to-br ${serviceColors[request.service_type]}`} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate">{request.title}</h3>
                {isCustom && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{serviceLabels[request.service_type] || 'Service'}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Description */}
        {request.description && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700">{request.description}</p>
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-500 mb-2">Customer</p>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{request.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
            <Mail className="w-3 h-3 text-slate-400" />
            <span className="text-xs">{request.customer_email}</span>
          </div>
        </div>

        {/* Service Details */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{request.location}</span>
          </div>
          {request.preferred_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(request.preferred_date), 'MMM d, yyyy')}</span>
              {request.preferred_time && (
                <span className="text-slate-400">• {request.preferred_time}</span>
              )}
            </div>
          )}
          {request.budget && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <DollarSign className="w-4 h-4" />
              <span>${request.budget} (customer budget)</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200 space-y-3">
          <div>
            <Label htmlFor={`customer-price-${request.id}`} className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              Customer Price
            </Label>
            <Input
              id={`customer-price-${request.id}`}
              type="number"
              step="0.01"
              value={customerPrice}
              onChange={(e) => setCustomerPrice(parseFloat(e.target.value))}
              placeholder="Price customer will pay"
              className="h-11 rounded-xl border-orange-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div>
            <Label htmlFor={`worker-pay-${request.id}`} className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              Worker Pay {customerPrice && workerPay ? `(Your cut: $${(customerPrice - workerPay).toFixed(2)})` : ''}
            </Label>
            <Input
              id={`worker-pay-${request.id}`}
              type="number"
              step="0.01"
              value={workerPay}
              onChange={(e) => setWorkerPay(parseFloat(e.target.value))}
              placeholder="Amount worker receives"
              className="h-11 rounded-xl border-orange-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={onReject}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Reject Request
          </Button>
          <Button
            onClick={() => onApprove(customerPrice, workerPay)}
            disabled={isProcessing || !customerPrice || !workerPay}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Set Price & Send to Customer
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ActiveJobCard({ request, index, onComplete, isProcessing }) {
  const Icon = serviceIcons[request.service_type] || AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${serviceColors[request.service_type]} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{request.title}</h3>
              <p className="text-sm text-slate-500">{serviceLabels[request.service_type]}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">Customer</p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{request.customer_name}</span>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">Worker</p>
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <User className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">{request.worker_name}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{request.location}</span>
          </div>
          {request.preferred_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(request.preferred_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <DollarSign className="w-4 h-4" />
            <span>Worker gets: ${request.worker_pay}</span>
          </div>
        </div>

        <Button
          onClick={onComplete}
          disabled={isProcessing}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing payout...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Complete Job & Pay Worker
            </div>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

function RequestOverviewCard({ request, index }) {
  const Icon = serviceIcons[request.service_type] || AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${request.service_type === 'custom' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : `bg-gradient-to-br ${serviceColors[request.service_type]}`} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{request.title}</h3>
              <p className="text-sm text-slate-500">{serviceLabels[request.service_type] || 'Service'}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>{request.customer_name}</span>
          </div>
          {request.worker_name && (
            <div className="flex items-center gap-2 text-indigo-600">
              <User className="w-4 h-4" />
              <span className="font-medium">{request.worker_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{request.location}</span>
          </div>
          {request.preferred_date && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(request.preferred_date), 'MMM d')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AllWorkerCard({ worker, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{worker.display_name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Mail className="w-3 h-3" />
                <span>{worker.user_email}</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${worker.is_approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {worker.is_approved ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {worker.is_approved ? 'Approved' : 'Pending'}
          </div>
        </div>

        {worker.bio && (
          <p className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">{worker.bio}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {worker.services_offered?.map(service => {
            const Icon = serviceIcons[service];
            return (
              <div key={service} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                <Icon className="w-3 h-3" />
                {serviceLabels[service]}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          {worker.hourly_rate && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-emerald-600">${worker.hourly_rate}/hr</span>
            </div>
          )}
          {worker.service_area && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{worker.service_area}</span>
            </div>
          )}
          {worker.total_jobs > 0 && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{worker.total_jobs} jobs completed</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}