import { describe, expect, it } from 'vitest';

import { ENEMY_AI_DEFINITION } from '../../content/combat-content';
import { createInitialEnemyAiState, stepEnemyAi } from './enemy-ai';

describe('IA tática determinística', () => {
  it('não persegue nem ataca sem percepção do alvo', () => {
    const step = stepEnemyAi(ENEMY_AI_DEFINITION, createInitialEnemyAiState(), {
      deltaSeconds: 1,
      hullFraction: 1,
      shieldFraction: 1,
    });
    expect(step.state.mode).toBe('detecting');
    expect(step.action.fireBeam).toBe(false);
    expect(step.action.movement).toBe('hold');
  });

  it('persegue, orienta e ataca conforme distância e solução conhecida', () => {
    let state = createInitialEnemyAiState();
    let step = stepEnemyAi(ENEMY_AI_DEFINITION, state, {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 120, firingSolution: 1, observedNow: true },
      shieldFraction: 1,
    });
    expect(step.state.mode).toBe('pursuing');
    state = step.state;
    step = stepEnemyAi(ENEMY_AI_DEFINITION, state, {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 60, firingSolution: 0.2, observedNow: true },
      shieldFraction: 1,
    });
    expect(step.state.mode).toBe('orienting');
    step = stepEnemyAi(ENEMY_AI_DEFINITION, step.state, {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 60, firingSolution: 1, observedNow: true },
      shieldFraction: 1,
    });
    expect(step.state.mode).toBe('attacking');
    expect(step.action.fireBeam).toBe(true);
  });

  it('redistribui energia quando escudo está baixo e depois retorna ao combate', () => {
    let step = stepEnemyAi(ENEMY_AI_DEFINITION, createInitialEnemyAiState(), {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 60, firingSolution: 1, observedNow: true },
      shieldFraction: 0.1,
    });
    expect(step.state.mode).toBe('redistributing');
    expect(step.action.requestedEnergyPreset).toBe('defense');
    step = stepEnemyAi(ENEMY_AI_DEFINITION, step.state, {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 60, firingSolution: 1, observedNow: true },
      shieldFraction: 0.8,
    });
    expect(step.state.mode).toBe('attacking');
  });

  it('recua com casco crítico, mesmo tendo solução de ataque', () => {
    const step = stepEnemyAi(ENEMY_AI_DEFINITION, createInitialEnemyAiState(), {
      deltaSeconds: 1,
      hullFraction: 0.2,
      perceivedTarget: { distanceUnits: 20, firingSolution: 1, observedNow: true },
      shieldFraction: 1,
    });
    expect(step.state.mode).toBe('retreating');
    expect(step.action).toMatchObject({ fireBeam: false, movement: 'retreat' });
  });

  it('usa a última observação para orientar ou aproximar, mas nunca ataca durante memória', () => {
    const attacking = stepEnemyAi(ENEMY_AI_DEFINITION, createInitialEnemyAiState(), {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 60, firingSolution: 1, observedNow: true },
      shieldFraction: 1,
    });
    expect(attacking.action.fireBeam).toBe(true);

    const remembered = stepEnemyAi(ENEMY_AI_DEFINITION, attacking.state, {
      deltaSeconds: 1 / 60,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 60, firingSolution: 1, observedNow: false },
      shieldFraction: 1,
    });
    expect(remembered.state.mode).toBe('orienting');
    expect(remembered.action).toMatchObject({
      fireBeam: false,
      movement: 'hold',
      targetSource: 'remembered',
      turnTowardTarget: true,
    });

    const distantMemory = stepEnemyAi(ENEMY_AI_DEFINITION, remembered.state, {
      deltaSeconds: 1,
      hullFraction: 1,
      perceivedTarget: { distanceUnits: 120, firingSolution: 1, observedNow: false },
      shieldFraction: 1,
    });
    expect(distantMemory.action).toMatchObject({
      fireBeam: false,
      movement: 'approach',
      targetSource: 'remembered',
    });
  });
});
