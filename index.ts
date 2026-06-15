import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import './src/scanner';
import autoloadRoutes from './src/autoload';
import config from './src/config.json';

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL === '1';

// Path yang aman untuk Vercel & Local
const publicPath = isVercel 
  ? path.join(process.cwd(), 'dist', 'public')
  : path.join(__dirname, 'public');

let visitors = { count: 0 };
const VISITOR_PATH = path.join(process.cwd(), 'visitors.json');

if (!isVercel && fs.existsSync(VISITOR_PATH)) {
  visitors = JSON.parse(fs.readFileSync(VISITOR_PATH, 'utf-8'));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(publicPath));   // ← Penting

// Routes Utama
app.get('/', (req, res) => {
  visitors.count++;
  if (!isVercel) {
    fs.writeFileSync(VISITOR_PATH, JSON.stringify(visitors));
  }
  res.sendFile(path.join(publicPath, 'landing.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(publicPath, 'docs.html'));
});

app.get('/api/status', (req, res) => {
  res.json({
    status: true,
    ...config,
    visitors: visitors.count,
    environment: isVercel ? 'vercel' : 'local'
  });
});

// Load dynamic routes
autoloadRoutes(app);

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

app.listen(PORT, () => {
  console.log(chalk.magentaBright.bold('\n🐾 Epann Base API v2.0.0'));
  console.log(chalk.gray(`   Server → http://localhost:${PORT}`));
  console.log(chalk.gray(`   Docs   → http://localhost:${PORT}/docs\n`));
});
