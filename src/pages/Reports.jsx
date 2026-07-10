import { useState, useEffect } from 'react';
import { getCampaigns, getOrders } from '../services/api';

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
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Reports</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Overview of your campaign performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
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
            { label: 'Completed', count: completed, total: orders.length, color: 'bg-green-500' },
            { label: 'Running', count: running, total: orders.length, color: 'bg-blue-500' },
            { label: 'Failed', count: failed, total: orders.length, color: 'bg-red-500' },
            { label: 'Other', count: orders.length - completed - running - failed, total: orders.length, color: 'bg-surface-container-highest' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <span className="w-24 font-label-md text-label-md text-on-surface-variant">{item.label}</span>
              <div className="flex-1 h-6 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
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
                <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${
                  order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  order.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'Failed' ? 'bg-red-100 text-red-700' :
                  'bg-surface-container-highest text-on-surface-variant'
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