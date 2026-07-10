import { useNotification } from '../contexts/NotificationContext';
import { classNames } from '../utils';

const ICON_MAP = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const COLOR_MAP = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-sm" aria-live="polite" aria-atomic="false">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={classNames(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up',
            COLOR_MAP[n.type]
          )}
          role="alert"
        >
          <span className="material-symbols-outlined text-xl mt-0.5">{ICON_MAP[n.type]}</span>
          <p className="flex-1 font-body-md text-body-md">{n.message}</p>
          <button
            onClick={() => removeNotification(n.id)}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Dismiss notification"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
