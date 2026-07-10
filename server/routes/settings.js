import { Router } from 'express';

const router = Router();

let settings = {
  profile: { name: 'Admin', email: 'admin@xpac.io', company: 'XPAC Inc.' },
  preferences: { notifications: true, autoSave: true, darkMode: false },
};

router.get('/', (req, res) => {
  res.json(settings);
});

router.put('/', (req, res) => {
  const { profile, preferences } = req.body || {};
  if (profile) {
    settings.profile = {
      ...settings.profile,
      name: typeof profile.name === 'string' ? profile.name.trim().substring(0, 100) : settings.profile.name,
      email: typeof profile.email === 'string' ? profile.email.trim().substring(0, 200) : settings.profile.email,
      company: typeof profile.company === 'string' ? profile.company.trim().substring(0, 200) : settings.profile.company,
    };
  }
  if (preferences) {
    settings.preferences = {
      notifications: typeof preferences.notifications === 'boolean' ? preferences.notifications : settings.preferences.notifications,
      autoSave: typeof preferences.autoSave === 'boolean' ? preferences.autoSave : settings.preferences.autoSave,
      darkMode: typeof preferences.darkMode === 'boolean' ? preferences.darkMode : settings.preferences.darkMode,
    };
  }
  res.json(settings);
});

export default router;
