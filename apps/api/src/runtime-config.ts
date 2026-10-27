export type RuntimeConfig = {
  databaseUrl: string;
  port: number;
  corsAllowedOrigins: ReadonlySet<string>;
};

export function readRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const mode = env['NODE_ENV'] ?? 'local';
  if (!['local', 'development', 'test', 'production'].includes(mode)) {
    throw new Error('NODE_ENV invalide');
  }
  if (mode === 'production') {
    throw new Error('Production désactivée tant que les contrôles Release 0.5 ne sont pas validés');
  }
  const databaseUrl = env['DATABASE_URL']?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL doit être fournie par l’environnement');
  }
  try {
    const parsed = new URL(databaseUrl);
    if (
      !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.pathname.length <= 1
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL doit être une URL PostgreSQL valide');
  }
  const rawPort = env['PORT'] ?? '3000';
  if (!/^\d+$/.test(rawPort)) throw new Error('PORT invalide');
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT invalide');
  }
  const origins = env['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:5173,http://127.0.0.1:5173';
  const corsAllowedOrigins = new Set<string>();
  for (const entry of origins.split(',').map((value) => value.trim())) {
    if (!entry) continue;
    try {
      const url = new URL(entry);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.origin !== entry ||
        url.username ||
        url.password ||
        url.hostname.includes('*')
      ) {
        throw new Error();
      }
      corsAllowedOrigins.add(entry);
    } catch {
      throw new Error(
        'CORS_ALLOWED_ORIGINS doit contenir des origines HTTP(S) exactes, sans chemin ni joker',
      );
    }
  }
  return { databaseUrl, port, corsAllowedOrigins };
}
