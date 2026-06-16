import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import autoloadRoutes from './src/autoload';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Landing
app.get('/', (req, res) => {
  const file = path.join(publicDir, 'landing.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.json({ status: true, message: 'Epann API running!' });
});

// Docs
app.get('/docs', (req, res) => {
  const file = path.join(publicDir, 'docs.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.send('<h1>📖 Docs not found</h1>');
});

// Routes
autoloadRoutes(app);

export default app;