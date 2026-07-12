import { useWizard } from '../contexts/WizardContext';

export default function BroadcastNameStep() {
  const { broadcastName, setBroadcastName } = useWizard();

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Broadcast Name</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Enter a name for this broadcast campaign. This is for your internal tracking.
        </p>
      </div>

      <div className="max-w-2xl">
        <label htmlFor="broadcast-name" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
          Broadcast Name <span className="text-error">*</span>
        </label>
        <input
          id="broadcast-name"
          type="text"
          value={broadcastName}
          onChange={(e) => setBroadcastName(e.target.value)}
          placeholder="e.g. Q4 Holiday Promo 2026"
          maxLength={100}
          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
          autoFocus
        />
        <p className="mt-2 font-label-md text-label-md text-outline text-right">
          {broadcastName.length}/100 characters
        </p>
      </div>

      <div className="mt-xl p-lg bg-primary-container rounded-xl border border-primary">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary mt-1">info</span>
          <div className="font-body-sm text-body-sm text-on-primary-container">
            <p className="font-medium mb-2">Tips for a good broadcast name:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use a clear, descriptive name</li>
              <li>Include campaign type and timeframe</li>
              <li>Example: "Q4 Holiday Promo 2026" or "Appointment Reminders - March"</li>
              <li>This name appears in your dashboard and reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}