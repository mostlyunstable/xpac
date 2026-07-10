import { Router } from 'express';

const router = Router();
const orders = new Map();

router.post('/', (req, res) => {
  const year = new Date().getFullYear();
  const seq = String(orders.size + 1).padStart(6, '0');
  const id = `IVR-${year}-${seq}`;
  const ALLOWED_STATUSES = ['Created', 'Processing', 'Queued', 'Running', 'Completed', 'Failed', 'Cancelled'];
  const status = ALLOWED_STATUSES.includes(req.body?.status) ? req.body.status : 'Created';
  const order = {
    id,
    ...req.body,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.set(id, order);
  res.json(order);
});

router.get('/', (req, res) => {
  let list = Array.from(orders.values());
  const { search, status, sort, order: sortOrder, page = 1, limit = 10 } = req.query;

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      o => o.id.toLowerCase().includes(s) ||
        (o.campaignName && o.campaignName.toLowerCase().includes(s))
    );
  }

  if (status && status !== 'All') {
    list = list.filter(o => o.status === status);
  }

  list.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const total = list.length;
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + Number(limit));

  res.json({ orders: paginated, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
});

router.get('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.put('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const updated = { ...order, ...req.body, updatedAt: new Date().toISOString() };
  orders.set(req.params.id, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (!orders.has(req.params.id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  orders.delete(req.params.id);
  res.json({ success: true });
});

export default router;
