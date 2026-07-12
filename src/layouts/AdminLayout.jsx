import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '../constants';
import { classNames } from '../utils';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import FloatingAI from '../components/FloatingAI';
import NotificationToast from '../components/NotificationToast';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, removeNotification } = useNotification();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    if (showNotifDropdown || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifDropdown, showUserMenu]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm border-b border-outline-variant flex justify-between items-center px-gutter h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-on-surface-variant">menu</span>
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
          <span className="material-symbols-outlined text-primary text-headline-md">broadcast_on_home</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">XPAC Admin</h1>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-3 relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-200 relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-error text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
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
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors"
              aria-label="User menu"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              {!sidebarCollapsed && (
                <span className="hidden md:block font-body-md text-body-md text-on-surface truncate max-w-[150px]">
                  {user?.name || 'Admin User'}
                </span>
              )}
              <span className="material-symbols-outlined text-on-surface-variant hidden md:inline">expand_more</span>
            </button>
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl z-[100] overflow-hidden animate-pop-in">
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="font-body-md text-body-md text-on-surface">{user?.name || 'Admin User'}</p>
                  <p className="font-label-md text-label-md text-outline truncate">{user?.email || 'admin@xpac.io'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left font-body-md text-body-md text-error hover:bg-surface-container-high transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={classNames(
        'fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col',
        'bg-surface-container-low border-r border-outline-variant',
        sidebarCollapsed ? 'w-16' : 'w-64',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="px-lg pt-20 pb-md flex flex-col items-start">
          <div className="flex items-center gap-3 mb-4 w-full">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-title-lg text-title-lg text-primary leading-tight truncate">Admin</p>
                <p className="font-label-md text-label-md text-outline truncate">System Administrator</p>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 px-sm">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/admin/campaigns' && location.pathname.startsWith('/admin/campaigns')) ||
              (item.path === '/admin/users' && location.pathname.startsWith('/admin/users')) ||
              (item.path === '/admin/support' && location.pathname.startsWith('/admin/support'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={classNames(
                  'flex items-center gap-3 px-md py-3 rounded-lg transition-all duration-200 group mb-1',
                  sidebarCollapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                )}
                onClick={() => setMobileSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="material-symbols-outlined flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="font-body-md text-body-md">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-lg pb-lg pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">{user?.name || 'Admin User'}</p>
                <p className="font-label-md text-label-md text-outline truncate">{user?.email || 'admin@xpac.io'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={classNames(
        'pt-24 pb-20 min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64',
        mobileSidebarOpen ? 'md:pl-64' : ''
      )}>
        <div className="max-w-[1440px] mx-auto py-lg px-margin-mobile md:px-gutter animate-fade-in" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <FloatingAI />
      <NotificationToast />
    </div>
  );
}