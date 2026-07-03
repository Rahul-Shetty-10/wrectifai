import net from 'node:net';

export function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

export async function findAvailablePort(preferredPort, host = '127.0.0.1') {
  let port = Number(preferredPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid port: ${preferredPort}`);
  }

  while (!(await isPortAvailable(port, host))) {
    port += 1;
  }

  return port;
}
