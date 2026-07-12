import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(join(dataDir, 'xpac.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin', 'customer')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted')),
      company TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      last_login TEXT,
      email_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      campaign_description TEXT DEFAULT '',
      audio_file_url TEXT DEFAULT '',
      contact_file_url TEXT DEFAULT '',
      mapping TEXT,
      ai_config TEXT,
      schedule_config TEXT,
      schedule TEXT,
      contact_count INTEGER DEFAULT 0,
      estimated_cost TEXT DEFAULT '0.00',
      estimated_duration TEXT DEFAULT '0 min',
      status TEXT NOT NULL DEFAULT 'Placed' CHECK(status IN ('Placed', 'In Progress', 'Completed', 'Failed', 'Paused', 'Cancelled')),
      admin_remarks TEXT DEFAULT '',
      report_file_url TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT,
      campaign_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Placed' CHECK(status IN ('Placed', 'In Progress', 'Completed', 'Failed', 'Queued', 'Paused', 'Cancelled')),
      audio_file_url TEXT DEFAULT '',
      contact_file_url TEXT DEFAULT '',
      contact_count INTEGER DEFAULT 0,
      estimated_cost TEXT DEFAULT '0.00',
      estimated_duration TEXT DEFAULT '0 min',
      schedule TEXT,
      report_file_url TEXT DEFAULT '',
      admin_remarks TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT,
      order_id TEXT,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      metrics_json TEXT,
      admin_remarks TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'generated' CHECK(status IN ('generated', 'delivered', 'failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      assigned_admin_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message_body TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      attachments TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      old_data TEXT,
      new_data TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      profile TEXT NOT NULL DEFAULT '{}',
      preferences TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_campaign ON orders(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_campaign ON reports(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_reports_order ON reports(order_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_admin_id);
    CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const customerHash = bcrypt.hashSync('password123', 10);

    db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, company) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'admin-001', 'System Admin', 'admin@xpac.io', adminHash, 'admin', 'active', 'XPAC Inc.'
    );
    db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, company) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'user-001', 'John Customer', 'john@example.com', customerHash, 'customer', 'active', 'Acme Corp'
    );
    db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, company) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'user-002', 'Jane Smith', 'jane@example.com', customerHash, 'customer', 'active', 'TechStart Inc'
    );
    db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, company) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'user-003', 'Bob Wilson', 'bob@example.com', customerHash, 'customer', 'suspended', 'SmallBiz LLC'
    );
    console.log('Seeded default users (change passwords immediately):');
    console.log('  Admin:  admin@xpac.io');
    console.log('  Customer: john@example.com');
  }
}

migrate();

export function logActivity(userId, action, entityType, entityId, oldData = null, newData = null, req = null) {
  const id = 'act-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    action,
    entityType,
    entityId,
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    req?.ip || null,
    req?.headers?.['user-agent'] || null
  );
}

export default db;
export { db };
