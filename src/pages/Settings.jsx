import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getSettings, updateSettings } from '../services/api';
import { generateUniqueId } from '../utils';

export default function Settings() {
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', company: '' });
  const [preferences, setPreferences] = useState({ notifications: true, autoSave: true, darkMode: false });
  const [apiKey] = useState(() => {
    try {
      const stored = localStorage.getItem('xpac_api_key');
      if (stored) return stored;
      const key = 'xpk_' + generateUniqueId().replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      localStorage.setItem('xpac_api_key', key);
      return key;
    } catch {
      return 'xpk_' + generateUniqueId().replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings();
        setProfile(data.profile || { name: 'Admin', email: 'admin@xpac.io', company: 'XPAC Inc.' });
        setPreferences(data.preferences || { notifications: true, autoSave: true, darkMode: false });
        if (data.preferences?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch {
        setProfile({ name: 'Admin', email: 'admin@xpac.io', company: 'XPAC Inc.' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function validateProfile() {
    const errors = {};
    if (!profile.name.trim()) errors.name = 'Name is required';
    if (!profile.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = 'Invalid email format';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveProfile() {
    if (!validateProfile()) return;
    setSaving(true);
    try {
      await updateSettings({ profile });
      success('Profile saved successfully!');
    } catch {
      error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferences() {
    setSaving(true);
    try {
      await updateSettings({ preferences });
      if (preferences.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      success('Preferences saved successfully!');
    } catch {
      error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-xl">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage your account and application preferences.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Profile</h2>
        <div className="space-y-md">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="settings-name">Name</label>
            <input
              id="settings-name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              maxLength={100}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                profileErrors.name ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {profileErrors.name && <p className="mt-1 font-label-md text-label-md text-error">{profileErrors.name}</p>}
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="settings-email">Email</label>
            <input
              id="settings-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              maxLength={254}
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                profileErrors.email ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {profileErrors.email && <p className="mt-1 font-label-md text-label-md text-error">{profileErrors.email}</p>}
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="settings-company">Company</label>
            <input
              id="settings-company"
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              maxLength={100}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-lg px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
          Save Profile
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Preferences</h2>
        <div className="space-y-md">
          {[
            { key: 'notifications', label: 'Email Notifications', desc: 'Receive email updates about your campaigns' },
            { key: 'autoSave', label: 'Auto-Save', desc: 'Automatically save campaign drafts' },
            { key: 'darkMode', label: 'Dark Mode', desc: 'Switch to dark theme' },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-3 border-b border-outline-variant last:border-0">
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{pref.label}</p>
                <p className="font-label-md text-label-md text-outline">{pref.desc}</p>
              </div>
              <button
                onClick={() => {
                  const newVal = !preferences[pref.key];
                  setPreferences({ ...preferences, [pref.key]: newVal });
                  if (pref.key === 'darkMode') {
                    if (newVal) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${preferences[pref.key] ? 'bg-primary' : 'bg-outline-variant'}`}
                role="switch"
                aria-checked={preferences[pref.key]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences[pref.key] ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleSavePreferences}
          disabled={saving}
          className="mt-lg px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
          Save Preferences
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">API Key</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
          Use this key to authenticate API requests. Keep it secret.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-surface border border-outline-variant rounded-lg font-code text-code text-on-surface overflow-hidden text-ellipsis">
            {showApiKey ? apiKey : '•'.repeat(36)}
          </div>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
          >
            <span className="material-symbols-outlined">{showApiKey ? 'visibility_off' : 'visibility'}</span>
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(apiKey); success('API key copied to clipboard!'); }}
            className="px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            aria-label="Copy API key"
          >
            <span className="material-symbols-outlined">content_copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
