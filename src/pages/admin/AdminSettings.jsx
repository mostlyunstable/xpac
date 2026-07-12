import { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { getSettings, updateSettings } from '../../services/api';

export default function AdminSettings() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'XPAC',
    siteDescription: 'IVR Broadcast Management Platform',
    contactEmail: 'support@xpac.io',
    maxFileSize: 50,
    allowedFileTypes: ['csv', 'xlsx', 'xls', 'pdf', 'txt', 'mp3', 'wav'],
    maxAudioDuration: 60,
    defaultTimezone: 'UTC',
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  });
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromEmail: '',
    fromName: 'XPAC',
    secure: false,
  });
  const [savingSmtp, setSavingSmtp] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        setSettings(data.general || {});
        setSmtpSettings(data.smtp || {});
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSaveGeneral() {
    setSaving(true);
    try {
      await updateSettings({ general: settings });
      notifySuccess('General settings saved');
    } catch (err) {
      notifyError('Failed to save general settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSmtp() {
    setSavingSmtp(true);
    try {
      await updateSettings({ smtp: smtpSettings });
      notifySuccess('SMTP settings saved');
    } catch (err) {
      notifyError('Failed to save SMTP settings');
    } finally {
      setSavingSmtp(false);
    }
  }

  async function handleTestEmail() {
    if (!smtpSettings.fromEmail) {
      notifyError('Please configure SMTP settings first');
      return;
    }
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: smtpSettings.fromEmail }),
      });
      if (res.ok) {
        notifySuccess('Test email sent!');
      } else {
        notifyError('Failed to send test email');
      }
    } catch {
      notifyError('Failed to send test email');
    }
  }

  if (loading) {
    return (
      <div className="space-y-xl">
        <div className="animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-lg">Settings</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Configure platform settings</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl animate-pulse">
              <div className="h-6 w-48 bg-surface-container-highest rounded-lg animate-pulse mb-4" />
              <div className="h-4 w-32 bg-surface-container-highest rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Settings</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Configure platform settings</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div className="md:col-span-2">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="site-name">Site Name</label>
            <input
              id="site-name"
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="site-description">Site Description</label>
            <textarea
              id="site-description"
              value={settings.siteDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="contact-email">Contact Email</label>
            <input
              id="contact-email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="max-file-size">Max File Size (MB)</label>
            <input
              id="max-file-size"
              type="number"
              min="1"
              max="500"
              value={settings.maxFileSize}
              onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 50 }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="max-audio-duration">Max Audio Duration (seconds)</label>
            <input
              id="max-audio-duration"
              type="number"
              min="1"
              max="300"
              value={settings.maxAudioDuration}
              onChange={(e) => setSettings(prev => ({ ...prev, maxAudioDuration: parseInt(e.target.value) || 60 }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="default-timezone">Default Timezone</label>
            <select
              id="default-timezone"
              value={settings.defaultTimezone}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultTimezone: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Paris (CET/CEST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <fieldset className="space-y-md">
              <legend className="font-label-md text-label-md text-on-surface-variant mb-sm">Notification Channels</legend>
              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary"
                />
                <span className="font-body-md text-body-md text-on-surface">Email Notifications</span>
              </label>
              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                  className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary"
                />
                <span className="font-body-md text-body-md text-on-surface">SMS Notifications</span>
              </label>
            </fieldset>
          </div>
          <div className="md:col-span-3">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary"
              />
              <span className="font-body-md text-body-md text-on-surface">Maintenance Mode</span>
              <span className="font-label-md text-label-md text-outline ml-auto">Platform unavailable to customers</span>
            </label>
          </div>
        </div>
        <div className="mt-lg flex justify-end">
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
            {saving ? 'Saving...' : 'Save General Settings'}
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg mt-xl">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">SMTP Email Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="smtp-host">SMTP Host</label>
            <input
              id="smtp-host"
              type="text"
              value={smtpSettings.host}
              onChange={(e) => setSmtpSettings(prev => ({ ...prev, host: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="smtp.example.com"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="smtp-port">SMTP Port</label>
            <input
              id="smtp-port"
              type="number"
              value={smtpSettings.port}
              onChange={(e) => setSmtpSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              min="1"
              max="65535"
            />
          </div>
          <div>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={smtpSettings.secure}
                onChange={(e) => setSmtpSettings(prev => ({ ...prev, secure: e.target.checked }))}
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary"
              />
              <span className="font-body-md text-body-md text-on-surface">Use SSL/TLS</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="smtp-user">SMTP Username</label>
            <input
              id="smtp-user"
              type="text"
              value={smtpSettings.username}
              onChange={(e) => setSmtpSettings(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="username"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="smtp-pass">SMTP Password</label>
            <input
              id="smtp-pass"
              type="password"
              value={smtpSettings.password}
              onChange={(e) => setSmtpSettings(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="••••••••"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="smtp-from">From Email</label>
            <input
              id="smtp-from"
              type="email"
              value={smtpSettings.fromEmail}
              onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="noreply@example.com"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="smtp-from-name">From Name</label>
            <input
              id="smtp-from-name"
              type="text"
              value={smtpSettings.fromName}
              onChange={(e) => setSmtpSettings(prev => ({ ...prev, fromName: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="XPAC"
            />
          </div>
        </div>
        <div className="mt-lg flex justify-end">
          <button
            onClick={handleTestEmail}
            disabled={savingSmtp || !smtpSettings.host}
            className="px-xl py-2.5 font-body-md text-body-md border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            Send Test Email
          </button>
          <button
            onClick={handleSaveSmtp}
            disabled={savingSmtp}
            className="ml-sm px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
          >
            {savingSmtp && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
            {savingSmtp ? 'Saving...' : 'Save SMTP Settings'}
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg mt-xl">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Maintenance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <button
            className="p-lg bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low hover:border-primary transition-all text-left text-center"
            onClick={async () => {
              try {
                await fetch('/api/admin/maintenance/clear-cache', { method: 'POST' });
                notifySuccess('Cache cleared');
              } catch {
                notifyError('Failed to clear cache');
              }
            }}
          >
            <span className="material-symbols-outlined text-4xl text-primary mb-3 block">delete_sweep</span>
            <h3 className="font-title-md text-title-md text-on-surface mb-sm">Clear Cache</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Clear all cached data</p>
          </button>
          <button
            className="p-lg bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low hover:border-primary transition-all text-left text-center"
            onClick={async () => {
              try {
                await fetch('/api/admin/maintenance/reindex', { method: 'POST' });
                notifySuccess('Database reindexed');
              } catch {
                notifyError('Failed to reindex');
              }
            }}
          >
            <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">database</span>
            <h3 className="font-title-md text-title-md text-on-surface mb-sm">Reindex Database</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Rebuild search indexes</p>
          </button>
          <button
            className="p-lg bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low hover:border-primary transition-all text-left text-center"
            onClick={async () => {
              try {
                await fetch('/api/admin/maintenance/vacuum', { method: 'POST' });
                notifySuccess('Database vacuumed');
              } catch {
                notifyError('Failed to vacuum database');
              }
            }}
          >
            <span className="material-symbols-outlined text-4xl text-tertiary mb-3 block">storage</span>
            <h3 className="font-title-md text-title-md text-on-surface mb-sm">Vacuum Database</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Reclaim unused space</p>
          </button>
        </div>
      </div>
    </div>
  );
}