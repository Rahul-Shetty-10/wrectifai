import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAvailablePort } from './port-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const webRoot = path.join(repoRoot, 'apps', 'web');
const preferredWebPort = process.env.WEB_PORT ?? '3000';
const webPort = await findAvailablePort(preferredWebPort);

if (String(webPort) !== String(preferredWebPort)) {
  console.log(`[start:web] port ${preferredWebPort} is busy, using ${webPort}`);
} else {
  console.log(`[start:web] using port ${webPort}`);
}

const child = spawn('npx', ['next', 'start', '--port', String(webPort)], {
  cwd: webRoot,
  env: {
    ...process.env,
    PORT: String(webPort),
    WEB_PORT: String(webPort),
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
