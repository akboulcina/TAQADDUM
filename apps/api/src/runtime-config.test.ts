// @vitest-environment node
import { expect, test } from 'vitest';
import { readRuntimeConfig } from './runtime-config.js';

const database = 'postgresql://localhost/runtime_config_test';

test('aucune connexion implicite si DATABASE_URL est absente', () => {
  expect(() => readRuntimeConfig({})).toThrow('DATABASE_URL');
  expect(() => readRuntimeConfig({ DATABASE_URL: ' ' })).toThrow('DATABASE_URL');
});

test('configuration locale explicite et origines exactes', () => {
  const result = readRuntimeConfig({ DATABASE_URL: database });
  expect(result.databaseUrl).toBe(database);
  expect(result.port).toBe(3000);
  expect(result.corsAllowedOrigins.has('http://localhost:5173')).toBe(true);
  expect(result.corsAllowedOrigins.has('https://other.invalid')).toBe(false);
});

test('origines personnalisées et doublons', () => {
  const result = readRuntimeConfig({
    DATABASE_URL: database,
    PORT: '3100',
    CORS_ALLOWED_ORIGINS: 'https://frontend.example.invalid, https://frontend.example.invalid',
  });
  expect(result.port).toBe(3100);
  expect([...result.corsAllowedOrigins]).toEqual(['https://frontend.example.invalid']);
});

test('liste vide désactive les autorisations cross-origin', () => {
  expect(
    readRuntimeConfig({ DATABASE_URL: database, CORS_ALLOWED_ORIGINS: '' }).corsAllowedOrigins.size,
  ).toBe(0);
});

test('origines avec chemin, joker ou credentials refusées', () => {
  for (const origin of [
    '*',
    'https://*.example.invalid',
    'https://frontend.example.invalid/path',
    'https://frontend.example.invalid/',
    'https://user@frontend.example.invalid',
    'null',
  ]) {
    expect(() =>
      readRuntimeConfig({
        DATABASE_URL: database,
        CORS_ALLOWED_ORIGINS: origin,
      }),
    ).toThrow('CORS_ALLOWED_ORIGINS');
  }
});

test('ports et protocoles invalides refusés sans divulguer la valeur', () => {
  for (const port of ['0', '65536', '-1', '3000x', '']) {
    expect(() => readRuntimeConfig({ DATABASE_URL: database, PORT: port })).toThrow('PORT');
  }
  for (const url of ['not-a-url', 'https://localhost/database']) {
    expect(() => readRuntimeConfig({ DATABASE_URL: url })).toThrow(
      'DATABASE_URL doit être une URL PostgreSQL valide',
    );
  }
});

test('production refusée avant durcissement complet', () => {
  expect(() => readRuntimeConfig({ DATABASE_URL: database, NODE_ENV: 'production' })).toThrow(
    'Production désactivée',
  );
  expect(() => readRuntimeConfig({ DATABASE_URL: database, NODE_ENV: 'unknown' })).toThrow(
    'NODE_ENV invalide',
  );
});
