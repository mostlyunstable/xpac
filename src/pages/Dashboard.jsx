import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCampaigns, getOrders } from '../services/api';
import { formatDate } from '../utils';
import { useWizard } from '../contexts/WizardContext';
import { SkeletonCard } from '../components/Skeleton';

const STAT_COLORS = {
  primary: { bg: 'bg-primary-fixed', text: 'text-primary' },
  secondary: { bg: 'bg-secondary-fixed', text: 'text-secondary' },
  tertiary: { bg: 'bg-tertiary-fixed', text: 'text-tertiary' },
  error: { bg: 'bg-error-container', text: 'text-error' },
};

function StatCard({ icon, label, value, trend, trendUp, color = 'primary' }) {
  const colors = STAT_COLORS[color] || STAT_COLORS.primary;
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-md">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
          <span className={`material-symbols-outlined ${colors.text}`}>{icon}</span>
        </div>
        {trend && (
          <span className={`font-label-md text-label-md flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <span className="material-symbols-outlined text-lg">{trendUp ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </span>
        )}
      </div>
      <p className="font-display text-display text-on-surface">{value}</p>
      <p className="font-label-md text-label-md text-on-surface-variant mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { reset, currentStep } = useWizard();

  function handleNewCampaign() {
    if (currentStep > 1) {
      if (!window.confirm('You have an in-progress campaign. Starting a new one will discard your progress. Continue?')) {
        return;
      }
    }
    reset();
    navigate('/campaigns');
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [campaignData, orderData] = await Promise.all([
          getCampaigns(),
          getOrders({ limit: 5 }),
        ]);
        setCampaigns(campaignData);
        setOrders(orderData.orders || []);
      } catch {
        // API might not be running, show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalCampaigns = campaigns.length;
  const totalOrders = orders.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'Running' || c.status === 'Processing').length;

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Dashboard</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Welcome back, Admin. Here's your overview.</p>
        </div>
        <button
          onClick={handleNewCampaign}
          className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            <StatCard icon="campaign" label="Total Campaigns" value={totalCampaigns} color="primary" />
            <StatCard icon="shopping_cart" label="Total Orders" value={totalOrders} color="secondary" />
            <StatCard icon="play_arrow" label="Active Campaigns" value={activeCampaigns} color="tertiary" />
            <StatCard icon="check_circle" label="Completed" value={campaigns.filter(c => c.status === 'Completed').length} color="primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
                <h2 className="font-title-lg text-title-lg text-on-surface">Recent Campaigns</h2>
                <Link to="/campaigns" className="font-label-md text-label-md text-primary hover:text-on-primary-fixed transition-colors">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-outline-variant">
                {campaigns.length === 0 ? (
                  <div className="p-xl text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">campaign</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">No campaigns yet</p>
                    <Link to="/campaigns" className="mt-2 inline-block font-label-md text-label-md text-primary hover:underline">
                      Create your first campaign
                    </Link>
                  </div>
                ) : (
                  campaigns.slice(0, 5).map((c) => (
                    <div key={c.id} className="px-lg py-md flex items-center justify-between hover:bg-surface-container-low transition-colors">
                      <div>
                        <p className="font-body-md text-body-md font-semibold text-on-surface">{c.campaignName || c.id}</p>
                        <p className="font-label-md text-label-md text-outline">{formatDate(c.createdAt)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${
                        c.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        c.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                        c.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
                <h2 className="font-title-lg text-title-lg text-on-surface">Recent Orders</h2>
                <Link to="/orders" className="font-label-md text-label-md text-primary hover:text-on-primary-fixed transition-colors">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-outline-variant">
                {orders.length === 0 ? (
                  <div className="p-xl text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">shopping_cart</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">No orders yet</p>
                    <Link to="/campaigns" className="mt-2 inline-block font-label-md text-label-md text-primary hover:underline">
                      Launch a campaign to create an order
                    </Link>
                  </div>
                ) : (
                  orders.map((o) => (
                    <Link key={o.id} to={`/orders/${o.id}`} className="px-lg py-md flex items-center justify-between hover:bg-surface-container-low transition-colors block">
                      <div>
                        <p className="font-body-md text-body-md font-semibold text-on-surface">{o.id}</p>
                        <p className="font-label-md text-label-md text-outline">{o.campaignName || 'Untitled'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${
                        o.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        o.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'Failed' ? 'bg-red-100 text-red-700' :
                        'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {o.status}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              {[
                { icon: 'add_circle', label: 'New Campaign', to: '/campaigns' },
                { icon: 'upload_file', label: 'Upload Contacts', to: '/campaigns' },
                { icon: 'assessment', label: 'View Reports', to: '/reports' },
                { icon: 'settings', label: 'Settings', to: '/settings' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-outline-variant hover:bg-surface-container-low hover:border-primary transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}