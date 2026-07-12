import { Router } from 'express';
import { db, logActivity } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, emailTemplates } from '../services/email.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', (req, res) => {
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer').count;
  const activeCustomers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('customer', 'active').count;
  const suspendedCustomers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('customer', 'suspended').count;
  
  const totalCampaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get().count;
  const activeCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status IN ('In Progress', 'Placed')").get().count;
  const placedCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = ?").get('Placed').count;
  const completedCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = ?").get('Completed').count;
  
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const ordersToday = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get().count;
  
  const openTickets = db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')").get().count;
  const staleOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE status = 'Placed' AND created_at < datetime('now', '-24 hours')
  `).get().count;
  const slaTickets = db.prepare(`
    SELECT COUNT(*) as count FROM support_tickets 
    WHERE status IN ('open', 'in_progress') AND created_at < datetime('now', '-4 hours')
  `).get().count;

  const recentActivity = db.prepare(`
    SELECT al.*, u.name, u.email FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC LIMIT 10
  `).all();

  res.json({
    kpis: {
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      totalCampaigns,
      activeCampaigns,
      placedCampaigns,
      completedCampaigns,
      totalOrders,
      ordersToday,
      openTickets,
      staleOrders,
      slaTickets,
    },
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      userName: a.name,
      userEmail: a.email,
      createdAt: a.created_at,
    })),
  });
});

router.get('/users', (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE role = ?';
  const params = ['customer'];

  if (search) {
    where += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  const rows = db.prepare(`
    SELECT id, name, email, company, status, email_verified, last_login, created_at
    FROM users ${where}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params).count;

  res.json({ users: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

router.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, company, status, email_verified, last_login, created_at FROM users WHERE id = ? AND role = ?').get(req.params.id, 'customer');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const campaigns = db.prepare('SELECT id, campaign_name, status, contact_count, created_at FROM campaigns WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  const orders = db.prepare('SELECT id, campaign_name, status, contact_count, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  const tickets = db.prepare('SELECT id, subject, priority, status, created_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC').all(user.id);

  res.json({ user: { ...user, campaigns, orders, tickets } });
});

router.put('/users/:id', (req, res) => {
  const { name, email, company, status } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'customer');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldData = { ...user };
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (company !== undefined) { updates.push('company = ?'); params.push(company); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updates.push('updated_at = datetime("now")');
  params.push(req.params.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT id, name, email, company, status, email_verified, last_login, created_at FROM users WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update_user', 'user', req.params.id, oldData, updated, req);

  res.json({ user: updated });
});

router.post('/users/:id/deactivate', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'customer');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldData = { ...user };
  db.prepare('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?').run('suspended', req.params.id);
  
  const updated = { ...user, status: 'suspended' };
  logActivity(req.user.id, 'deactivate_user', 'user', req.params.id, oldData, updated, req);

  res.json({ user: updated });
});

router.post('/users/:id/activate', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'customer');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldData = { ...user };
  db.prepare('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?').run('active', req.params.id);
  
  const updated = { ...user, status: 'active' };
  logActivity(req.user.id, 'activate_user', 'user', req.params.id, oldData, updated, req);

  res.json({ user: updated });
});

router.get('/campaigns', (req, res) => {
  const { status, search, userId, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (status) { where += ' AND c.status = ?'; params.push(status); }
  if (search) { where += ' AND (c.campaign_name LIKE ? OR c.id LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  if (userId) { where += ' AND c.user_id = ?'; params.push(userId); }

  const rows = db.prepare(`
    SELECT c.*, u.name as customer_name, u.email as customer_email
    FROM campaigns c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE ${where}
    ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM campaigns c LEFT JOIN users u ON c.user_id = u.id WHERE ${where}`).get(...params).count;

  res.json({ campaigns: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

router.get('/campaigns/:id', (req, res) => {
  const campaign = db.prepare(`
    SELECT c.*, u.name as customer_name, u.email as customer_email
    FROM campaigns c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  res.json(campaign);
});

router.put('/campaigns/:id/status', (req, res) => {
  const { status, remarks } = req.body;
  const validStatuses = ['Placed', 'In Progress', 'Completed', 'Failed', 'Paused', 'Cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const oldData = { ...campaign };
  const now = new Date().toISOString();
  
  db.prepare('UPDATE campaigns SET status = ?, admin_remarks = ?, updated_at = ? WHERE id = ?')
    .run(status, remarks || '', now, req.params.id);

  const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update_campaign_status', 'campaign', req.params.id, oldData, updated, req);

  if (['In Progress', 'Completed', 'Failed'].includes(status)) {
    const customer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(campaign.user_id);
    if (customer) {
      const template = emailTemplates();
      if (status === 'In Progress') {
        sendEmail({ to: customer.email, ...template.statusInProgress(customer.name, campaign.id) });
      } else if (status === 'Completed' || status === 'Failed') {
        sendEmail({ to: customer.email, ...template.orderCompleted(customer.name, campaign.id, `${APP_URL}/orders/${campaign.id}`) });
      }
    }
  }

  res.json(updated);
});

router.post('/campaigns/:id/report', (req, res) => {
  const { fileUrl, fileType, fileSize, metrics, remarks } = req.body;
  if (!fileUrl || !fileType) return res.status(400).json({ error: 'fileUrl and fileType required' });

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const reportId = 'rpt-' + uuidv4().slice(0, 8);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reports (id, user_id, campaign_id, file_url, file_type, file_size, metrics_json, admin_remarks, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)
  `).run(reportId, campaign.user_id, req.params.id, fileUrl, fileType, fileSize || 0, JSON.stringify(metrics || {}), remarks || '', now);

  db.prepare('UPDATE campaigns SET report_file_url = ?, admin_remarks = ?, status = ?, updated_at = ? WHERE id = ?')
    .run(fileUrl, remarks || '', 'Completed', now, req.params.id);

  const order = db.prepare('SELECT id FROM orders WHERE campaign_id = ?').get(req.params.id);
  if (order) {
    db.prepare('UPDATE orders SET report_file_url = ?, admin_remarks = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(fileUrl, remarks || '', 'Completed', now, order.id);
  }

  logActivity(req.user.id, 'upload_report', 'campaign', req.params.id, null, { fileUrl, remarks }, req);

  const customer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(campaign.user_id);
  if (customer) {
    const template = emailTemplates();
    sendEmail({ to: customer.email, ...template.orderCompleted(customer.name, campaign.id, `${APP_URL}/orders/${order?.id || campaign.id}`) });
  }

  res.json({ id: reportId, campaignId: req.params.id, fileUrl, fileType, metrics, remarks });
});

router.get('/orders', (req, res) => {
  const { status, search, userId, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (status) { where += ' AND o.status = ?'; params.push(status); }
  if (search) { where += ' AND (o.id LIKE ? OR o.campaign_name LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  if (userId) { where += ' AND o.user_id = ?'; params.push(userId); }

  const rows = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE ${where}`).get(...params).count;

  res.json({ orders: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json(order);
});

router.put('/orders/:id/status', (req, res) => {
  const { status, remarks } = req.body;
  const validStatuses = ['Placed', 'In Progress', 'Completed', 'Failed', 'Queued', 'Paused', 'Cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const oldData = { ...order };
  const now = new Date().toISOString();
  
  db.prepare('UPDATE orders SET status = ?, admin_remarks = ?, updated_at = ? WHERE id = ?')
    .run(status, remarks || '', now, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update_order_status', 'order', req.params.id, oldData, updated, req);

  if (['In Progress', 'Completed', 'Failed'].includes(status)) {
    const customer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(order.user_id);
    if (customer) {
      const template = emailTemplates();
      if (status === 'In Progress') {
        sendEmail({ to: customer.email, ...template.statusInProgress(customer.name, order.id) });
      } else if (status === 'Completed' || status === 'Failed') {
        sendEmail({ to: customer.email, ...template.orderCompleted(customer.name, order.id, `${APP_URL}/orders/${order.id}`) });
      }
    }
  }

  res.json(updated);
});

router.post('/orders/:id/report', (req, res) => {
  const { fileUrl, fileType, fileSize, metrics, remarks } = req.body;
  if (!fileUrl || !fileType) return res.status(400).json({ error: 'fileUrl and fileType required' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const reportId = 'rpt-' + uuidv4().slice(0, 8);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reports (id, user_id, campaign_id, order_id, file_url, file_type, file_size, metrics_json, admin_remarks, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)
  `).run(reportId, order.user_id, order.campaign_id, req.params.id, fileUrl, fileType, fileSize || 0, JSON.stringify(metrics || {}), remarks || '', now);

  db.prepare('UPDATE orders SET report_file_url = ?, admin_remarks = ?, status = ?, updated_at = ? WHERE id = ?')
    .run(fileUrl, remarks || '', 'Completed', now, req.params.id);

  logActivity(req.user.id, 'upload_report', 'order', req.params.id, null, { fileUrl, remarks }, req);

  const customer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(order.user_id);
  if (customer) {
    const template = emailTemplates();
    sendEmail({ to: customer.email, ...template.orderCompleted(customer.name, order.id, `${APP_URL}/orders/${order.id}`) });
  }

  res.json({ id: reportId, orderId: req.params.id, fileUrl, fileType, metrics, remarks });
});

router.get('/tickets', (req, res) => {
  const { status, priority, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (status) { where += ' AND st.status = ?'; params.push(status); }
  if (priority) { where += ' AND st.priority = ?'; params.push(priority); }
  if (search) { where += ' AND (st.subject LIKE ? OR st.id LIKE ?)'; const s = `%${search}%`; params.push(s, s); }

  const rows = db.prepare(`
    SELECT st.*, u.name as customer_name, u.email as customer_email, a.name as admin_name
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    LEFT JOIN users a ON st.assigned_admin_id = a.id
    WHERE ${where}
    ORDER BY st.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM support_tickets WHERE ${where}`).get(...params).count;

  res.json({ tickets: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

router.get('/tickets/:id', (req, res) => {
  const ticket = db.prepare(`
    SELECT st.*, u.name as customer_name, u.email as customer_email, a.name as admin_name
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    LEFT JOIN users a ON st.assigned_admin_id = a.id
    WHERE st.id = ?
  `).get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const messages = db.prepare(`
    SELECT sm.*, u.name as sender_name, u.role as sender_role
    FROM support_messages sm LEFT JOIN users u ON sm.sender_id = u.id
    WHERE sm.ticket_id = ? ORDER BY sm.created_at ASC
  `).all(req.params.id);

  res.json({ ticket, messages });
});

router.post('/tickets/:id/messages', (req, res) => {
  const { messageBody, isInternal, attachments } = req.body;
  if (!messageBody) return res.status(400).json({ error: 'Message body required' });

  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const messageId = 'msg-' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO support_messages (id, ticket_id, sender_id, message_body, is_internal, attachments)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(messageId, req.params.id, req.user.id, messageBody, isInternal ? 1 : 0, JSON.stringify(attachments || []));

  db.prepare('UPDATE support_tickets SET status = ?, assigned_admin_id = ?, updated_at = ? WHERE id = ?')
    .run(ticket.status === 'open' ? 'in_progress' : ticket.status, req.user.id, new Date().toISOString(), req.params.id);

  const message = db.prepare('SELECT sm.*, u.name as sender_name, u.role as sender_role FROM support_messages sm LEFT JOIN users u ON sm.sender_id = u.id WHERE sm.id = ?').get(messageId);

  if (!isInternal) {
    const customer = db.prepare('SELECT email, name FROM users WHERE id = ?').get(ticket.user_id);
    if (customer) {
      const template = emailTemplates();
      sendEmail({ to: customer.email, ...template.ticketReply(customer.name, ticket.id, messageBody) });
    }
  }

  logActivity(req.user.id, 'ticket_message', 'ticket', req.params.id, null, { messageId, isInternal }, req);

  res.json(message);
});

router.put('/tickets/:id', (req, res) => {
  const { status, priority, assignedAdminId } = req.body;
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (priority) { updates.push('priority = ?'); params.push(priority); }
  if (assignedAdminId) { updates.push('assigned_admin_id = ?'); params.push(assignedAdminId); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  if (status === 'resolved' && ticket.status !== 'resolved') {
    updates.push('resolved_at = datetime("now")');
  }
  updates.push('updated_at = datetime("now")');
  params.push(req.params.id);

  db.prepare(`UPDATE support_tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update_ticket', 'ticket', req.params.id, ticket, updated, req);

  res.json(updated);
});

router.get('/activity', (req, res) => {
  const { userId, entityType, entityId, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (userId) { where += ' AND al.user_id = ?'; params.push(userId); }
  if (entityType) { where += ' AND al.entity_type = ?'; params.push(entityType); }
  if (entityId) { where += ' AND al.entity_id = ?'; params.push(entityId); }

  const rows = db.prepare(`
    SELECT al.*, u.name, u.email, u.role
    FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id
    WHERE ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM activity_logs WHERE ${where}`).get(...params).count;

  res.json({ activity: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

router.get('/reports', (req, res) => {
  const { status, search, userId, campaignId, orderId, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (search) { where += ' AND (r.id LIKE ? OR r.file_type LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  if (userId) { where += ' AND r.user_id = ?'; params.push(userId); }
  if (campaignId) { where += ' AND r.campaign_id = ?'; params.push(campaignId); }
  if (orderId) { where += ' AND r.order_id = ?'; params.push(orderId); }

  const rows = db.prepare(`
    SELECT r.*, u.name as customer_name, u.email as customer_email, c.campaign_name, o.campaign_name as order_campaign_name
    FROM reports r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN campaigns c ON r.campaign_id = c.id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE ${where}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM reports r LEFT JOIN users u ON r.user_id = u.id WHERE ${where}`).get(...params).count;

  res.json({ reports: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

export default router;