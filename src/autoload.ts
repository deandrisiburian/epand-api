import { Express, RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { generateConfig, loadConfig } from './scanner';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default function autoloadRoutes(app: Express) {
  if (process.env.NODE_ENV !== 'production') {
    generateConfig();
  }

  const config = loadConfig();

  console.log('\n🔄 Auto loading routes...\n');

  Object.entries(config.tags).forEach(([category, routes]) => {
    routes.forEach((route: any) => {
      const isProduction = process.env.NODE_ENV === 'production';

      const tsPath = path.join(process.cwd(), 'router', category, `${route.filename}.ts`);
      const jsPath = path.join(process.cwd(), 'dist', 'router', category, `${route.filename}.js`);

      const filePath = isProduction ? jsPath : tsPath;

      try {
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️ File not found: ${filePath}`);
          return;
        }

        delete require.cache[require.resolve(filePath)];
        const imported = require(filePath);
        const handler: RequestHandler = imported.default;

        if (typeof handler !== 'function') {
          console.log(`❌ Invalid handler in ${filePath}`);
          return;
        }

        const method = String(route.method || 'GET').toLowerCase() as Lowercase<HttpMethod>;

        switch (method) {
          case 'get':
            app.get(route.endpoint, handler);
            break;
          case 'post':
            app.post(route.endpoint, handler);
            break;
          case 'put':
            app.put(route.endpoint, handler);
            break;
          case 'delete':
            app.delete(route.endpoint, handler);
            break;
          case 'patch':
            app.patch(route.endpoint, handler);
            break;
          default:
            console.log(`⚠️ Unsupported method ${route.method} for ${route.endpoint}`);
            return;
        }

        console.log(`✅ Loaded: [${route.method}] ${route.endpoint} -> ${category}/${route.filename}`);
      } catch (error) {
        console.error(`❌ Failed to load route ${route.endpoint}`);
        console.error(error);
      }
    });
  });

  console.log('\n🚀 All routes loaded!\n');
}