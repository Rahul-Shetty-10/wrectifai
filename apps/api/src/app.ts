import express from 'express';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { getEnv } from './config/env';
import { ensureDbBootstrap } from './db/bootstrap';

export function createApp() {
  const app = express();
  const { webOrigins } = getEnv();
  const originAllowlist = new Set(webOrigins);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    originAllowlist.add(`https://${vercelUrl}`);
  }
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderExternalUrl) {
    originAllowlist.add(renderExternalUrl);
  }

  const bootstrap = ensureDbBootstrap();

  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const hasOrigin = typeof requestOrigin === 'string' && requestOrigin.length > 0;
    const isAllowed = hasOrigin ? originAllowlist.has(requestOrigin) : true;

    if (!isAllowed) {
      if (req.method === 'OPTIONS') return res.sendStatus(403);
      return res.status(403).json({ message: 'Origin not allowed' });
    }

    const allowOrigin = hasOrigin ? requestOrigin : [...originAllowlist][0];
    if (allowOrigin) {
      res.header('Access-Control-Allow-Origin', allowOrigin);
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('Referrer-Policy', 'no-referrer');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  app.use(express.json());
  app.use(async (_req, _res, next) => {
    try {
      await bootstrap;
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use('/api', apiRouter);
  app.use(errorHandler);

  return app;
}
