import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import uploadRoutes from './routes/upload.js';
import campaignRoutes from './routes/campaign.js';
import orderRoutes from './routes/order.js';
import aiRoutes from './routes/ai.js';
import settingsRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb', strict: false }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

app.use('/api/upload', uploadRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message || 'Bad request' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`XPAC Server running on port ${PORT}`);
});
