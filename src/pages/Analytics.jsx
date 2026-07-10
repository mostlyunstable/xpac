import { useState, useEffect } from 'react';
import { getCampaigns, getOrders } from '../services/api';

export default function Analytics() {
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

  const totalContacts = orders.reduce((sum, o) => sum + (o.contactCount || 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + parseFloat(o.estimatedCost || 0), 0);
  const avgCost = orders.length > 0 ? (totalCost / orders.length).toFixed(2) : '0.00';

  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { weekday: 'short' });
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayStr = `${year}-${month}-${day}`;
    const count = orders.filter(o => {
      const d = new Date(o.createdAt);
      const orderDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return orderDay === dayStr;
    }).length;
    dailyData.push({ label, count });
  }
  const maxCount = Math.max(...dailyData.map(d => d.count), 1);

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
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Analytics</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Detailed metrics and performance analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
        {[
          { label: 'Total Contacts Reached', value: totalContacts.toLocaleString(), icon: 'groups', color: 'text-primary' },
          { label: 'Total Spend', value: `$${totalCost.toFixed(2)}`, icon: 'payments', color: 'text-secondary' },
          { label: 'Avg Cost/Campaign', value: `$${avgCost}`, icon: 'receipt_long', color: 'text-tertiary' },
          { label: 'Success Rate', value: orders.length > 0 ? `${((orders.filter(o => o.status === 'Completed').length / orders.length) * 100).toFixed(0)}%` : '0%', icon: 'percent', color: 'text-primary' },
        ].map((metric) => (
          <div key={metric.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <span className={`material-symbols-outlined ${metric.color} mb-2 block`}>{metric.icon}</span>
            <p className="font-display text-display text-on-surface">{metric.value}</p>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Weekly Campaign Activity</h2>
        <div className="flex items-end gap-3 h-48">
          {dailyData.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant">{d.count}</span>
              <div
                className="w-full bg-primary rounded-t-lg transition-all duration-500"
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
              />
              <span className="font-label-md text-label-md text-outline">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
          <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Campaigns by Status</h2>
          <div className="space-y-md">
            {['Created', 'Processing', 'Running', 'Completed', 'Failed'].map((status) => {
              const count = campaigns.filter(c => c.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="font-body-md text-body-md text-on-surface-variant">{status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: campaigns.length > 0 ? `${(count / campaigns.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="font-body-md text-body-md text-on-surface font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
          <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Top Campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="text-center py-xl">
              <p className="font-body-md text-body-md text-on-surface-variant">No campaign data yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-label-md text-label-md text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface font-semibold">{c.campaignName || c.id}</p>
                    <p className="font-label-md text-label-md text-outline">{c.contactCount || 0} contacts</p>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface">${c.estimatedCost || '0.00'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}