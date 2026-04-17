import { getEnv } from './config/env';
import { createApp } from './app';

const { host, port } = getEnv();
const app = createApp();

app.listen(port, host, () => {
  console.log("Production server started");
  console.log(`[api] listening on http://${host}:${port}`);
});
