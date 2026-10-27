export type Signal = 'green' | 'orange' | 'red' | 'information' | 'not_calculable';
export type Facts = {
  performedValue?: number;
  totalEstimatedCost?: number;
  elapsedDays?: number;
  currentDurationDays?: number;
  initialDurationDays?: number;
  releasedArea?: number;
  requiredArea?: number;
  unblockPlanValidated?: boolean;
  projectCompleted?: boolean;
};
export type Result = { value: number | null; status: Signal; explanation: string };
export type Evaluation = { triggered: boolean | null; explanation: string };
export const calculationVersion = 'monitoring-1';
const fields = [
  'performedValue',
  'totalEstimatedCost',
  'elapsedDays',
  'currentDurationDays',
  'initialDurationDays',
  'releasedArea',
  'requiredArea',
] as const;
export function validateFacts(input: unknown): Facts {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Données sources invalides');
  const raw = input as Record<string, unknown>;
  const allowed = new Set<string>([...fields, 'unblockPlanValidated', 'projectCompleted']);
  for (const key of Object.keys(raw))
    if (!allowed.has(key)) throw new Error(`Champ inconnu: ${key}`);
  for (const key of fields) {
    const value = raw[key];
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0))
      throw new Error(`Nombre positif ou nul requis: ${key}`);
  }
  for (const key of ['unblockPlanValidated', 'projectCompleted'])
    if (raw[key] !== undefined && typeof raw[key] !== 'boolean')
      throw new Error(`Booléen requis: ${key}`);
  if (
    typeof raw['performedValue'] === 'number' &&
    typeof raw['totalEstimatedCost'] === 'number' &&
    raw['performedValue'] > raw['totalEstimatedCost']
  )
    throw new Error('Travaux réalisés supérieurs au coût total estimé');
  if (
    typeof raw['releasedArea'] === 'number' &&
    typeof raw['requiredArea'] === 'number' &&
    raw['releasedArea'] > raw['requiredArea']
  )
    throw new Error('Emprise libérée supérieure à l’emprise requise');
  return { ...raw } as Facts;
}
function ratio(a: number | undefined, b: number | undefined, scale = 1): number | null {
  if (a === undefined || b === undefined || b <= 0) return null;
  const value = (a / b) * scale;
  return Number.isFinite(value) ? value : null;
}
function result(
  value: number | null,
  formula: string,
  direction?: 'high' | 'low',
  green?: number,
  red?: number,
): Result {
  if (value === null)
    return {
      value,
      status: 'not_calculable',
      explanation: `${formula} : donnée absente ou dénominateur nul`,
    };
  let status: Signal = 'information';
  if (direction && green !== undefined && red !== undefined)
    status =
      direction === 'high'
        ? value >= green
          ? 'green'
          : value >= red
            ? 'orange'
            : 'red'
        : value <= green
          ? 'green'
          : value <= red
            ? 'orange'
            : 'red';
  return { value, status, explanation: formula };
}
function compare(value: number | null, threshold: number, operator: '<' | '>'): boolean | null {
  return value === null ? null : operator === '<' ? value < threshold : value > threshold;
}
function and(...values: (boolean | null)[]): boolean | null {
  if (values.includes(false)) return false;
  return values.includes(null) ? null : true;
}
export function calculate(input: unknown) {
  const f = validateFacts(input);
  const tap = ratio(f.performedValue, f.totalEstimatedCost, 100);
  const time = ratio(f.elapsedDays, f.currentDurationDays, 100);
  const index = tap === null || time === null || time === 0 ? null : tap / time;
  const durationRatio = ratio(f.currentDurationDays, f.initialDurationDays);
  const land = ratio(f.releasedArea, f.requiredArea, 100);
  const kpis: Record<string, Result> = {
    AV1: result(tap, 'Travaux réalisés / coût total estimé × 100'),
    AV2: result(index, 'AV1 / DL1', 'high', 0.9, 0.7),
    DL1: result(time, 'Jours écoulés / délai en vigueur en jours × 100', 'low', 90, 100),
    DL2: result(durationRatio, 'Délai en vigueur / délai initial', 'low', 1.25, 2),
    QR1: result(land, 'Emprise libérée / emprise requise à date × 100', 'high', 95, 80),
  };
  const alerts: Record<string, Evaluation> = {
    AL02: {
      triggered: and(
        compare(land, 50, '<'),
        compare(time, 60, '>'),
        f.unblockPlanValidated === undefined ? null : !f.unblockPlanValidated,
      ),
      explanation: 'QR1 < 50 ET DL1 > 60 ET plan de déblocage non validé',
    },
    AL06: {
      triggered: and(
        compare(time, 100, '>'),
        compare(index, 0.7, '<'),
        f.projectCompleted === undefined ? null : !f.projectCompleted,
      ),
      explanation: 'DL1 > 100 ET AV2 < 0.70 ET projet non achevé',
    },
    AL13: {
      triggered: and(compare(durationRatio, 2, '>'), compare(time, 100, '>')),
      explanation: 'DL2 > 2 ET DL1 > 100',
    },
  };
  return {
    calculationVersion,
    kpis,
    alerts,
    thresholdsProvisional: true,
    alertPublicationRequiresValidatedFreshData: true,
  };
}
