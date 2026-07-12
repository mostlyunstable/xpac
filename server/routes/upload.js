import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { uploadFile } from '../services/storage.js';

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.mp3', '.wav'];
const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.js', '.vbs', '.wsf'];
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

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
  fileFilter,
  limits: { fileSize: MAX_AUDIO_SIZE },
});

const router = Router();

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  if (req.file.size === 0) {
    return res.status(400).json({ error: 'Empty files are not allowed' });
  }
  
  try {
    const result = await uploadFile(req.file);
    res.json({
      id: result.key.split('.')[0],
      filename: req.file.originalname,
      storedFilename: result.key,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      path: result.url,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10MB (25MB for audio).' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
