import { Router } from 'express';

const router = Router();
const campaigns = new Map();

router.post('/', (req, res) => {
  const { campaignName } = req.body || {};
  if (!campaignName || typeof campaignName !== 'string' || campaignName.trim().length === 0) {
    return res.status(400).json({ error: 'campaignName is required' });
  }
  const id = 'CMP-' + Date.now().toString(36).toUpperCase();
  const campaign = {
    id,
    ...req.body,
    campaignName: campaignName.trim().substring(0, 200),
    status: 'Created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  campaigns.set(id, campaign);
  res.json(campaign);
});

router.get('/', (req, res) => {
  const list = Array.from(campaigns.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(list);
});

router.get('/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

router.put('/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const updated = { ...campaign, ...req.body, updatedAt: new Date().toISOString() };
  campaigns.set(req.params.id, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (!campaigns.has(req.params.id)) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  campaigns.delete(req.params.id);
  res.json({ success: true });
});

export default router;
