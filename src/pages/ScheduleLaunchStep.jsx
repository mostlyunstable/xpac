import { useState, useCallback } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { createCampaign, createOrder } from '../services/api';
import { calculateEstimatedCost, calculateEstimatedDuration } from '../utils';
import { TIMEZONE_OPTIONS } from '../constants';
import { classNames } from '../utils';
import Modal from '../components/Modal';

export default function ScheduleLaunchStep() {
  const wizard = useWizard();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const [launching, setLaunching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { scheduleConfig, setScheduleConfig, broadcastName, audioFile, contactFile, csvData, description } = wizard;
  const isImmediate = scheduleConfig.mode === 'immediate';

  const isPastDateTime = useCallback(() => {
    if (isImmediate || !scheduleConfig.date || !scheduleConfig.time) return false;
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
  }, [isImmediate, scheduleConfig]);

  const contactCount = csvData?.rows?.length || 0;
  const estimatedCost = calculateEstimatedCost(contactCount);
  const estimatedDuration = calculateEstimatedDuration(contactCount);

  async function handleLaunch() {
    setLaunching(true);
    try {
      const campaignData = {
        campaignName: broadcastName,
        campaignDescription: description,
        audioFile: audioFile,
        contactFile: contactFile,
        contactCount,
        estimatedCost,
        estimatedDuration,
        scheduleConfig,
      };
      const campaign = await createCampaign(campaignData);

      await createOrder({
        campaignId: campaign.id,
        campaignName: broadcastName,
        status: scheduleConfig.mode === 'immediate' ? 'Placed' : 'Queued',
        audioFileUrl: audioFile?.url || audioFile?.path || '',
        contactFileUrl: contactFile?.url || contactFile?.path || '',
        contactCount,
        estimatedCost,
        estimatedDuration,
        schedule: scheduleConfig.mode === 'immediate' ? null : scheduleConfig,
      });

      success(`Broadcast "${broadcastName}" launched successfully!`);
      wizard.reset();
      navigate('/orders');
    } catch (err) {
      error(err.message || 'Failed to launch broadcast. Please try again.');
    } finally {
      setLaunching(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Schedule & Launch</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Choose when to launch your broadcast. You can start immediately or schedule for later.
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
              Your broadcast will start as soon as you launch it.
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
              Set a specific date and time for your broadcast to start.
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
              <div className={`flex items-center gap-3 p-4 rounded-lg ${isPastDateTime() ? 'bg-red-50' : 'bg-primary-fixed'}`}>
                <span className={`material-symbols-outlined ${isPastDateTime() ? 'text-error' : 'text-primary'}`}>
                  {isPastDateTime() ? 'warning' : 'event'}
                </span>
                {isPastDateTime() ? (
                  <p className="font-body-md text-body-md text-error">
                    The selected date and time is in the past. Please choose a future time.
                  </p>
                ) : (
                  <p className="font-body-md text-body-md text-on-primary-fixed-variant">
                    Broadcast will start on <strong>{new Date(`${scheduleConfig.date}T${scheduleConfig.time}`).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> ({scheduleConfig.timezone})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-xl">
        <div className="bg-primary-fixed rounded-xl border border-primary p-lg text-center">
          <span className="material-symbols-outlined text-3xl text-primary mb-2">groups</span>
          <p className="font-display text-display text-primary">{contactCount}</p>
          <p className="font-label-md text-label-md text-on-primary-fixed-variant">Contacts</p>
        </div>
        <div className="bg-primary-fixed rounded-xl border border-primary p-lg text-center">
          <span className="material-symbols-outlined text-3xl text-primary mb-2">schedule</span>
          <p className="font-display text-display text-primary">{estimatedDuration}</p>
          <p className="font-label-md text-label-md text-on-primary-fixed-variant">Est. Duration</p>
        </div>
        <div className="bg-primary-fixed rounded-xl border border-primary p-lg text-center">
          <span className="material-symbols-outlined text-3xl text-primary mb-2">payments</span>
          <p className="font-display text-display text-primary">${estimatedCost}</p>
          <p className="font-label-md text-label-md text-on-primary-fixed-variant">Est. Cost</p>
        </div>
      </div>
    </div>

    <div className="mt-lg flex justify-end">
      <button
        onClick={() => setShowConfirm(true)}
        disabled={!broadcastName.trim() || (isImmediate ? false : !scheduleConfig.date || !scheduleConfig.time) || (isImmediate ? false : isPastDateTime())}
        className="px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-sm">rocket_launch</span>
        Launch Broadcast
      </button>
    </div>

    <Modal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      title="Confirm Launch"
      actions={
        <>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {launching ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                Launching...
              </>
            ) : (
              <>
                Launch Broadcast
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-md">
        <p className="font-body-md text-body-md text-on-surface">
          You are about to launch <strong>{broadcastName}</strong> with <strong>{contactCount}</strong> contacts.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          This will create a new broadcast order that {isImmediate ? 'starts immediately' : `is scheduled for ${new Date(`${scheduleConfig.date}T${scheduleConfig.time}`).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Estimated cost: <strong>${estimatedCost}</strong> · Estimated duration: <strong>{estimatedDuration}</strong>
        </p>
        {audioFile && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Audio: <strong>{audioFile.filename}</strong>
          </p>
        )}
        {contactFile && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Contacts: <strong>{contactFile.filename}</strong>
          </p>
        )}
        {description && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Instructions: <strong>{description}</strong>
          </p>
        )}
      </div>
    </Modal>
    </>
  );
}