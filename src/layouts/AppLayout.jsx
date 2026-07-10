import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { classNames } from '../utils';
import { useNotification } from '../contexts/NotificationContext';
import FloatingAI from '../components/FloatingAI';
import NotificationToast from '../components/NotificationToast';

export default function AppLayout() {
  const location = useLocation();
  const { notifications, removeNotification } = useNotification();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    }
    if (showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifDropdown]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm border-b border-outline-variant flex justify-between items-center px-gutter h-16">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-headline-md">clinical_notes</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">XPAC</h1>
        </div>
        <div className="flex items-center gap-md relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-200 relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            {notifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-error text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {showNotifDropdown && (
            <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl z-[100] overflow-hidden animate-pop-in">
              <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                <span className="font-title-lg text-title-lg text-on-surface">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => { notifications.forEach(n => removeNotification(n.id)); setShowNotifDropdown(false); }}
                    className="font-label-md text-label-md text-primary hover:text-on-primary-fixed transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <span className="material-symbols-outlined text-3xl text-outline mb-2">notifications_off</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">No notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors flex items-start gap-3">
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${
                        n.type === 'success' ? 'text-green-600' :
                        n.type === 'error' ? 'text-red-600' :
                        n.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'info'}
                      </span>
                      <p className="flex-1 font-body-md text-body-md text-on-surface">{n.message}</p>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-outline">close</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">
            EA
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-0 h-full w-64 z-40 hidden md:flex flex-col py-lg space-y-sm bg-surface-container-low border-r border-outline-variant">
        <div className="px-lg pt-20 pb-md flex flex-col items-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <div>
              <p className="font-title-lg text-title-lg text-primary leading-tight">Admin</p>
              <p className="font-label-md text-label-md text-outline">v1.0.0</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/campaigns' && location.pathname.startsWith('/campaign'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={classNames(
                  'flex items-center gap-3 px-md py-3 rounded-lg transition-all duration-200 group mb-1',
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="pt-24 pb-20 md:pb-8 md:pl-72 px-margin-mobile md:px-gutter min-h-screen">
        <div className="max-w-[1440px] mx-auto py-lg animate-fade-in" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <FloatingAI />
      <NotificationToast />

      <nav className="fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant shadow-lg flex justify-around items-center h-16 pb-safe md:hidden overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/campaigns' && location.pathname.startsWith('/campaign'));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={classNames(
                'flex flex-col items-center justify-center px-3 py-1',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container rounded-xl'
                  : 'text-on-surface-variant'
              )}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
