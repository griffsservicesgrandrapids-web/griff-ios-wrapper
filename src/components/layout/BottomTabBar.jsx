import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ClipboardList, Briefcase, Settings, Shield } from 'lucide-react';

const customerTabs = [
  { name: 'Home', page: 'Home', pages: ['Home'], icon: Home },
  { name: 'Requests', page: 'MyRequests', pages: ['MyRequests'], icon: ClipboardList },
  { name: 'Worker', page: 'WorkerDashboard', pages: ['WorkerDashboard', 'WorkerProfile'], icon: Briefcase },
  { name: 'Settings', page: 'AccountSettings', pages: ['AccountSettings'], icon: Settings },
];

const adminTabs = [
  { name: 'Home', page: 'Home', pages: ['Home'], icon: Home },
  { name: 'Requests', page: 'MyRequests', pages: ['MyRequests'], icon: ClipboardList },
  { name: 'Worker', page: 'WorkerDashboard', pages: ['WorkerDashboard', 'WorkerProfile'], icon: Briefcase },
  { name: 'Admin', page: 'AdminDashboard', pages: ['AdminDashboard'], icon: Shield },
  { name: 'Settings', page: 'AccountSettings', pages: ['AccountSettings'], icon: Settings },
];

// Preserve scroll position per tab
const scrollPositions = {};

export default function BottomTabBar({ currentPageName, user }) {
  const tabs = user?.role === 'admin' ? adminTabs : customerTabs;
  const navigate = useNavigate();

  const handleTabPress = (tab) => {
    const isActive = tab.pages.includes(currentPageName);

    // Save current scroll before leaving
    scrollPositions[currentPageName] = window.scrollY;

    if (isActive) {
      // Re-selecting active tab: reset to root (clear any search params/modals)
      navigate(createPageUrl(tab.page), { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(createPageUrl(tab.page));
      // Restore scroll position for the target tab
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositions[tab.page] || 0, behavior: 'instant' });
        });
      });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(tab => {
        const isActive = tab.pages.includes(currentPageName);
        const Icon = tab.icon;
        return (
          <button
            key={tab.page}
            onClick={() => handleTabPress(tab)}
            style={{ minHeight: 44 }}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors select-none relative ${
              isActive ? 'text-orange-500' : 'text-slate-400'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-orange-500" />
            )}
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );
}