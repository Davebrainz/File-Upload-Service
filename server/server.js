import express from 'express';
import multer from 'multer';
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
  app.use(cors());
  app.use(express.json());

  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
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

  app.get('/api/auth/status', (req, res) => {
    res.json(getAuthStatus());
  });

  app.post('/api/auth/signup', (req, res) => {
    const { email, password, username } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = saveUser(email, password, username);
    if (!result.success) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.status(201).json({ message: 'Account created successfully.', user: { email, username: username || '' } });
  });

  app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = authenticateUser(email, password);
    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({ message: 'Signed in successfully.', user: result.user });
  });

  app.post('/api/auth/username', (req, res) => {
    const { email, username } = req.body || {};
    if (!email || !username) {
      res.status(400).json({ error: 'Email and username are required.' });
      return;
    }

    const result = updateUserUsername(email, username);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ message: 'Username saved.', user: result.user });
  });

  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const shareUrl = `${req.protocol}://${req.get('host')}/share/${req.file.filename}`;
    res.json({ url: shareUrl, id: req.file.filename });
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