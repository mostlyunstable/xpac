export default function AnalyticsCard({ data, onAction }) {
  if (!data) return null;

  const stats = [
    { label: 'Total Orders', value: data.totalOrders || 0, icon: 'shopping_cart', color: 'text-primary' },
    { label: 'Total Contacts', value: (data.totalContacts || 0).toLocaleString(), icon: 'groups', color: 'text-secondary' },
    { label: 'Completed', value: data.completed || 0, icon: 'check_circle', color: 'text-green-600' },
    { label: 'Failed', value: data.failed || 0, icon: 'error', color: 'text-red-600' },
  ];

  const successRate = data.totalOrders > 0
    ? ((data.completed / data.totalOrders) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden my-2 max-w-sm">
      <div className="px-4 py-3 bg-surface-container border-b border-outline-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-tertiary text-lg">analytics</span>
        <span className="font-label-md text-label-md text-on-surface-variant">Analytics Summary</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-surface-container-low rounded-lg">
              <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
              <p className="font-title-lg text-title-lg text-on-surface mt-1">{stat.value}</p>
              <p className="font-label-md text-label-md text-outline">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="p-3 bg-primary-fixed rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-primary-fixed-variant">Success Rate</span>
            <span className="font-title-lg text-title-lg text-primary">{successRate}%</span>
          </div>
          <div className="w-full h-2 bg-primary-container/30 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {onAction && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction('view_analytics')}
              className="flex-1 px-3 py-2 bg-primary text-white rounded-lg font-label-md text-xs hover:shadow-md active:scale-95 transition-all"
            >
              Full Analytics
            </button>
            <button
              onClick={() => onAction('download_report')}
              className="px-3 py-2 border border-primary text-primary rounded-lg font-label-md text-xs hover:bg-primary-fixed transition-all"
            >
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
