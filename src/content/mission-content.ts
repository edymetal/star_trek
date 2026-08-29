import { ENEMY_CONTENT } from './combat-content';

export const FIRST_EXPLORATION_MISSION = {
  briefing: 'Parta da base e identifique a assinatura desconhecida no corredor de Nereida.',
  completedObjective: 'Levantamento concluído. A nave foi reparada e reabastecida na base.',
  id: 'nereida-survey',
  surveyObjective: 'Selecione o contato e conclua um scan ativo antes de retornar.',
  targetContactId: ENEMY_CONTENT.id,
  title: 'Levantamento de Nereida',
  travelDurationSeconds: 1.2,
} as const;
