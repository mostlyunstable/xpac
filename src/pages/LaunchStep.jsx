import { useState } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { createCampaign, createOrder } from '../services/api';
import { calculateEstimatedCost, calculateEstimatedDuration } from '../utils';
import { VOICE_OPTIONS, LANGUAGE_OPTIONS } from '../constants';
import Modal from '../components/Modal';

export default function LaunchStep() {
  const wizard = useWizard();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const [launching, setLaunching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const voiceName = VOICE_OPTIONS.find(v => v.id === wizard.aiConfig.voice)?.name || wizard.aiConfig.voice;
  const languageName = LANGUAGE_OPTIONS.find(l => l.id === wizard.aiConfig.language)?.name || wizard.aiConfig.language;
  const contactCount = wizard.csvData?.rows?.length || 0;
  const estimatedCost = calculateEstimatedCost(contactCount);
  const estimatedDuration = calculateEstimatedDuration(contactCount);

  async function handleLaunch() {
    setLaunching(true);
    try {
      const campaignData = {
        campaignName: wizard.launchConfig.campaignName,
        campaignDescription: wizard.launchConfig.campaignDescription,
        file: wizard.uploadedFile,
        mapping: wizard.mapping,
        aiConfig: wizard.aiConfig,
        scheduleConfig: wizard.scheduleConfig,
        contactCount,
        estimatedCost,
        estimatedDuration,
      };
      const campaign = await createCampaign(campaignData);

      await createOrder({
        campaignId: campaign.id,
        campaignName: wizard.launchConfig.campaignName,
        status: wizard.scheduleConfig.mode === 'immediate' ? 'Processing' : 'Queued',
        file: wizard.uploadedFile,
        contactCount,
        estimatedCost,
        estimatedDuration,
        schedule: wizard.scheduleConfig,
      });

      success(`Campaign "${wizard.launchConfig.campaignName}" launched successfully!`);
      wizard.reset();
      navigate('/orders');
    } catch (err) {
      error(err.message || 'Failed to launch campaign. Please try again.');
    } finally {
      setLaunching(false);
      setShowConfirm(false);
    }
  }

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Review & Launch</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Review your campaign details before launching.
        </p>
      </div>

      <div className="space-y-lg">
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg">
          <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Campaign Details</h3>
          <div className="space-y-md">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="campaign-name">
                Campaign Name <span className="text-error">*</span>
              </label>
              <input
                id="campaign-name"
                type="text"
                value={wizard.launchConfig.campaignName}
                onChange={(e) => wizard.setLaunchConfig({ campaignName: e.target.value })}
                placeholder="e.g. Q4 Outreach Campaign"
                maxLength={100}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="campaign-desc">
                Description (optional)
              </label>
              <textarea
                id="campaign-desc"
                value={wizard.launchConfig.campaignDescription}
                onChange={(e) => wizard.setLaunchConfig({ campaignDescription: e.target.value })}
                placeholder="Brief description of this campaign..."
                rows={3}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg">
          <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Campaign Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="space-y-md">
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">File</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">{wizard.uploadedFile?.filename || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Phone Column</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">{wizard.mapping.phone || 'Not mapped'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Voice</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">{voiceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Language</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">{languageName}</span>
              </div>
            </div>
            <div className="space-y-md">
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Schedule</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  {wizard.scheduleConfig.mode === 'immediate' ? 'Immediate' : `${wizard.scheduleConfig.date} ${wizard.scheduleConfig.time}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Timezone</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">{wizard.scheduleConfig.timezone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Script Type</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold capitalize">{wizard.aiConfig.scriptType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
          disabled={!wizard.launchConfig.campaignName.trim()}
          className="px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          Launch Campaign
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
                  Launch Campaign
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-md">
          <p className="font-body-md text-body-md text-on-surface">
            You are about to launch <strong>{wizard.launchConfig.campaignName}</strong> with <strong>{contactCount}</strong> contacts.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This will create a new order and the campaign will {wizard.scheduleConfig.mode === 'immediate' ? 'start immediately' : `be scheduled for ${wizard.scheduleConfig.date} at ${wizard.scheduleConfig.time}`}.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Estimated cost: <strong>${estimatedCost}</strong> · Estimated duration: <strong>{estimatedDuration}</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
}
