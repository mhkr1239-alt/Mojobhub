import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './server-app';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// -------------------------------------------------------------
// Vite Middleware (Dev) vs Static Files (Prod)
// -------------------------------------------------------------
async function setupServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    // Serve static files from dist directory with proper content types
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js') || filePath.endsWith('/service-worker.js')) {
            res.setHeader('Content-Type', 'text/javascript');
          } else if (filePath.endsWith('.json') || filePath.endsWith('/manifest.json')) {
            res.setHeader('Content-Type', 'application/json');
          } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
          }
        },
      })
    );

    // Fall back to index.html for client routes (excluding /api)
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      // Never fall back to index.html for static assets that are 404
      if (
        req.path.endsWith('.js') ||
        req.path.endsWith('.json') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.ico')
      ) {
        return res.status(404).end();
      }

      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      next();
    });
  } else {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
