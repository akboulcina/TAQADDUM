import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const contractPath = path.resolve(process.cwd(), 'contracts/openapi/openapi.yaml');

const contract = YAML.parse(fs.readFileSync(contractPath, 'utf8'));

describe('OpenAPI contract', () => {
  it('uses OpenAPI 3.1', () => {
    expect(contract.openapi).toBe('3.1.0');
  });

  it('defines the required schemas', () => {
    const schemas = contract.components?.schemas ?? {};

    for (const name of ['Problem', 'CursorPage', 'ActorClaims', 'ETag', 'AuditRecord']) {
      expect(schemas[name], `missing schema: ${name}`).toBeDefined();
    }
  });

  it('defines unique operation IDs', () => {
    const operationIds: string[] = [];

    for (const pathItem of Object.values(contract.paths ?? {})) {
      for (const operation of Object.values(pathItem as Record<string, any>)) {
        if (operation && typeof operation === 'object' && 'operationId' in operation) {
          operationIds.push((operation as any).operationId);
        }
      }
    }

    expect(new Set(operationIds).size).toBe(operationIds.length);
  });
});
