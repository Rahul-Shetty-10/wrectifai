import { query } from '../config/database';

export async function getHealthStatus() {
  let database = 'disconnected';
  try {
    const result = await query('SELECT 1');
    if (result && result.rowCount && result.rowCount > 0) {
      database = 'connected';
    }
  } catch (error) {
    console.error('[health] database ping failed:', error);
  }

  return {
    service: 'wrectifai-api',
    status: 'ok',
    database,
    timestamp: new Date().toISOString(),
  };
}
