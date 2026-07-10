import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, '..', 'uploads');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.txt'];
const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.js', '.vbs', '.wsf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(new Error('File type not allowed'), false);
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Unsupported file type'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const router = Router();

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  if (req.file.size === 0) {
    return res.status(400).json({ error: 'Empty files are not allowed' });
  }
  res.json({
    id: req.file.filename.split('.')[0],
    filename: req.file.originalname,
    storedFilename: req.file.filename,
    size: req.file.size,
    type: req.file.mimetype,
    uploadedAt: new Date().toISOString(),
    path: `/uploads/${req.file.filename}`,
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
