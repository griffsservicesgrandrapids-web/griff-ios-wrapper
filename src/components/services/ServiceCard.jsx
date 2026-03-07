import React from 'react';
import { motion } from 'framer-motion';
import { 
  Scissors, Music, Hand, Droplets, Dog, Wrench, 
  SprayCan, Camera, GraduationCap, Dumbbell, Snowflake, Sprout, Plus 
} from 'lucide-react';

const serviceIcons = {
  blade_sharpener: Scissors,
  dj: Music,
  masseuse: Hand,
  power_washer: Droplets,
  dog_walker: Dog,
  handyman: Wrench,
  cleaner: SprayCan,
  photographer: Camera,
  tutor: GraduationCap,
  personal_trainer: Dumbbell,
  snow_plowing: Snowflake,
  lawn_mowing: Sprout,
  custom: Plus,
  other: Plus
};

const serviceColors = {
  blade_sharpener: 'from-black to-black',
  dj: 'from-black to-black',
  masseuse: 'from-black to-black',
  power_washer: 'from-black to-black',
  dog_walker: 'from-black to-black',
  handyman: 'from-black to-black',
  cleaner: 'from-black to-black',
  photographer: 'from-black to-black',
  tutor: 'from-black to-black',
  personal_trainer: 'from-black to-black',
  snow_plowing: 'from-black to-black',
  lawn_mowing: 'from-black to-black',
  custom: 'from-orange-500 to-orange-600',
  other: 'from-slate-500 to-slate-600'
};

const serviceLabels = {
  blade_sharpener: 'Blade Sharpener',
  dj: 'DJ',
  masseuse: 'Masseuse',
  power_washer: 'Power Washer',
  dog_walker: 'Dog Walker',
  handyman: 'Handyman',
  cleaner: 'Cleaner',
  photographer: 'Photographer',
  tutor: 'Tutor',
  personal_trainer: 'Personal Trainer',
  snow_plowing: 'Snow Plowing',
  lawn_mowing: 'Lawn Mowing',
  custom: 'Custom Request',
  other: 'Other'
};

export { serviceIcons, serviceColors, serviceLabels };

export default function ServiceCard({ service, onClick, selected }) {
  const Icon = serviceIcons[service];
  
  return (
    <motion.button
      onClick={() => onClick(service)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-2xl p-6 text-left w-full
        transition-all duration-300 group
        ${selected 
          ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900 shadow-xl' 
          : 'shadow-md hover:shadow-xl'
        }
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${serviceColors[service]} opacity-90`} />
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-orange-500/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          {serviceLabels[service]}
        </h3>
        <p className="text-sm text-white/70">
          Book now →
        </p>
      </div>
    </motion.button>
  );
}