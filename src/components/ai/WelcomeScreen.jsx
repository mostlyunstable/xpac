import { useAI } from '../../contexts/AIContext';

const CAPABILITIES = [
  { icon: 'shopping_cart', label: 'Orders', color: 'text-primary' },
  { icon: 'campaign', label: 'Campaigns', color: 'text-secondary' },
  { icon: 'bar_chart', label: 'Analytics', color: 'text-tertiary' },
  { icon: 'assessment', label: 'Reports', color: 'text-primary' },
  { icon: 'settings', label: 'Settings', color: 'text-on-surface-variant' },
  { icon: 'payments', label: 'Billing', color: 'text-secondary' },
  { icon: 'smart_toy', label: 'AI Calling', color: 'text-primary' },
];

const SUGGESTIONS = [
  'Where is my latest order?',
  'Create a new campaign',
  'Show completed campaigns',
  'Show failed calls',
  'Download latest report',
  "Today's analytics",
];

export default function WelcomeScreen() {
  const { sendMessage } = useAI();

  return (
    <div className="flex flex-col items-center justify-center h-full px-lg py-xl text-center">
      <div className="text-5xl mb-lg">👋</div>
      <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Hi there!</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
        I'm your <strong className="text-primary">XPAC AI Assistant</strong>.<br />
        I can help you with:
      </p>

      <div className="grid grid-cols-4 gap-md mb-xl w-full max-w-xs">
        {CAPABILITIES.map((cap) => (
          <div key={cap.label} className="flex flex-col items-center gap-1">
            <span className={`material-symbols-outlined text-2xl ${cap.color}`}>{cap.icon}</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{cap.label}</span>
          </div>
        ))}
      </div>

      <div className="w-full space-y-2">
        <p className="font-label-md text-label-md text-outline uppercase tracking-widest mb-3">Try asking</p>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="w-full px-4 py-3 text-left bg-surface-container-low rounded-xl border border-outline-variant hover:border-primary hover:bg-primary-fixed transition-all duration-200 font-body-md text-body-md text-on-surface group"
          >
            <span className="text-primary mr-2 group-hover:scale-110 inline-block transition-transform">→</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
