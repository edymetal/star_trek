import { ENEMY_CONTENT } from './combat-content';
import type { EquipmentId } from '../domain/combat/weapons';
import type {
  TutorialMissionDefinition,
  TutorialObjectiveType,
} from '../domain/missions/tutorial-campaign';

export interface TutorialMissionContent extends TutorialMissionDefinition {
  readonly allowedEquipment: readonly EquipmentId[];
  readonly arrivalFeedback: string;
  readonly briefing: string;
  readonly completedObjective: string;
  readonly completionFeedback: string;
  readonly contactDisplayName: string;
  readonly encounterMode: 'hostile' | 'passive';
  readonly objectiveCompleteText: string;
  readonly objectiveInstruction: string;
  readonly objectiveLabel: string;
  readonly outboundObjective: string;
  readonly returnFeedback: string;
  readonly returningObjective: string;
  readonly title: string;
}

function tutorialMission(
  content: Omit<TutorialMissionContent, 'targetContactId' | 'travelDurationSeconds'> & {
    readonly objectiveType: TutorialObjectiveType;
  },
): TutorialMissionContent {
  return {
    ...content,
    targetContactId: ENEMY_CONTENT.id,
    travelDurationSeconds: 1.2,
  };
}

export const INITIAL_TUTORIAL_MISSIONS: readonly TutorialMissionContent[] = [
  tutorialMission({
    allowedEquipment: [],
    arrivalFeedback: 'Destino alcançado. Use T para selecionar o contato e R para iniciar o scan.',
    briefing:
      'Treino de sensores: localize, selecione e identifique a sonda no corredor de Nereida.',
    completedObjective: 'Sensores dominados. Dados entregues e nave revisada na base.',
    completionFeedback: 'Missão 1 concluída. Sensores e navegação básica aprovados.',
    contactDisplayName: 'Sonda de Nereida',
    encounterMode: 'passive',
    id: 'nereida-survey',
    objectiveCompleteText: 'Sonda identificada. Retorne à base com os dados do levantamento.',
    objectiveInstruction:
      'Pressione T para selecionar, R para escanear e mantenha o contato dentro do alcance dos sensores.',
    objectiveLabel: 'Levantamento',
    objectiveType: 'identify-contact',
    outboundObjective: 'Em trânsito para o corredor de Nereida. Sistemas táticos em espera.',
    returnFeedback: 'Dados protegidos. Retornando à base.',
    returningObjective: 'Retornando à base com os dados do levantamento.',
    title: 'Levantamento de Nereida',
  }),
  tutorialMission({
    allowedEquipment: ['tractor'],
    arrivalFeedback:
      'Nave de pesquisa localizada. Identifique-a, aproxime-se e estabilize-a com o raio trator.',
    briefing:
      'Treino de assistência: socorra uma nave sem propulsão usando sensores, energia auxiliar e raio trator.',
    completedObjective: 'Resgate concluído. Emissor trator revisado e nave reabastecida na base.',
    completionFeedback: 'Missão 2 concluída. Assistência e raio trator aprovados.',
    contactDisplayName: 'Nave de pesquisa Íris',
    encounterMode: 'passive',
    id: 'iris-assistance',
    objectiveCompleteText:
      'Alvo estabilizado pelo raio trator. Retorne à base com a equipe segura.',
    objectiveInstruction:
      'Identifique o contato, aproxime-se a menos de 72 u, alinhe a proa e use 3. Mais auxiliares fortalecem sensores e trator.',
    objectiveLabel: 'Assistência',
    objectiveType: 'tractor-lock',
    outboundObjective: 'Em trânsito para o anel de Íris. Armas ofensivas permanecerão bloqueadas.',
    returnFeedback: 'Nave estabilizada. Retornando à base em formação de resgate.',
    returningObjective: 'Escoltando a nave de pesquisa estabilizada de volta à base.',
    title: 'Socorro no Anel de Íris',
  }),
  tutorialMission({
    allowedEquipment: ['beam', 'torpedo', 'tractor'],
    arrivalFeedback:
      'Interceptadora hostil detectada. Identifique o alvo, gerencie energia e neutralize a ameaça.',
    briefing:
      'Treino de combate: use energia, escudos, feixe e torpedos para neutralizar uma interceptadora hostil.',
    completedObjective: 'Treinamento inicial concluído. Nave reparada e tripulação certificada.',
    completionFeedback: 'Missão 3 concluída. Treinamento inicial completo.',
    contactDisplayName: ENEMY_CONTENT.displayName,
    encounterMode: 'hostile',
    id: 'vespa-combat-training',
    objectiveCompleteText: 'Ameaça neutralizada. Retorne à base para concluir o treinamento.',
    objectiveInstruction:
      'Identifique o alvo, escolha Ataque ou Defesa e use feixe (1) e torpedos (2) até obter vitória.',
    objectiveLabel: 'Combate',
    objectiveType: 'combat-victory',
    outboundObjective: 'Em trânsito para a área de combate. Revise energia, escudos e armamentos.',
    returnFeedback: 'Área segura. Retornando à base para avaliação final.',
    returningObjective: 'Retornando à base após neutralizar a interceptadora.',
    title: 'Defesa do Corredor Aurora',
  }),
];

export const FIRST_TUTORIAL_MISSION = INITIAL_TUTORIAL_MISSIONS[0]!;

export function getTutorialMissionContent(missionId: string): TutorialMissionContent {
  const mission = INITIAL_TUTORIAL_MISSIONS.find(({ id }) => id === missionId);
  if (mission === undefined) throw new Error(`Conteúdo de missão desconhecido: ${missionId}.`);
  return mission;
}
