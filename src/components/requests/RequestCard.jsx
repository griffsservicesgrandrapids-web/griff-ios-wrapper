import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { MapPin, Calendar, DollarSign, User, Briefcase, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { serviceIcons, serviceLabels, serviceColors } from '../services/ServiceCard';
import StatusBadge from '../common/StatusBadge';

export default function RequestCard({ request, onClick, showWorker = false, onDelete = null }) {
  const Icon = serviceIcons[request.service_type] || Briefcase;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -4 }}
      whileTap={{ scale: 0.99 }}
      className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl hover:border-orange-500/30 hover:bg-white/10 transition-all overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onClick}>
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${serviceColors[request.service_type]} flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow`}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">{request.title}</h3>
              <p className="text-sm text-slate-400">{serviceLabels[request.service_type]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            {onDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this request?')) {
                    onDelete();
                  }
                }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 rounded-xl px-3 py-2">
            <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="truncate">{request.location}</span>
          </div>

          {request.preferred_date && (
            <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span className="truncate">{format(new Date(request.preferred_date), 'MMM d, yyyy')}</span>
            </div>
          )}

          {request.budget && (
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-400 bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-500/20">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>${request.budget}</span>
            </div>
          )}

          {showWorker && request.worker_name && (
            <div className="flex items-center gap-2 text-sm text-white bg-white/10 rounded-xl px-3 py-2">
              <User className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span className="truncate">{request.worker_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}