import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

/**
 * Drop-in replacement for shadcn Select that uses a bottom-sheet drawer on mobile.
 * Props: value, onValueChange, placeholder, options: [{value, label}], className (for trigger), triggerClassName
 */
export default function MobileSelect({ value, onValueChange, placeholder, options = [], triggerClassName = '', children }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-left select-none ${triggerClassName}`}
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <span className="font-semibold text-slate-900">{placeholder || 'Select an option'}</span>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 select-none">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="h-px bg-slate-100 mx-4 mb-2" />
              <div className="overflow-y-auto max-h-72 pb-2">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onValueChange(opt.value); setOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-4 text-sm select-none transition-colors ${
                      opt.value === value ? 'text-orange-600 font-medium bg-orange-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                    {opt.value === value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}