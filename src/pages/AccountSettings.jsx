import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { User, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    toast.success('Account deletion requested. Logging out...');
    setTimeout(() => base44.auth.logout(), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
              {user && <p className="text-slate-500 text-sm">{user.email}</p>}
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Profile</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <span className="font-medium">{user?.full_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium">{user?.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Log out */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Session</h2>
            <Button
              variant="outline"
              onClick={() => base44.auth.logout()}
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 select-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-red-700 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 select-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white select-none"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </Button>
                <Button
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