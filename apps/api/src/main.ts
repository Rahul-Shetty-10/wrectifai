import { getEnv } from './config/env';
import { createApp } from './app';

const { host, port } = getEnv();
const app = createApp();

function listenWithFallback(nextPort: number) {
  const server = app.listen(nextPort, host, () => {
    console.log(`[api] listening on http://${host}:${nextPort}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = nextPort + 1;
      console.warn(
        `[api] port ${nextPort} is busy, trying ${fallbackPort}`
      );
      listenWithFallback(fallbackPort);
      return;
    }

    throw error;
  });
}

listenWithFallback(port);
