import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, MapPin, DollarSign, FileText, Save, 
  CheckCircle, ArrowLeft, Clock, Wallet, ExternalLink, Trash2, AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { serviceIcons, serviceLabels, serviceColors } from '@/components/services/ServiceCard';
import { Link } from 'react-router-dom';

const services = [
  'blade_sharpener', 'dj', 'masseuse', 'power_washer', 'dog_walker',
  'handyman', 'cleaner', 'photographer', 'tutor', 'personal_trainer',
  'snow_plowing', 'lawn_mowing', 'other'
];

export default function WorkerProfile() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    services_offered: [],
    service_area: '',
    is_available: true
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ['worker-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ user_email: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: stripeStatus, refetch: refetchStripeStatus } = useQuery({
    queryKey: ['stripe-status', user?.email],
    queryFn: async () => {
      const res = await fetch('/api/check-stripe-account-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.json();
    },
    enabled: !!existingProfile?.stripe_account_id
  });

  const [connectingStripe, setConnectingStripe] = useState(false);

  const handleStripeConnect = async () => {
    setConnectingStripe(true);
    try {
      const res = await fetch('/api/create-stripe-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (error) {
      toast.error('Failed to connect Stripe');
      setConnectingStripe(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      refetchStripeStatus();
      toast.success('Stripe account connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('refresh') === 'true') {
      toast.error('Please complete your Stripe onboarding');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchStripeStatus]);

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        display_name: existingProfile.display_name || '',
        bio: existingProfile.bio || '',
        services_offered: existingProfile.services_offered || [],
        service_area: existingProfile.service_area || '',
        is_available: existingProfile.is_available ?? true
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        display_name: user.full_name || ''
      }));
    }
  }, [existingProfile, user]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (existingProfile) {
        await base44.entities.WorkerProfile.delete(existingProfile.id);
      }
    },
    onSuccess: () => {
      toast.success('Worker profile deleted. Logging out...');
      setTimeout(() => base44.auth.logout(), 1500);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        return base44.entities.WorkerProfile.update(existingProfile.id, data);
      } else {
        return base44.entities.WorkerProfile.create({
          ...data,
          user_email: user.email,
          is_approved: false
        });
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
      if (existingProfile) {
        toast.success('Profile updated successfully!');
      } else {
        toast.success('Profile created! Awaiting admin approval.');
      }
      navigate(createPageUrl('WorkerDashboard'));
    }
  });

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(service)
        ? prev.services_offered.filter(s => s !== service)
        : [...prev.services_offered, service]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl('WorkerDashboard')}>
            <Button variant="ghost" className="mb-6 -ml-2 text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <User className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {existingProfile ? 'Edit Profile' : 'Create Your Profile'}
              </h1>
              <p className="text-slate-500">Set up your worker profile to receive gigs</p>
              {existingProfile && !existingProfile.is_approved && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 font-medium">Pending admin approval</span>
                </div>
              )}
              {existingProfile && existingProfile.is_approved && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 font-medium">Approved worker</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                Basic Information
              </h2>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  placeholder="Your name"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell customers about yourself and your experience..."
                  className="min-h-[100px] rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_area" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Service Area
                </Label>
                <Input
                  id="service_area"
                  value={formData.service_area}
                  onChange={(e) => setFormData({...formData, service_area: e.target.value})}
                  placeholder="e.g., Los Angeles"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Available for Work</p>
                  <p className="text-sm text-slate-500">Toggle off to stop receiving new gigs</p>
                </div>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                />
              </div>
            </div>

            {/* Stripe Connect */}
            {existingProfile && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-slate-400" />
                  Payment Setup
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Connect your Stripe account to receive payments
                </p>

                {stripeStatus?.onboarding_complete ? (
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-900">Stripe Connected</p>
                        <p className="text-sm text-emerald-600">Ready to receive payments</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleStripeConnect}
                    disabled={connectingStripe}
                    className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {connectingStripe ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Connect Stripe Account
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Services */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-400" />
                Services You Offer
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Select all services you can provide
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map(service => {
                  const Icon = serviceIcons[service];
                  const isSelected = formData.services_offered.includes(service);

                  return (
                    <motion.button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${serviceColors[service]} flex items-center justify-center mb-2`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {serviceLabels[service]}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={saveMutation.isPending || formData.services_offered.length === 0}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 select-none"
            >
              {saveMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Profile
                </div>
              )}
            </Button>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Deleting your worker profile is permanent. You will be logged out and your profile will be removed.
            </p>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 select-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Worker Profile
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => deleteAccountMutation.mutate()}
                  disabled={deleteAccountMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white select-none"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="select-none"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}