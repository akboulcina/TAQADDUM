import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

async function main() {
  const email = process.argv[2];
  if (
    process.argv.length !== 4 ||
    process.argv[3] !== '--activate-inactive' ||
    !email ||
    !/^[^@\s]+@[^@\s]+$/.test(email)
  ) {
    throw new Error('Invalid arguments');
  }
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl?.trim() || process.stdin.isTTY) {
    throw new Error('Private configuration and redirected stdin required');
  }
  const password = readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  const bytes = Buffer.byteLength(password, 'utf8');
  if (bytes < 16 || bytes > 72 || /[\r\n\0]/.test(password)) {
    throw new Error('Invalid password input');
  }
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  try {
    await client.connect();
    const result = await client.query(
      `UPDATE public.users
       SET password_hash = crypt($1, gen_salt('bf')), is_active = true
       WHERE email = $2 AND is_active = false
       RETURNING id`,
      [password, email],
    );
    if (result.rowCount !== 1) {
      throw new Error('No matching inactive account');
    }
    console.log('One inactive account activated; roles unchanged.');
  } finally {
    await client.end();
  }
}

main().catch(() => {
  console.error('Activation failed; no credentials are printed.');
  process.exitCode = 1;
});
