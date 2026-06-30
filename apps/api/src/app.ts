import express from 'express';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.WEB_ORIGIN ?? '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    next();
  });
  app.options('*', (_req, res) => res.sendStatus(204));
  app.use(express.json());
  app.use('/api', apiRouter);
  app.use(errorHandler);

  return app;
}
