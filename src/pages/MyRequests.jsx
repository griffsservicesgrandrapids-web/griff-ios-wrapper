import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardList } from 'lucide-react';
import { toast } from "sonner";
import RequestCard from '@/components/requests/RequestCard';
import RequestDetailsModal from '@/components/requests/RequestDetailsModal';
import PullToRefresh from '@/components/layout/PullToRefresh';

export default function MyRequests() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const modalRequestId = searchParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.ServiceRequest.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email
  });

  const queryClient = useQueryClient();

  const deleteRequestMutation = useMutation({
    mutationFn: (requestId) => base44.entities.ServiceRequest.delete(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Request deleted');
    }
  });

  const optimisticUpdate = async (requestId, updates) => {
    await queryClient.cancelQueries({ queryKey: ['my-requests', user?.email] });
    const prev = queryClient.getQueryData(['my-requests', user?.email]);
    queryClient.setQueryData(['my-requests', user?.email], old =>
      (old || []).map(r => r.id === requestId ? { ...r, ...updates } : r)
    );
    return { prev };
  };

  const openRequestDetails = (request) => {
    navigate(`${createPageUrl('MyRequests')}?id=${request.id}`);
  };

  const closeModal = () => {
    navigate(-1);
  };

  const approveRequestMutation = useMutation({
    mutationFn: (requestId) => base44.entities.ServiceRequest.update(requestId, { status: 'pending' }),
    onMutate: (requestId) => optimisticUpdate(requestId, { status: 'pending' }),
    onError: (err, id, context) => {
      if (context?.prev) queryClient.setQueryData(['my-requests', user?.email], context.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Price approved! Your request is now available for workers.');
      closeModal();
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId) => base44.entities.ServiceRequest.update(requestId, { status: 'cancelled' }),
    onMutate: (requestId) => optimisticUpdate(requestId, { status: 'cancelled' }),
    onError: (err, id, context) => {
      if (context?.prev) queryClient.setQueryData(['my-requests', user?.email], context.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Request cancelled');
      closeModal();
    }
  });

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
  };

  return (
    <div className="min-h-screen bg-slate-950">
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Glassmorphic Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">My Requests</h1>
                <p className="text-slate-300">Track your service requests</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{requests.length}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
          </div>
        </motion.div>

        {/* Modern Filter Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All', count: requests.length },
              { value: 'pending_review', label: 'Review', count: requests.filter(r => r.status === 'pending_review').length },
              { value: 'awaiting_approval', label: 'Price Set', count: requests.filter(r => r.status === 'awaiting_approval').length },
              { value: 'pending', label: 'Available', count: requests.filter(r => r.status === 'pending').length },
              { value: 'awaiting_worker_approval', label: 'Worker Pending', count: requests.filter(r => r.status === 'awaiting_worker_approval').length },
              { value: 'awaiting_payment', label: 'Ready to Pay', count: requests.filter(r => r.status === 'awaiting_payment').length },
              { value: 'accepted', label: 'Accepted', count: requests.filter(r => r.status === 'accepted').length },
              { value: 'in_progress', label: 'Active', count: requests.filter(r => r.status === 'in_progress').length },
              { value: 'completed', label: 'Done', count: requests.filter(r => r.status === 'completed').length },
            ].map((filter) => (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(filter.value)}
                className={`
                  px-4 py-2 rounded-full font-medium text-sm transition-all
                  ${statusFilter === filter.value
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/5 backdrop-blur-sm text-slate-300 hover:bg-white/10 border border-white/10'
                  }
                `}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === filter.value ? 'bg-white/20' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="h-40 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center py-20 px-6 backdrop-blur-xl bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <ClipboardList className="w-12 h-12 text-orange-400" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-3">No requests found</h3>
            <p className="text-slate-400 mb-6">
              {statusFilter === 'all' 
                ? "Start by creating your first service request"
                : `No ${statusFilter.replace('_', ' ')} requests at the moment`
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request, i) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: i * 0.05,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <RequestCard 
                  request={request}
                  onClick={() => openRequestDetails(request)}
                  showWorker 
                  onDelete={
                    (request.status === 'pending_review' || request.status === 'pending')
                      ? () => deleteRequestMutation.mutate(request.id)
                      : null
                  }
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Details Modal — triggered by URL */}
        {(() => {
          const selectedRequest = modalRequestId ? requests.find(r => r.id === modalRequestId) : null;
          return selectedRequest ? (
            <RequestDetailsModal 
              request={selectedRequest} 
              onClose={closeModal}
              onApprove={selectedRequest.status === 'awaiting_approval' 
                ? () => approveRequestMutation.mutate(selectedRequest.id)
                : null
              }
              onReject={selectedRequest.status === 'awaiting_approval'
                ? () => rejectRequestMutation.mutate(selectedRequest.id)
                : null
              }
            />
          ) : null;
        })()}
      </div>
    </PullToRefresh>
    </div>
  );
}