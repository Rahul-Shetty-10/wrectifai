import { spawn } from 'node:child_process';
import { findAvailablePort } from './port-utils.mjs';

const preferredPort = process.env.API_PORT ?? process.env.PORT ?? '4200';
const port = await findAvailablePort(preferredPort);

if (String(port) !== String(preferredPort)) {
  console.log(`[dev:api] port ${preferredPort} is busy, using ${port}`);
} else {
  console.log(`[dev:api] using port ${port}`);
}

const child = spawn('npx', ['nx', 'serve', 'api'], {
  env: {
    ...process.env,
    PORT: String(port),
    API_PORT: String(port),
  },
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
