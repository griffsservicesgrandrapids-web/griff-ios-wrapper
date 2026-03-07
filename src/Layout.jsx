import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Briefcase, ClipboardList, User, Menu, X, LogOut,
  Sparkles, Shield, ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import BottomTabBar from '@/components/layout/BottomTabBar';

// Pages that are "root" pages (show logo), vs child pages (show back button)
const ROOT_PAGES = ['Home', 'MyRequests', 'WorkerDashboard', 'AdminDashboard'];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Auto-detect system dark mode
  useEffect(() => {
    const applyTheme = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mq.matches);
    mq.addEventListener('change', (e) => applyTheme(e.matches));
    return () => mq.removeEventListener('change', () => {});
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});      
  }, []);

  const isWorkerPage = currentPageName === 'WorkerDashboard' || currentPageName === 'WorkerProfile';
  const isAdminPage = currentPageName === 'AdminDashboard';
  const isRootPage = ROOT_PAGES.includes(currentPageName);

  const customerNav = [
    { name: 'Home', page: 'Home', icon: Home },
    { name: 'My Requests', page: 'MyRequests', icon: ClipboardList },
  ];

  const workerNav = [
    { name: 'Dashboard', page: 'WorkerDashboard', icon: Briefcase },
    { name: 'Profile', page: 'WorkerProfile', icon: User },
  ];

  const adminNav = [
    { name: 'Admin', page: 'AdminDashboard', icon: Shield },
  ];

  const navigation = isAdminPage ? adminNav : isWorkerPage ? workerNav : customerNav;

  const hasBottomBar = !isAdminPage;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back button on child pages, Logo on root pages */}
            {!isRootPage ? (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors select-none"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium text-sm">Back</span>
              </button>
            ) : (
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 select-none">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900">Griff's Services</span>
              </Link>
            )}

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all select-none
                    ${currentPageName === item.page 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Admin Button */}
              {user?.role === 'admin' && !isAdminPage && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button
                    variant="outline"
                    className="hidden sm:flex rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 select-none"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}

              {/* Switch View Button */}
              {!isAdminPage && (
                <Link to={createPageUrl(isWorkerPage ? 'Home' : 'WorkerDashboard')}>
                  <Button
                    variant="outline"
                    className="hidden sm:flex rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 select-none"
                  >
                    {isWorkerPage ? (
                      <>
                        <Home className="w-4 h-4 mr-2" />
                        Customer View
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Worker View
                      </>
                    )}
                  </Button>
                </Link>
              )}

              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => base44.auth.logout()}
                  className="text-slate-500 hover:text-slate-700 select-none"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}

              {/* Mobile menu button - only on desktop-style pages */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden select-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu (desktop nav items only - bottom bar handles primary nav on mobile) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white"
            >
              <div className="px-4 py-4 space-y-2">
                <div className="pt-2 border-t border-slate-100">
                  {user?.role === 'admin' && !isAdminPage && (
                    <Link
                      to={createPageUrl('AdminDashboard')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-600 hover:bg-orange-50 select-none"
                    >
                      <Shield className="w-5 h-5" />
                      Admin Dashboard
                    </Link>
                  )}
                  {!isAdminPage && (
                    <Link
                      to={createPageUrl(isWorkerPage ? 'Home' : 'WorkerDashboard')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 select-none"
                    >
                      {isWorkerPage ? (
                        <>
                          <Home className="w-5 h-5" />
                          Switch to Customer
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-5 h-5" />
                          Switch to Worker
                        </>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content — add bottom padding on mobile to account for tab bar */}
      <main className={`pt-16 ${hasBottomBar ? 'pb-20 md:pb-0' : ''}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar (mobile only) */}
      <BottomTabBar currentPageName={currentPageName} user={user} />
    </div>
  );
}