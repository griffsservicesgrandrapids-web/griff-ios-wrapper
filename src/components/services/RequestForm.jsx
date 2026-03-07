import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MobileSelect from "@/components/ui/MobileSelect";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Clock, DollarSign, X, Send, Plus } from "lucide-react";
import { serviceLabels, serviceIcons, serviceColors } from './ServiceCard';

const timeSlots = [
  "Morning (8am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 9pm)",
  "Flexible"
];

const servicePlaceholders = {
  blade_sharpener: 'e.g., Sharpen kitchen knives',
  dj: 'e.g., Wedding reception, birthday party',
  masseuse: 'e.g., Deep tissue massage, relaxation',
  power_washer: 'e.g., Clean driveway and patio',
  dog_walker: 'e.g., Daily walk for my labrador',
  handyman: 'e.g., Fix leaky faucet, install shelves',
  cleaner: 'e.g., Deep clean 3-bedroom house',
  photographer: 'e.g., Family portrait session',
  tutor: 'e.g., Math tutoring for high school',
  personal_trainer: 'e.g., Weight loss program, strength training',
  snow_plowing: 'e.g., Clear driveway and walkway',
  lawn_mowing: 'e.g., Mow front and back yard',
  custom: 'e.g., Paint my fence'
};

export default function RequestForm({ service, onSubmit, onClose, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    preferred_date: null,
    preferred_time: ''
  });

  const Icon = serviceIcons[service] || Plus;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      service_type: service,
      preferred_date: formData.preferred_date ? format(formData.preferred_date, 'yyyy-MM-dd') : null
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={`bg-gradient-to-br ${serviceColors[service]} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Request {serviceLabels[service]}
          </h2>
          <p className="text-white/70 mt-1">Fill in the details below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              {service === 'custom' ? 'What service do you need?' : 'What do you need?'}
            </Label>
            <Input
              id="title"
              placeholder={servicePlaceholders[service] || 'e.g., Describe what you need'}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Additional details {service === 'custom' ? '(required)' : '(optional)'}
            </Label>
            <Textarea
              id="description"
              placeholder={service === 'custom' ? 'Describe in detail what you need...' : 'Any specific requirements...'}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="min-h-[80px] rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              required={service === 'custom'}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Location
            </Label>
            <Input
              placeholder="Your address"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                Preferred Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-200 justify-start text-left font-normal"
                  >
                    {formData.preferred_date 
                      ? format(formData.preferred_date, "MMM d, yyyy")
                      : "Pick a date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.preferred_date}
                    onSelect={(date) => setFormData({...formData, preferred_date: date})}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Time Slot
              </Label>
              <MobileSelect
                value={formData.preferred_time}
                onValueChange={(value) => setFormData({...formData, preferred_time: value})}
                placeholder="Select time"
                options={timeSlots.map(slot => ({ value: slot, label: slot }))}
                triggerClassName="h-12 rounded-xl border-slate-200"
              />
            </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-900 text-center">
                💡 Griff's Services will fix a locally competitive price to your job, as soon as we can!
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-orange-500/25 transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Request
                </div>
              )}
            </Button>
            </form>
      </motion.div>
    </motion.div>
  );
}