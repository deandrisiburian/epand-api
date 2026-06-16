import { Express, RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default function autoloadRoutes(app: Express) {
  try {
    const configPath = path.join(__dirname, '..', 'src', 'config.json');

    if (!fs.existsSync(configPath)) {
      console.log('⚠️ config.json not found');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (!config.tags || Object.keys(config.tags).length === 0) {
      console.log('⚠️ No routes in config.json');
      return;
    }

    console.log('\n🔄 Auto loading routes...\n');

    Object.entries(config.tags).forEach(([category, routes]: [string, any]) => {
      (routes as any[]).forEach((route: any) => {
        try {
          const isProduction = process.env.NODE_ENV === 'production';
          const baseDir = isProduction
            ? path.join(__dirname, '..', 'router')
            : path.join(process.cwd(), 'router');
          const filePath = path.join(baseDir, category, `${route.filename}.js`);

          if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Not found: ${filePath}`);
            return;
          }

          const imported = require(filePath);
          const handler: RequestHandler = imported.default || imported;

          if (typeof handler !== 'function') {
            console.log(`❌ Invalid: ${filePath}`);
            return;
          }

          const method = String(route.method || 'GET').toLowerCase();

          switch (method) {
            case 'get': app.get(route.endpoint, handler); break;
            case 'post': app.post(route.endpoint, handler); break;
            case 'put': app.put(route.endpoint, handler); break;
            case 'delete': app.delete(route.endpoint, handler); break;
            default: return;
          }

          console.log(`✅ Loaded: [${route.method}] ${route.endpoint}`);
        } catch (err: any) {
          console.error(`❌ ${route.endpoint}: ${err.message}`);
        }
      });
    });

    console.log('\n🚀 Done!\n');
  } catch (err: any) {
    console.error('❌ autoloadRoutes:', err.message);
  }
}