import fs from 'fs';
import path from 'path';

const ROUTER_DIR = path.join(process.cwd(), 'router');
const CONFIG_PATH = path.join(process.cwd(), 'src', 'config.json');

export interface RouteParam {
  name: string;
  required: boolean;
  description: string;
}

export interface RouteMeta {
  name: string;
  category: string;
  endpoint: string;
  method: string;
  description: string;
  params?: RouteParam[];
}

export interface AppConfig {
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  tags: Record<string, any[]>;
}

function extractMetaFromComment(filePath: string): RouteMeta | null {
  const content = fs.readFileSync(filePath, 'utf-8');

  const match = content.match(/\/\*\*[\s\r\n]*([\s\S]*?)\*\//);
  if (!match) return null;

  const raw = match[1]
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();

  if (!raw.startsWith('{') || !raw.endsWith('}')) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Failed parsing metadata in ${filePath}`);
    return null;
  }
}

function scanDirectory(dir: string, tags: Record<string, any[]>) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, tags);
      continue;
    }

    if (!item.endsWith('.ts')) continue;

    const meta = extractMetaFromComment(fullPath);
    if (!meta) continue;

    if (!tags[meta.category]) tags[meta.category] = [];

    tags[meta.category].push({
      name: meta.name,
      endpoint: meta.endpoint,
      filename: path.basename(item, '.ts'),
      method: String(meta.method || 'GET').toUpperCase(),
      params: Array.isArray(meta.params) ? meta.params : [],
      description: meta.description || ''
    });

    console.log(`📄 Scanned: ${meta.endpoint} -> ${meta.category}/${item}`);
  }
}

export function generateConfig(): AppConfig {
  const tags: Record<string, any[]> = {};

  if (!fs.existsSync(ROUTER_DIR)) {
    const emptyConfig: AppConfig = {
      title: 'Kuroneko Base API',
      description: 'Modern TypeScript REST API with Auto Documentation',
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      tags
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(emptyConfig, null, 2));
    return emptyConfig;
  }

  scanDirectory(ROUTER_DIR, tags);

  const config: AppConfig = {
    title: 'Epann Base API',
    description: 'Modern TypeScript REST API with Auto Documentation',
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    tags
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('✅ config.json generated automatically\n');

  return config;
}

export function loadConfig(): AppConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return generateConfig();
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return generateConfig();
  }
}