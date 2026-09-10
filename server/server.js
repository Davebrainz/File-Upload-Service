import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { authenticateUser, getAuthStatus, saveUser, updateUserUsername } from './authStore.js';
import { uploadFile } from './supabaseStore.js';

const __filename = fileURLToPath(import.meta.url);

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(path.dirname(__filename), 'uploads')));
  const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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

    const result = await uploadFile(req.file);
    res.json({ url: result.url, id: result.key });
  }));

  app.use((error, req, res, next) => {
    void next;
    console.error(error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File size exceeds 50MB limit.' });
      return;
    }

    if (error.message?.includes('Persistent account storage')) {
      res.status(503).json({ error: 'Account storage is not configured. Add Supabase Storage credentials in Vercel.' });
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
    console.log(`Server running on port ${port}`);
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