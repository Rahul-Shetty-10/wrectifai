import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAvailablePort } from './port-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const webRoot = path.join(repoRoot, 'apps', 'web');
const preferredWebPort = process.env.WEB_PORT ?? '3000';
const apiPort = process.env.API_PORT ?? '4200';
const webPort = await findAvailablePort(preferredWebPort);
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:${apiPort}/api`;

if (String(webPort) !== String(preferredWebPort)) {
  console.log(`[dev:web] port ${preferredWebPort} is busy, using ${webPort}`);
} else {
  console.log(`[dev:web] using port ${webPort}`);
}

console.log(`[dev:web] API base URL: ${apiBaseUrl}`);

const child = spawn('npx', ['next', 'dev', '--port', String(webPort)], {
  cwd: webRoot,
  env: {
    ...process.env,
    PORT: String(webPort),
    WEB_PORT: String(webPort),
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
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
