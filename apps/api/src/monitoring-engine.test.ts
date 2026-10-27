// @vitest-environment node
import { expect, test } from 'vitest';
import { calculate, validateFacts } from './monitoring-engine.js';

test('données absentes ne deviennent pas des valeurs vertes', () => {
  const result = calculate({});
  expect(result.kpis['AV2']?.status).toBe('not_calculable');
  expect(result.alerts['AL02']?.triggered).toBeNull();
});

test('seuils AV2 inclus côté meilleur niveau', () => {
  const common = {
    totalEstimatedCost: 100,
    elapsedDays: 100,
    currentDurationDays: 100,
  };
  expect(
    calculate({ ...common, performedValue: 90 }).kpis['AV2']?.status,
  ).toBe('green');
  expect(
    calculate({ ...common, performedValue: 70 }).kpis['AV2']?.status,
  ).toBe('orange');
});

test('délai non plafonné et trois règles déclenchées', () => {
  const result = calculate({
    performedValue: 30,
    totalEstimatedCost: 100,
    elapsedDays: 360,
    currentDurationDays: 300,
    initialDurationDays: 100,
    releasedArea: 40,
    requiredArea: 100,
    unblockPlanValidated: false,
    projectCompleted: false,
  });
  expect(result.kpis['DL1']?.value).toBe(120);
  expect(result.kpis['AV2']?.value).toBe(0.25);
  for (const id of ['AL02', 'AL06', 'AL13']) {
    expect(result.alerts[id]?.triggered).toBe(true);
  }
});

test('zéro au dénominateur et temps nul restent non calculables', () => {
  expect(
    calculate({ performedValue: 0, totalEstimatedCost: 0 }).kpis['AV1']?.value,
  ).toBeNull();
  expect(
    calculate({
      performedValue: 10,
      totalEstimatedCost: 100,
      elapsedDays: 0,
      currentDurationDays: 100,
    }).kpis['AV2']?.value,
  ).toBeNull();
});

test('frontières strictes des alertes', () => {
  const result = calculate({
    elapsedDays: 100,
    currentDurationDays: 100,
    initialDurationDays: 50,
    releasedArea: 50,
    requiredArea: 100,
    unblockPlanValidated: false,
    projectCompleted: false,
  });
  for (const id of ['AL02', 'AL13', 'AL06']) {
    expect(result.alerts[id]?.triggered).toBe(false);
  }
});

test('données invalides refusées', () => {
  for (const value of [
    { elapsedDays: -1 },
    { elapsedDays: '' },
    { elapsedDays: Infinity },
    { projectCompleted: 'Non' },
    { unknown: 1 },
    { performedValue: 101, totalEstimatedCost: 100 },
  ]) {
    expect(() => validateFacts(value)).toThrow();
  }
});

test('réévaluation déterministe', () => {
  expect(calculate({})).toEqual(calculate({}));
});
