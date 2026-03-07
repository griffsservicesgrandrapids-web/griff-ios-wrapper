import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, ArrowRight, History, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ServiceCard from '@/components/services/ServiceCard';
import RequestForm from '@/components/services/RequestForm';
import RequestCard from '@/components/requests/RequestCard';
import RequestDetailsModal from '@/components/requests/RequestDetailsModal';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';
import PullToRefresh from '@/components/layout/PullToRefresh';

const services = [
  'snow_plowing', 'lawn_mowing',
  'blade_sharpener', 'dj', 'masseuse', 'power_washer', 'dog_walker',
  'handyman', 'cleaner', 'photographer', 'tutor', 'personal_trainer'
];

export default function Home() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const modalType = searchParams.get('modal');
  const modalService = searchParams.get('service');
  const modalRequestId = searchParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.ServiceRequest.filter({ customer_email: user.email }, '-created_date', 5),
    enabled: !!user?.email
  });

  // Derive the selected request from URL params
  const selectedRequest = modalType === 'details' && modalRequestId
    ? myRequests.find(r => r.id === modalRequestId) || null
    : null;

  const openRequestForm = (service) => {
    navigate(`${createPageUrl('Home')}?modal=request&service=${service}`);
  };

  const openRequestDetails = (request) => {
    navigate(`${createPageUrl('Home')}?modal=details&id=${request.id}`);
  };

  const closeModal = () => {
    navigate(-1);
  };

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceRequest.create({
      ...data,
      customer_email: user?.email,
      customer_name: user?.full_name
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['my-requests', user?.email] });
      const prev = queryClient.getQueryData(['my-requests', user?.email]);
      const optimistic = {
        id: `temp-${Date.now()}`,
        ...data,
        customer_email: user?.email,
        customer_name: user?.full_name,
        status: 'pending_review',
        created_date: new Date().toISOString()
      };
      queryClient.setQueryData(['my-requests', user?.email], old => [optimistic, ...(old || [])]);
      return { prev };
    },
    onError: (err, data, context) => {
      if (context?.prev) queryClient.setQueryData(['my-requests', user?.email], context.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      closeModal();
      toast.success('Request submitted successfully!');
    }
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-requests', user?.email] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
    <PullToRefresh onRefresh={handleRefresh}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Services on demand
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Get help from
              <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                local professionals
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">
              From blade sharpening to DJ services — find skilled workers ready to help you today.
            </p>
            <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6">
              Test
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">Choose a service</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((service, i) => (
              <motion.div
                key={service}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <ServiceCard
                  service={service}
                  onClick={openRequestForm}
                  selected={modalService === service}
                />
              </motion.div>
            ))}
            
            {/* Custom Request Button */}
            <motion.button
              onClick={() => openRequestForm('custom')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * services.length }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative overflow-hidden rounded-2xl p-6 text-left
                transition-all duration-300 border-2 border-dashed
                ${modalService === 'custom' 
                  ? 'border-orange-500 bg-slate-800 shadow-xl' 
                  : 'border-slate-600 bg-slate-900 hover:border-orange-400 hover:bg-slate-800 shadow-md hover:shadow-xl'
                }
              `}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Custom Request
              </h3>
              <p className="text-sm text-slate-400">
                Request anything →
              </p>
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Requests */}
        {user && myRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <History className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Your recent requests</h2>
              </div>
              <Link to={createPageUrl('MyRequests')}>
                <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-slate-800">
                  View all
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRequests.slice(0, 3).map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  showWorker 
                  onClick={() => openRequestDetails(request)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Request Form Modal — triggered by URL */}
      <AnimatePresence>
        {modalType === 'request' && modalService && (
          <RequestForm
            service={modalService}
            onClose={closeModal}
            onSubmit={createRequestMutation.mutate}
            isSubmitting={createRequestMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Request Details Modal — triggered by URL */}
      {modalType === 'details' && selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={closeModal}
        />
      )}

      {user && <NotificationPrompt userEmail={user.email} />}
    </PullToRefresh>
    </div>
  );
}