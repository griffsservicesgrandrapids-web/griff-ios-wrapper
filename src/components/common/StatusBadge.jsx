import React from 'react';
import { Clock, CheckCircle, Play, XCircle, User, DollarSign } from 'lucide-react';

const statusConfig = {
  pending_review: {
    label: 'Under Review',
    icon: Clock,
    className: 'bg-orange-500/20 text-orange-300 border-orange-500/30 backdrop-blur-sm'
  },
  pending: {
    label: 'Available',
    icon: Clock,
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-sm'
  },
  awaiting_approval: {
    label: 'Price Set',
    icon: Clock,
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-sm'
  },
  awaiting_worker_approval: {
    label: 'Worker Pending',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 backdrop-blur-sm'
  },
  awaiting_payment: {
    label: 'Ready to Pay',
    icon: DollarSign,
    className: 'bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-sm'
  },
  accepted: {
    label: 'Paid',
    icon: User,
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-sm'
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 backdrop-blur-sm'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-sm'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30 backdrop-blur-sm'
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-lg ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}