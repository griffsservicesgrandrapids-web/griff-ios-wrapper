import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X, MapPin, Calendar, Clock, DollarSign, User, FileText, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { serviceIcons, serviceLabels, serviceColors } from '../services/ServiceCard';
import StatusBadge from '../common/StatusBadge';
import CheckoutButton from '../payments/CheckoutButton';

export default function RequestDetailsModal({ request, onClose, onApprove, onReject }) {
  if (!request) return null;

  const Icon = serviceIcons[request.service_type] || Briefcase;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className={`bg-gradient-to-br ${serviceColors[request.service_type]} p-6 relative rounded-t-3xl`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{request.title}</h2>
                <p className="text-white/80">{serviceLabels[request.service_type]}</p>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {request.description && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Description</h3>
                </div>
                <p className="text-slate-300 bg-white/5 rounded-2xl p-4 border border-white/10">
                  {request.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-slate-400">Location</span>
                </div>
                <p className="text-white font-medium">{request.location}</p>
              </div>

              {request.preferred_date && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">Preferred Date</span>
                  </div>
                  <p className="text-white font-medium">
                    {format(new Date(request.preferred_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              {request.preferred_time && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">Time Slot</span>
                  </div>
                  <p className="text-white font-medium">{request.preferred_time}</p>
                </div>
              )}

              {request.budget && (
                <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-orange-300">Budget</span>
                  </div>
                  <p className="text-white font-bold text-xl">${request.budget}</p>
                </div>
              )}

              {request.customer_name && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">Customer</span>
                  </div>
                  <p className="text-white font-medium">{request.customer_name}</p>
                </div>
              )}

              {request.worker_name && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-400">Assigned Worker</span>
                  </div>
                  <p className="text-white font-medium">{request.worker_name}</p>
                </div>
              )}
            </div>

            {/* Price Approval Section */}
            {request.status === 'awaiting_approval' && onApprove && onReject && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                  Price Set - Awaiting Your Approval
                </h3>
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-slate-300 text-sm mb-2">Total Price:</p>
                  <p className="text-4xl font-bold text-white">${request.budget}</p>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Approve the price to make this job available for workers to accept.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={onReject}
                    variant="outline"
                    className="h-12 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    onClick={onApprove}
                    className="h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Price
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {request.status === 'awaiting_payment' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Worker Approved - Ready for Payment
                </h3>
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-slate-300 text-sm mb-2">Total Amount:</p>
                  <p className="text-4xl font-bold text-white">${request.budget}</p>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Your worker has been approved! Pay now to dispatch the job.
                </p>
                <CheckoutButton request={request} onSuccess={null} />
              </div>
            )}

            {/* Close Button */}
            {request.status !== 'awaiting_approval' && (
              <Button
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10"
              >
                Close
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}