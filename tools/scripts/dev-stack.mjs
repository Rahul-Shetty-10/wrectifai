import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAvailablePort } from './port-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const webRoot = path.join(repoRoot, 'apps', 'web');

const apiPreferredPort = process.env.API_PORT ?? '4200';
const webPreferredPort = process.env.WEB_PORT ?? '3000';
const apiPort = await findAvailablePort(apiPreferredPort);
const webPortSearchStart =
  Number(webPreferredPort) === apiPort ? apiPort + 1 : webPreferredPort;
const webPort = await findAvailablePort(webPortSearchStart);
const apiBaseUrl = `http://localhost:${apiPort}/api`;

if (String(apiPort) !== String(apiPreferredPort)) {
  console.log(`[dev] API port ${apiPreferredPort} is busy, using ${apiPort}`);
} else {
  console.log(`[dev] API using port ${apiPort}`);
}

if (Number(webPreferredPort) === apiPort) {
  console.log(
    `[dev] web port ${webPreferredPort} is reserved for API, using ${webPort}`
  );
} else if (String(webPort) !== String(webPreferredPort)) {
  console.log(`[dev] web port ${webPreferredPort} is busy, using ${webPort}`);
} else {
  console.log(`[dev] web using port ${webPort}`);
}

console.log(`[dev] web will call ${apiBaseUrl}`);

const children = [
  spawn('npx', ['nx', 'serve', 'api'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(apiPort),
      API_PORT: String(apiPort),
    },
    shell: true,
    stdio: 'inherit',
  }),
  spawn('npx', ['next', 'dev', '--port', String(webPort)], {
    cwd: webRoot,
    env: {
      ...process.env,
      PORT: String(webPort),
      WEB_PORT: String(webPort),
      API_PORT: String(apiPort),
      NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
    },
    shell: true,
    stdio: 'inherit',
  }),
];

let shuttingDown = false;

function stopChildren() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!shuttingDown && code) {
      stopChildren();
      process.exit(code);
    }
  });
}
