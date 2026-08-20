import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { authenticateUser, getAuthStatus, saveUser, updateUserUsername } from './authStore.js';
import { getShareResponse } from './shareResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json());
  const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

  const uploadDir = path.join(__dirname, 'uploads');
  const hasBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!hasBlobStorage && !fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const diskStorage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
  const storage = hasBlobStorage || process.env.VERCEL ? multer.memoryStorage() : diskStorage;
  const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

  app.use('/uploads', express.static(uploadDir));

  app.get('/share/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found');
      return;
    }

    const responseMeta = getShareResponse(filePath);
    res.setHeader('Content-Type', responseMeta.contentType);
    res.setHeader('Content-Disposition', responseMeta.contentDisposition);
    res.sendFile(filePath);
  });

  app.get('/api/auth/status', asyncHandler(async (req, res) => {
    res.json(await getAuthStatus());
  }));

  app.post('/api/auth/signup', asyncHandler(async (req, res) => {
    const { email, password, username } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = await saveUser(email, password, username);
    if (!result.success) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.status(201).json({ message: 'Account created successfully.', user: { email, username: username || '' } });
  }));

  app.post('/api/auth/signin', asyncHandler(async (req, res) => {
    const { email, username, password } = req.body || {};
    const identifier = email || username;
    if (!identifier || !password) {
      res.status(400).json({ error: 'Email or username and password are required.' });
      return;
    }

    const result = await authenticateUser(identifier, password);
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({ message: 'Signed in successfully.', user: result.user });
  }));

  app.post('/api/auth/username', asyncHandler(async (req, res) => {
    const { email, username } = req.body || {};
    if (!email || !username) {
      res.status(400).json({ error: 'Email and username are required.' });
      return;
    }

    const result = await updateUserUsername(email, username);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ message: 'Username saved.', user: result.user });
  }));

  app.post('/api/upload', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (hasBlobStorage) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
      const blob = await put(`uploads/${filename}`, req.file.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: req.file.mimetype,
      });
      res.json({ url: blob.url, id: filename });
      return;
    }

    if (process.env.VERCEL) {
      res.status(503).json({ error: 'Persistent file storage is not configured.' });
      return;
    }

    const shareUrl = `${req.protocol}://${req.get('host')}/share/${encodeURIComponent(req.file.filename)}`;
    res.json({ url: shareUrl, id: req.file.filename });
  }));

  app.use((error, req, res, next) => {
    void next;
    console.error(error);
    if (error.message?.includes('Persistent account storage')) {
      res.status(503).json({ error: 'Account storage is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' });
      return;
    }

    res.status(500).json({ error: 'The server could not complete the request.' });
  });

  return app;
}

const app = createApp();

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

function startServer(port = 4000) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy. Trying ${port + 1} instead.`);
      server.close(() => startServer(port + 1));
      return;
    }

    console.error(error);
    process.exit(1);
  });
}

if (isDirectRun) {
  startServer();
}

export default app;