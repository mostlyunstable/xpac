import { formatDateTime } from '../../utils';

const STATUS_STYLES = {
  Completed: 'bg-green-100 text-green-700',
  Running: 'bg-blue-100 text-blue-700',
  Processing: 'bg-yellow-100 text-yellow-700',
  Queued: 'bg-purple-100 text-purple-700',
  Failed: 'bg-red-100 text-red-700',
  Created: 'bg-surface-container-highest text-on-surface-variant',
  Cancelled: 'bg-gray-100 text-gray-500',
};

export default function OrderCard({ data, onAction }) {
  if (!data) return null;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden my-2 max-w-sm">
      <div className="px-4 py-3 bg-surface-container border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
          <span className="font-label-md text-label-md text-on-surface-variant">Order</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-label-md text-xs ${STATUS_STYLES[data.status] || STATUS_STYLES.Created}`}>
          {data.status}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-body-md text-body-md font-bold text-primary">{data.id}</span>
          <span className="font-label-md text-label-md text-outline">{formatDateTime(data.createdAt)}</span>
        </div>
        <p className="font-body-md text-body-md text-on-surface">{data.campaignName || 'Untitled Campaign'}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-surface-container-low rounded-lg">
            <p className="font-title-lg text-title-lg text-on-surface">{data.contactCount || 0}</p>
            <p className="font-label-md text-label-md text-outline">Contacts</p>
          </div>
          <div className="text-center p-2 bg-surface-container-low rounded-lg">
            <p className="font-title-lg text-title-lg text-on-surface">${data.estimatedCost || '0.00'}</p>
            <p className="font-label-md text-label-md text-outline">Cost</p>
          </div>
          <div className="text-center p-2 bg-surface-container-low rounded-lg">
            <p className="font-title-lg text-title-lg text-on-surface">{data.estimatedDuration || '—'}</p>
            <p className="font-label-md text-label-md text-outline">Duration</p>
          </div>
        </div>
        {onAction && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAction('view_order', data.id)}
              className="flex-1 px-3 py-2 bg-primary text-white rounded-lg font-label-md text-xs hover:shadow-md active:scale-95 transition-all"
            >
              View Details
            </button>
            <button
              onClick={() => onAction('track_order', data.id)}
              className="px-3 py-2 border border-primary text-primary rounded-lg font-label-md text-xs hover:bg-primary-fixed transition-all"
            >
              Track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
