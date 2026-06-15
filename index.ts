import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import autoloadRoutes from './src/autoload';
import { loadConfig, generateConfig } from './src/scanner';

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const VISITOR_PATH = path.join(ROOT_DIR, 'visitors.json');

let visitors = { count: 0 };

if (fs.existsSync(VISITOR_PATH)) {
  try {
    visitors = JSON.parse(fs.readFileSync(VISITOR_PATH, 'utf-8'));
  } catch {
    visitors = { count: 0 };
  }
}

// generate config at startup
if (process.env.NODE_ENV !== 'production') {
  generateConfig();
}

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(PUBLIC_DIR));

app.get('/', (_req, res) => {
  visitors.count++;
  fs.writeFileSync(VISITOR_PATH, JSON.stringify(visitors, null, 2));
  res.sendFile(path.join(PUBLIC_DIR, 'landing.html'));
});

app.get('/docs', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'docs.html'));
});

app.get('/api/status', (_req, res) => {
  const config = loadConfig();

  res.json({
    status: true,
    visitors: visitors.count,
    ...config
  });
});

autoloadRoutes(app);

app.use((_req, res) => {
  const file404 = path.join(PUBLIC_DIR, '404.html');
  if (fs.existsSync(file404)) {
    return res.status(404).sendFile(file404);
  }

  return res.status(404).json({
    status: false,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(chalk.magentaBright.bold('\n🐾 Epann Base API'));
  console.log(chalk.gray(`   Local: http://localhost:${PORT}`));
  console.log(chalk.gray(`   Docs : http://localhost:${PORT}/docs\n`));
});