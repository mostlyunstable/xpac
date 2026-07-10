import { useWizard } from '../contexts/WizardContext';
import { VOICE_OPTIONS, LANGUAGE_OPTIONS } from '../constants';
import { classNames } from '../utils';

const SCRIPT_TYPES = [
  { id: 'standard', name: 'Standard Introduction', description: 'Professional greeting with company name and purpose' },
  { id: 'survey', name: 'Survey / Feedback', description: 'Collect customer feedback with structured questions' },
  { id: 'appointment', name: 'Appointment Reminder', description: 'Remind customers about upcoming appointments' },
  { id: 'promotion', name: 'Promotional', description: 'Promote products, services, or special offers' },
];

export default function AIStep() {
  const { aiConfig, setAiConfig } = useWizard();

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Configure AI</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Set up how the AI will interact with your contacts. Choose voice, language, and script type.
        </p>
      </div>

      <div className="space-y-xl">
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">Voice</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {VOICE_OPTIONS.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setAiConfig({ voice: voice.id })}
                className={classNames(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200',
                  aiConfig.voice === voice.id
                    ? 'border-primary bg-primary-fixed'
                    : 'border-outline-variant hover:border-outline bg-surface-container-lowest hover:bg-surface-container-low'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={classNames(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    aiConfig.voice === voice.id ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                  )}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md font-semibold text-on-surface">{voice.name}</p>
                    <p className="font-label-md text-label-md text-outline">{voice.gender} · {voice.language}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="language">Language</label>
          <select
            id="language"
            value={aiConfig.language}
            onChange={(e) => setAiConfig({ language: e.target.value })}
            className="w-full md:w-64 px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">Script Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SCRIPT_TYPES.map((script) => (
              <button
                key={script.id}
                onClick={() => setAiConfig({ scriptType: script.id })}
                className={classNames(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200',
                  aiConfig.scriptType === script.id
                    ? 'border-primary bg-primary-fixed'
                    : 'border-outline-variant hover:border-outline bg-surface-container-lowest hover:bg-surface-container-low'
                )}
              >
                <p className="font-body-md text-body-md font-semibold text-on-surface">{script.name}</p>
                <p className="font-label-md text-label-md text-outline mt-1">{script.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="custom-prompt">
            Custom Prompt (optional)
          </label>
          <textarea
            id="custom-prompt"
            value={aiConfig.customPrompt}
            onChange={(e) => setAiConfig({ customPrompt: e.target.value })}
            placeholder="Add any custom instructions for the AI..."
            rows={4}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
          />
          <p className="mt-2 font-label-md text-label-md text-outline">
            Optional: Add specific instructions for the AI to follow during calls.
          </p>
        </div>
      </div>
    </div>
  );
}
