import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonCard } from '../../components/Skeleton';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          setKpis(data.kpis || {});
          setRecentActivity(data.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const kpiCards = [
    { key: 'totalCustomers', label: 'Total Customers', icon: 'people', color: 'primary', trend: null },
    { key: 'activeCustomers', label: 'Active Customers', icon: 'person_check', color: 'primary', trend: null },
    { key: 'suspendedCustomers', label: 'Suspended', icon: 'person_off', color: 'error', trend: null },
    { key: 'totalCampaigns', label: 'Total Broadcasts', icon: 'campaign', color: 'secondary', trend: null },
    { key: 'activeCampaigns', label: 'In Progress', icon: 'play_arrow', color: 'tertiary', trend: null },
    { key: 'placedCampaigns', label: 'Placed', icon: 'schedule', color: 'secondary', trend: null },
    { key: 'completedCampaigns', label: 'Completed', icon: 'check_circle', color: 'primary', trend: null },
    { key: 'totalOrders', label: 'Total Orders', icon: 'shopping_cart', color: 'secondary', trend: null },
    { key: 'ordersToday', label: 'Orders Today', icon: 'today', color: 'tertiary', trend: null },
    { key: 'openTickets', label: 'Open Tickets', icon: 'support_agent', color: 'warning', trend: null },
    { key: 'staleOrders', label: 'Stale Orders (>24h)', icon: 'warning', color: 'error', trend: null },
    { key: 'slaTickets', label: 'SLA Tickets', icon: 'timer', color: 'error', trend: null },
  ];

  const colors = {
    primary: { bg: 'bg-primary-fixed', text: 'text-primary' },
    secondary: { bg: 'bg-secondary-fixed', text: 'text-secondary' },
    tertiary: { bg: 'bg-tertiary-fixed', text: 'text-tertiary' },
    error: { bg: 'bg-error-container', text: 'text-error' },
    warning: { bg: 'bg-tertiary-fixed', text: 'text-tertiary' },
  };

  if (loading) {
    return (
      <div className="space-y-xl">
        <div>
          <div className="h-8 w-48 bg-surface-container-highest rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-surface-container-highest rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="animate-fade-in">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Admin Dashboard</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">System-wide operational overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        {kpiCards.map((cfg, index) => {
          const value = kpis[cfg.key] ?? 0;
          const color = colors[cfg.color] || colors.primary;

          return (
            <div key={cfg.key} className="animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-md">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.bg}`}>
                    <span className={`material-symbols-outlined ${color.text}`}>{cfg.icon}</span>
                  </div>
                  {cfg.trend && (
                    <span className={`font-label-md text-label-md flex items-center gap-1 ${cfg.trend.up ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="material-symbols-outlined text-lg">{cfg.trend.up ? 'trending_up' : 'trending_down'}</span>
                      {cfg.trend.value}
                    </span>
                  )}
                </div>
                <p className="font-display text-display text-on-surface">{value.toLocaleString()}</p>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-title-lg text-title-lg text-on-surface">Attention Required</h2>
          </div>
          <div className="divide-y divide-outline-variant">
            {kpis.staleOrders > 0 && (
              <div className="px-lg py-md flex items-center gap-4 bg-error-container/50">
                <span className="material-symbols-outlined text-error">warning</span>
                <div>
                  <p className="font-body-md text-body-md font-semibold text-error">{kpis.staleOrders} Orders Stale ({'>'}24h)</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">Orders stuck in "Placed" status for more than 24 hours</p>
                </div>
                <Link to="/admin/campaigns" className="ml-auto px-4 py-2 font-body-md text-body-md bg-error text-white rounded-lg hover:shadow-md transition-all">
                  Review
                </Link>
              </div>
            )}
            {kpis.slaTickets > 0 && (
              <div className="px-lg py-md flex items-center gap-4 bg-tertiary-container/50">
                <span className="material-symbols-outlined text-tertiary">timer</span>
                <div>
                  <p className="font-body-md text-body-md font-semibold text-tertiary">{kpis.slaTickets} Tickets Near SLA Breach</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">Support tickets nearing response time limits</p>
                </div>
                <Link to="/admin/support" className="ml-auto px-4 py-2 font-body-md text-body-md bg-tertiary text-white rounded-lg hover:shadow-md transition-all">
                  Review
                </Link>
              </div>
            )}
            {kpis.staleOrders === 0 && kpis.slaTickets === 0 && (
              <div className="px-lg py-xl text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">check_circle</span>
                <p className="font-body-md text-body-md text-on-surface-variant">All clear — no urgent items</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-title-lg text-title-lg text-on-surface">Recent System Activity</h2>
          </div>
          <div className="divide-y divide-outline-variant max-h-64 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="px-lg py-xl text-center">
                <span className="material-symbols-outlined text-3xl text-outline mb-2">history</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="px-lg py-md flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-lg mt-0.5 text-on-surface-variant">
                    {a.entity_type === 'user' ? 'person' : a.entity_type === 'campaign' ? 'campaign' : 'history'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-on-surface">
                      <span className="font-semibold">{a.userName || a.userEmail || 'System'}</span> {' '}
                      {a.action.replace(/_/g, ' ')}
                    </p>
                    <p className="font-label-md text-label-md text-outline">
                      {a.entity_type} {a.entityId ? `#${a.entityId}` : ''} · {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}