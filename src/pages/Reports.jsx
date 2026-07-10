import { useState, useEffect } from 'react';
import { getCampaigns, getOrders } from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

const REPORT_COLORS = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  error: 'text-error',
};

export default function Reports() {
  const [campaigns, setCampaigns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [c, o] = await Promise.all([getCampaigns(), getOrders({ limit: 100 })]);
        setCampaigns(c);
        setOrders(o.orders || []);
      } catch { /* API may not be running */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const completed = orders.filter(o => o.status === 'Completed').length;
  const failed = orders.filter(o => o.status === 'Failed').length;
  const running = orders.filter(o => o.status === 'Running' || o.status === 'Processing').length;
  const other = orders.filter(o => !['Completed', 'Failed', 'Running', 'Processing'].includes(o.status)).length;
  const totalContacts = orders.reduce((sum, o) => sum + (o.contactCount || 0), 0);

  const stats = [
    { label: 'Total Campaigns', value: campaigns.length, icon: 'campaign', color: 'primary' },
    { label: 'Total Orders', value: orders.length, icon: 'shopping_cart', color: 'secondary' },
    { label: 'Completed', value: completed, icon: 'check_circle', color: 'primary' },
    { label: 'Failed', value: failed, icon: 'error', color: 'error' },
    { label: 'Running', value: running, icon: 'play_arrow', color: 'tertiary' },
    { label: 'Queued/Other', value: other, icon: 'schedule', color: 'secondary' },
  ];

  if (loading) {
    return (
      <div className="space-y-xl">
        <div>
          <div className="h-8 w-48 bg-surface-container-highest rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-surface-container-highest rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
          <div className="h-6 w-56 bg-surface-container-highest rounded-lg animate-pulse mb-lg" />
          <div className="space-y-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 h-4 bg-surface-container-highest rounded animate-pulse" />
                <div className="flex-1 h-6 bg-surface-container-highest rounded-full animate-pulse" />
                <div className="w-16 h-4 bg-surface-container-highest rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="animate-fade-in">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Reports</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Overview of your campaign performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
        {stats.map((stat, index) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center gap-3 mb-md">
              <span className={`material-symbols-outlined ${REPORT_COLORS[stat.color] || 'text-primary'}`}>{stat.icon}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">{stat.label}</span>
            </div>
            <p className="font-display text-display text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Order Status Distribution</h2>
        <div className="space-y-md">
          {[
            { label: 'Completed', count: completed, total: orders.length },
            { label: 'Running', count: running, total: orders.length },
            { label: 'Failed', count: failed, total: orders.length },
            { label: 'Other', count: orders.length - completed - running - failed, total: orders.length },
          ].map((item, index) => (
            <div key={item.label} className="flex items-center gap-4 animate-stagger" style={{ animationDelay: `${index * 60}ms` }}>
              <span className="w-24 font-label-md text-label-md text-on-surface-variant">{item.label}</span>
              <div className="flex-1 h-6 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.label === 'Completed' ? 'bg-green-500 dark:bg-green-400' :
                    item.label === 'Running' ? 'bg-blue-500 dark:bg-blue-400' :
                    item.label === 'Failed' ? 'bg-red-500 dark:bg-red-400' :
                    'bg-surface-dim'
                  }`}
                  style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="w-16 text-right font-body-md text-body-md text-on-surface font-semibold">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Recent Activity</h2>
        {orders.length === 0 ? (
          <div className="text-center py-xl">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">bar_chart</span>
            <p className="font-body-md text-body-md text-on-surface-variant">No data to display yet. Launch campaigns to see reports.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    order.status === 'Completed' ? 'bg-green-500' :
                    order.status === 'Running' ? 'bg-blue-500' :
                    order.status === 'Failed' ? 'bg-red-500' :
                    'bg-surface-container-highest'
                  }`} />
                  <div>
                    <p className="font-body-md text-body-md text-on-surface">{order.id}</p>
                    <p className="font-label-md text-label-md text-outline">{order.campaignName || 'Untitled'}</p>
                  </div>
                </div>
                <span className={`status-badge ${
                  order.status === 'Completed' ? 'status-completed' :
                  order.status === 'Running' ? 'status-running' :
                  order.status === 'Failed' ? 'status-failed' :
                  'status-queued'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}