import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateFacts } from './monitoring-engine.js';
test('données absentes ne deviennent pas des valeurs vertes', () => {
  const r = calculate({});
  assert.equal(r.kpis['AV2']?.status, 'not_calculable');
  assert.equal(r.alerts['AL02']?.triggered, null);
});
test('seuils AV2 inclus côté meilleur niveau', () => {
  assert.equal(calculate({ performedValue: 90, totalEstimatedCost: 100, elapsedDays: 100, currentDurationDays: 100 }).kpis['AV2']?.status, 'green');
  assert.equal(calculate({ performedValue: 70, totalEstimatedCost: 100, elapsedDays: 100, currentDurationDays: 100 }).kpis['AV2']?.status, 'orange');
});
test('délai non plafonné et trois règles déclenchées', () => {
  const r = calculate({ performedValue: 30, totalEstimatedCost: 100, elapsedDays: 360, currentDurationDays: 300, initialDurationDays: 100, releasedArea: 40, requiredArea: 100, unblockPlanValidated: false, projectCompleted: false });
  assert.equal(r.kpis['DL1']?.value, 120);
  assert.equal(r.kpis['AV2']?.value, 0.25);
  for (const id of ['AL02','AL06','AL13']) assert.equal(r.alerts[id]?.triggered, true);
});
test('zéro au dénominateur et temps nul restent non calculables', () => {
  assert.equal(calculate({ performedValue: 0, totalEstimatedCost: 0 }).kpis['AV1']?.value, null);
  assert.equal(calculate({ performedValue: 10, totalEstimatedCost: 100, elapsedDays: 0, currentDurationDays: 100 }).kpis['AV2']?.value, null);
});
test('frontières strictes des alertes', () => {
  const r = calculate({ elapsedDays: 100, currentDurationDays: 100, initialDurationDays: 50, releasedArea: 50, requiredArea: 100, unblockPlanValidated: false, projectCompleted: false });
  assert.equal(r.alerts['AL02']?.triggered, false);
  assert.equal(r.alerts['AL13']?.triggered, false);
  assert.equal(r.alerts['AL06']?.triggered, false);
});
test('données invalides refusées', () => {
  for (const value of [{ elapsedDays: -1 }, { elapsedDays: '' }, { elapsedDays: Infinity }, { projectCompleted: 'Non' }, { unknown: 1 }, { performedValue: 101, totalEstimatedCost: 100 }]) assert.throws(() => validateFacts(value));
});
test('réévaluation déterministe', () => { assert.deepEqual(calculate({}), calculate({})); });
