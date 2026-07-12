import { Router } from 'express';
import { db, logActivity } from '../db.js';
import { authenticate, ownershipCheck } from '../middleware/auth.js';
import { sendEmail, emailTemplates } from '../services/email.js';

const router = Router();

router.use(authenticate, ownershipCheck);

const ALLOWED_STATUSES = ['Placed', 'In Progress', 'Completed', 'Failed', 'Queued', 'Paused', 'Cancelled'];

router.post('/', async (req, res) => {
  const { campaignId, ...rest } = req.body || {};
  const userId = req.ownedBy;

  if (campaignId) {
    const campaign = db.prepare('SELECT id, campaign_name, user_id FROM campaigns WHERE id = ? AND user_id = ?').get(campaignId, userId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
  }

  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-6).padStart(6, '0');
  const id = `IVR-${year}-${seq}`;

  const status = ALLOWED_STATUSES.includes(rest.status) ? rest.status : 'Placed';
  const now = new Date().toISOString();

  const order = {
    id,
    user_id: userId,
    campaign_id: campaignId || null,
    campaign_name: rest.campaignName || '',
    status,
    audio_file_url: rest.audioFileUrl || '',
    contact_file_url: rest.contactFileUrl || '',
    contact_count: rest.contactCount || 0,
    estimated_cost: rest.estimatedCost || '0.00',
    estimated_duration: rest.estimatedDuration || '0 min',
    schedule: rest.schedule ? JSON.stringify(rest.schedule) : null,
    report_file_url: '',
    admin_remarks: '',
    created_at: now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO orders (id, user_id, campaign_id, campaign_name, status, audio_file_url, contact_file_url, contact_count, estimated_cost, estimated_duration, schedule, report_file_url, admin_remarks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    order.id,
    order.user_id,
    order.campaign_id,
    order.campaign_name,
    order.status,
    order.audio_file_url,
    order.contact_file_url,
    order.contact_count,
    order.estimated_cost,
    order.estimated_duration,
    order.schedule,
    order.report_file_url,
    order.admin_remarks,
    order.created_at,
    order.updated_at
  );

  logActivity(userId, 'create_order', 'order', id, null, order, req);

  // Send order placed email
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(userId);
  if (user) {
    const template = emailTemplates().orderPlaced(user.name, id);
    await sendEmail({ to: user.email, subject: template.subject, html: template.html });
  }

  res.json(order);
});

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  let where = 'WHERE o.user_id = ?';
  const params = [req.ownedBy];

  if (req.query.search) {
    where += ' AND (o.id LIKE ? OR o.campaign_name LIKE ?)';
    const s = `%${req.query.search}%`;
    params.push(s, s);
  }
  if (req.query.status && req.query.status !== 'All') {
    where += ' AND o.status = ?';
    params.push(req.query.status);
  }

  const sortField = req.query.sort === 'createdAt' ? 'o.created_at' : 'o.created_at';
  const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

  const rows = db.prepare(`
    SELECT o.* FROM orders o ${where} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).get(...params).count;

  const orders = rows.map(r => ({
    ...r,
    schedule: r.schedule ? JSON.parse(r.schedule) : null,
  }));

  res.json({ orders, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
});

router.get('/reports', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE r.user_id = ?';
  const params = [req.ownedBy];

  if (status) {
    where += ' AND r.status = ?';
    params.push(status);
  }

  const rows = db.prepare(`
    SELECT r.*, c.campaign_name, o.campaign_name as order_campaign_name
    FROM reports r
    LEFT JOIN campaigns c ON r.campaign_id = c.id
    LEFT JOIN orders o ON r.order_id = o.id
    ${where}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM reports r ${where}`).get(...params).count;

  res.json({ reports: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.ownedBy);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json({
    ...order,
    schedule: order.schedule ? JSON.parse(order.schedule) : null,
  });
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.ownedBy);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...req.body,
    user_id: req.ownedBy,
    updated_at: now,
  };

  const stmt = db.prepare(`
    UPDATE orders SET
      campaign_name = ?, status = ?, audio_file_url = ?, contact_file_url = ?,
      contact_count = ?, estimated_cost = ?, estimated_duration = ?,
      schedule = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.campaignName || updated.campaign_name,
    updated.status,
    updated.audioFileUrl || updated.audio_file_url,
    updated.contactFileUrl || updated.contact_file_url,
    updated.contactCount || updated.contact_count || 0,
    updated.estimatedCost || updated.estimated_cost || '0.00',
    updated.estimatedDuration || updated.estimated_duration || '0 min',
    updated.schedule ? JSON.stringify(updated.schedule) : null,
    now,
    req.params.id
  );

  logActivity(req.ownedBy, 'update_order', 'order', req.params.id, existing, updated, req);
  res.json({ ...updated, id: req.params.id });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ? AND user_id = ?').run(req.params.id, req.ownedBy);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  logActivity(req.ownedBy, 'delete_order', 'order', req.params.id, null, null, req);
  res.json({ success: true });
});

export default router;