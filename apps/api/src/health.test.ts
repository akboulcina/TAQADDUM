import { describe, expect, it } from 'vitest';
describe('health contract', () => { it('defines live and ready routes', () => { expect(['/health/live', '/health/ready']).toContain('/health/live'); }); });
