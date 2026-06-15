import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import autoloadRoutes from './src/autoload';
import { loadConfig } from './src/scanner';

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;

// Path public: di Vercel pakai process.cwd(), local pakai __dirname
const PUBLIC_DIR = isVercel 
  ? path.join(process.cwd(), 'public')
  : path.join(__dirname, 'public');

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(PUBLIC_DIR));

// Routes
app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'landing.html'));
});

app.get('/docs', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'docs.html'));
});

app.get('/api/status', (_req, res) => {
  const config = loadConfig();
  res.json({
    status: true,
    visitors: 0, // Nonaktifkan visitor count file-based di Vercel
    ...config
  });
});

autoloadRoutes(app);

// 404 Handler
app.use((_req, res) => {
  const file404 = path.join(PUBLIC_DIR, '404.html');
  if (fs.existsSync(file404)) {
    return res.status(404).sendFile(file404);
  }
  res.status(404).json({ status: false, message: 'Not found' });
});

// Listen hanya untuk local development
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(chalk.magentaBright.bold('\n🐾 Kuroneko Base API'));
    console.log(chalk.gray(`   Local: http://localhost:${PORT}`));
    console.log(chalk.gray(`   Docs : http://localhost:${PORT}/docs\n`));
  });
}

// EXPORT WAJIB UNTUK VERCEL
export default app;
