export function getEnv() {
  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 4200,
    authOtpCode: process.env.AUTH_OTP_CODE ?? '123456',
    databaseUrl: process.env.DATABASE_URL,
  };
}
