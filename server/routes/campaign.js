import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, ownershipCheck } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

router.use(authenticate, ownershipCheck);

router.post('/', validate(schemas.createCampaign), (req, res) => {
  const { campaignName, ...rest } = req.body || {};
  if (!campaignName || typeof campaignName !== 'string' || campaignName.trim().length === 0) {
    return res.status(400).json({ error: 'campaignName is required' });
  }

  const id = 'CMP-' + Date.now().toString(36).toUpperCase();
  const now = new Date().toISOString();
  const campaign = {
    id,
    user_id: req.ownedBy,
    campaignName: campaignName.trim().substring(0, 200),
    ...rest,
    status: 'Created',
    createdAt: now,
    updatedAt: now,
  };

  const stmt = db.prepare(`
    INSERT INTO campaigns (id, user_id, campaign_name, campaign_description, file, mapping, ai_config, schedule_config, contact_count, estimated_cost, estimated_duration, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    campaign.id,
    campaign.user_id,
    campaign.campaignName,
    campaign.campaignDescription || '',
    campaign.file ? JSON.stringify(campaign.file) : null,
    campaign.mapping ? JSON.stringify(campaign.mapping) : null,
    campaign.aiConfig ? JSON.stringify(campaign.aiConfig) : null,
    campaign.scheduleConfig ? JSON.stringify(campaign.scheduleConfig) : null,
    campaign.contactCount || 0,
    campaign.estimatedCost || '0.00',
    campaign.estimatedDuration || '0 min',
    campaign.status,
    campaign.createdAt,
    campaign.updatedAt
  );

  res.json(campaign);
});

router.get('/', validate(schemas.getCampaigns), (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const rows = db.prepare(`
    SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.ownedBy, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM campaigns WHERE user_id = ?').get(req.ownedBy).count;

  const campaigns = rows.map(r => ({
    ...r,
    file: r.file && r.file !== '' ? JSON.parse(r.file) : null,
    mapping: r.mapping ? JSON.parse(r.mapping) : null,
    aiConfig: r.ai_config ? JSON.parse(r.ai_config) : null,
    scheduleConfig: r.schedule_config ? JSON.parse(r.schedule_config) : null,
  }));

  res.json({ campaigns, total, page, totalPages: Math.ceil(total / limit) });
});

router.get('/:id', validate(schemas.getCampaign), (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.ownedBy);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  res.json({
    ...campaign,
    file: campaign.file && campaign.file !== '' ? JSON.parse(campaign.file) : null,
    mapping: campaign.mapping ? JSON.parse(campaign.mapping) : null,
    aiConfig: campaign.ai_config ? JSON.parse(campaign.ai_config) : null,
    scheduleConfig: campaign.schedule_config ? JSON.parse(campaign.schedule_config) : null,
  });
});

router.put('/:id', validate(schemas.updateCampaign), (req, res) => {
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.ownedBy);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...req.body,
    user_id: req.ownedBy,
    updatedAt: now,
  };

  const stmt = db.prepare(`
    UPDATE campaigns SET
      campaign_name = ?, campaign_description = ?, file = ?, mapping = ?, ai_config = ?,
      schedule_config = ?, contact_count = ?, estimated_cost = ?, estimated_duration = ?,
      status = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.campaignName || updated.campaign_name,
    updated.campaignDescription || updated.campaign_description || '',
    updated.file ? JSON.stringify(updated.file) : null,
    updated.mapping ? JSON.stringify(updated.mapping) : null,
    updated.aiConfig ? JSON.stringify(updated.aiConfig) : null,
    updated.scheduleConfig ? JSON.stringify(updated.scheduleConfig) : null,
    updated.contactCount || updated.contact_count || 0,
    updated.estimatedCost || updated.estimated_cost || '0.00',
    updated.estimatedDuration || updated.estimated_duration || '0 min',
    updated.status,
    now,
    req.params.id
  );

  res.json({ ...updated, id: req.params.id });
});

router.delete('/:id', validate(schemas.deleteCampaign), (req, res) => {
  const result = db.prepare('DELETE FROM campaigns WHERE id = ? AND user_id = ?').run(req.params.id, req.ownedBy);
  if (result.changes === 0) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ success: true });
});

export default router;