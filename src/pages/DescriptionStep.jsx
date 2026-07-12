import { useWizard } from '../contexts/WizardContext';

export default function DescriptionStep() {
  const { description, setDescription } = useWizard();

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Description (Optional)</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Add any specific instructions for the admin team processing this broadcast.
        </p>
      </div>

      <div className="max-w-2xl">
        <label htmlFor="description" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
          Special Instructions
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Priority delivery needed. Target only US numbers. Exclude DNC list."
          rows={5}
          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
          maxLength={1000}
        />
        <p className="mt-2 font-label-md text-label-md text-outline text-right">
          {description.length}/1000 characters
        </p>
      </div>

      <div className="mt-xl p-lg bg-primary-container rounded-xl border border-primary">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary mt-1">info</span>
          <div className="font-body-sm text-body-sm text-on-primary-container">
            <p className="font-medium mb-2">What to include in instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Target geography (country, state, city)</li>
              <li>Time-of-day preferences</li>
              <li>Exclusion criteria (DNC lists, specific carriers)</li>
              <li>Priority level or deadline</li>
              <li>Any compliance notes</li>
            </ul>
            <p className="mt-2 text-xs opacity-70">
              These instructions are visible to the admin team only and help ensure your broadcast is processed correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}