import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function NotificationPrompt({ userEmail }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!('Notification' in window)) return;
      
      const permission = Notification.permission;
      
      if (permission === 'default') {
        const dismissed = localStorage.getItem('notification_dismissed');
        if (!dismissed) {
          setTimeout(() => setShow(true), 3000);
        }
      }
    };
    
    checkPermission();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        await base44.entities.PushSubscription.create({
          user_email: userEmail,
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          user_agent: navigator.userAgent,
          is_active: true
        });

        setShow(false);
      }
    } catch (error) {
      console.error('Notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_dismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Stay Updated
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Get notified about new gigs, status updates, and more
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleEnable}
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? 'Enabling...' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-slate-600"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}