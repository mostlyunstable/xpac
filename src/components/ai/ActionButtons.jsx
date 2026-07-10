import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { getOrders } from '../../services/api';

const ACTION_MAP = {
  view_order: (data, navigate) => navigate(`/orders/${data}`),
  track_order: (data, navigate) => navigate(`/orders/${data}`),
  view_campaign: (data, navigate) => navigate('/campaigns'),
  view_analytics: (data, navigate) => navigate('/analytics'),
  view_reports: (data, navigate) => navigate('/reports'),
  view_settings: (data, navigate) => navigate('/settings'),
  clone_campaign: (data, navigate) => navigate('/campaigns'),
  launch_campaign: (data, navigate) => navigate('/campaigns'),
};

function downloadReport(success, error) {
  getOrders({ limit: 100 }).then(data => {
    const orders = data.orders || [];
    const headers = ['Order ID', 'Campaign', 'Status', 'Contacts', 'Cost', 'Created'];
    const rows = orders.map(o => [o.id, o.campaignName || '', o.status, o.contactCount || 0, o.estimatedCost || '0.00', o.createdAt]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpac-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success('Report downloaded!');
  }).catch(() => error('Failed to download report'));
}

export default function ActionButtons({ actions }) {
  const navigate = useNavigate();
  const { success, error } = useNotification();

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => {
            if (action.type === 'download_report') {
              downloadReport(success, error);
            } else {
              const handler = ACTION_MAP[action.type];
              if (handler) handler(action.data, navigate);
            }
          }}
          className="px-3 py-1.5 bg-primary-fixed text-primary rounded-full font-label-md text-xs hover:bg-primary-fixed-dim transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{action.icon || 'arrow_forward'}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
