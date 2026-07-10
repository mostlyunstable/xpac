import { useWizard } from '../contexts/WizardContext';
import { TIMEZONE_OPTIONS } from '../constants';
import { classNames } from '../utils';

export default function ScheduleStep() {
  const { scheduleConfig, setScheduleConfig } = useWizard();
  const isImmediate = scheduleConfig.mode === 'immediate';

  const isPastDateTime = !isImmediate && scheduleConfig.date && scheduleConfig.time && (() => {
    const now = new Date();
    const selectedLocal = new Date(`${scheduleConfig.date}T${scheduleConfig.time}`);
    if (scheduleConfig.timezone === 'UTC') {
      const nowUTC = Date.now();
      const selectedUTC = selectedLocal.getTime() + selectedLocal.getTimezoneOffset() * 60000;
      return selectedUTC < nowUTC;
    }
    try {
      const nowInTZ = new Date(now.toLocaleString('en-US', { timeZone: scheduleConfig.timezone }));
      const selectedInTZ = new Date(selectedLocal.toLocaleString('en-US', { timeZone: scheduleConfig.timezone }));
      return selectedInTZ < nowInTZ;
    } catch {
      return selectedLocal < now;
    }
  })();

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Schedule Campaign</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Choose when to launch your campaign. You can start immediately or schedule for later.
        </p>
      </div>

      <div className="space-y-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setScheduleConfig({ mode: 'immediate' })}
            className={classNames(
              'p-6 rounded-xl border-2 text-left transition-all duration-200',
              isImmediate
                ? 'border-primary bg-primary-fixed'
                : 'border-outline-variant hover:border-outline bg-surface-container-lowest hover:bg-surface-container-low'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={classNames(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isImmediate ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
              )}>
                <span className="material-symbols-outlined">play_arrow</span>
              </div>
              <p className="font-title-lg text-title-lg text-on-surface">Start Immediately</p>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant ml-13">
              Your campaign will start as soon as you launch it.
            </p>
          </button>

          <button
            onClick={() => setScheduleConfig({ mode: 'scheduled' })}
            className={classNames(
              'p-6 rounded-xl border-2 text-left transition-all duration-200',
              !isImmediate
                ? 'border-primary bg-primary-fixed'
                : 'border-outline-variant hover:border-outline bg-surface-container-lowest hover:bg-surface-container-low'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={classNames(
                'w-10 h-10 rounded-full flex items-center justify-center',
                !isImmediate ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
              )}>
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <p className="font-title-lg text-title-lg text-on-surface">Schedule Later</p>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant ml-13">
              Set a specific date and time for your campaign to start.
            </p>
          </button>
        </div>

        {!isImmediate && (
          <div className="p-lg bg-surface-container rounded-xl border border-outline-variant space-y-lg animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="schedule-date">
                  Date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={scheduleConfig.date}
                  onChange={(e) => setScheduleConfig({ date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="schedule-time">
                  Time
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={scheduleConfig.time}
                  onChange={(e) => setScheduleConfig({ time: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="schedule-timezone">
                Timezone
              </label>
              <select
                id="schedule-timezone"
                value={scheduleConfig.timezone}
                onChange={(e) => setScheduleConfig({ timezone: e.target.value })}
                className="w-full md:w-80 px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {scheduleConfig.date && scheduleConfig.time && (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${isPastDateTime ? 'bg-red-50' : 'bg-primary-fixed'}`}>
                <span className={`material-symbols-outlined ${isPastDateTime ? 'text-error' : 'text-primary'}`}>
                  {isPastDateTime ? 'warning' : 'event'}
                </span>
                {isPastDateTime ? (
                  <p className="font-body-md text-body-md text-error">
                    The selected date and time is in the past. Please choose a future time.
                  </p>
                ) : (
                  <p className="font-body-md text-body-md text-on-primary-fixed-variant">
                    Campaign will start on <strong>{new Date(`${scheduleConfig.date}T${scheduleConfig.time}`).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> ({scheduleConfig.timezone})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
