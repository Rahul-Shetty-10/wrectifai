import { getEnv } from './config/env';
import { createApp } from './app';

const env = getEnv();
const { host, port, appEnv } = env;
const app = createApp();

app.listen(port, host, () => {
  console.log(`[api] (${appEnv}) listening on http://${host}:${port}`);
});
