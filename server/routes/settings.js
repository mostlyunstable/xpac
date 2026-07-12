import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, ownershipCheck } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, ownershipCheck);

function getDefaultSettings(userId, user) {
  return {
    profile: {
      name: user.name || '',
      email: user.email || '',
      company: user.company || '',
    },
    preferences: {
      notifications: true,
      autoSave: true,
      darkMode: false,
    },
  };
}

router.get('/', (req, res) => {
  const userId = req.ownedBy;
  let userSettings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  
  if (!userSettings) {
    const user = req.user;
    userSettings = getDefaultSettings(userId, user);
    
    const id = 'set-' + Date.now().toString(36);
    db.prepare('INSERT INTO user_settings (id, user_id, profile, preferences) VALUES (?, ?, ?, ?)').run(
      id,
      userId,
      JSON.stringify(userSettings.profile),
      JSON.stringify(userSettings.preferences)
    );
  } else {
    userSettings.profile = JSON.parse(userSettings.profile);
    userSettings.preferences = JSON.parse(userSettings.preferences);
  }
  
  res.json(userSettings);
});

router.put('/', (req, res) => {
  const userId = req.ownedBy;
  const { profile, preferences } = req.body || {};
  
  const existing = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  let currentProfile = existing ? JSON.parse(existing.profile) : { name: '', email: '', company: '' };
  let currentPrefs = existing ? JSON.parse(existing.preferences) : { notifications: true, autoSave: true, darkMode: false };
  
  if (profile) {
    currentProfile = {
      name: typeof profile.name === 'string' ? profile.name.trim().substring(0, 100) : currentProfile.name,
      email: typeof profile.email === 'string' ? profile.email.trim().substring(0, 200) : currentProfile.email,
      company: typeof profile.company === 'string' ? profile.company.trim().substring(0, 200) : currentProfile.company,
    };
  }
  if (preferences) {
    currentPrefs = {
      notifications: typeof preferences.notifications === 'boolean' ? preferences.notifications : currentPrefs.notifications,
      autoSave: typeof preferences.autoSave === 'boolean' ? preferences.autoSave : currentPrefs.autoSave,
      darkMode: typeof preferences.darkMode === 'boolean' ? preferences.darkMode : currentPrefs.darkMode,
    };
  }
  
  if (existing) {
    db.prepare('UPDATE user_settings SET profile = ?, preferences = ? WHERE user_id = ?').run(
      JSON.stringify(currentProfile),
      JSON.stringify(currentPrefs),
      userId
    );
  } else {
    const id = 'set-' + Date.now().toString(36);
    db.prepare('INSERT INTO user_settings (id, user_id, profile, preferences) VALUES (?, ?, ?, ?)').run(
      id, userId,
      JSON.stringify(currentProfile),
      JSON.stringify(currentPrefs)
    );
  }
  
  res.json({ profile: currentProfile, preferences: currentPrefs });
});

export default router;