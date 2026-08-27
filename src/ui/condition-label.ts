export type ConditionLabel = 'avariado' | 'crítico' | 'destruído' | 'íntegro';

export function conditionLabel(integrityPercent: number): ConditionLabel {
  const safeIntegrity = Number.isFinite(integrityPercent)
    ? Math.max(0, Math.min(100, integrityPercent))
    : 0;
  if (safeIntegrity <= 0) return 'destruído';
  if (safeIntegrity < 35) return 'crítico';
  if (safeIntegrity < 75) return 'avariado';
  return 'íntegro';
}
