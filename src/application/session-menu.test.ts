import { describe, expect, it } from 'vitest';

import { createSessionMenu } from './session-menu';

describe('createSessionMenu', () => {
  it('exige iniciar ou continuar antes de fechar a primeira tela', () => {
    const menu = createSessionMenu(true);

    expect(menu.getSnapshot()).toEqual({ canClose: false, isOpen: true, view: 'home' });
    expect(menu.back()).toBe(false);
    menu.enterSession();
    expect(menu.getSnapshot()).toEqual({ canClose: true, isOpen: false, view: 'home' });
  });

  it('abre na base, navega por painéis e usa voltar antes de fechar', () => {
    const menu = createSessionMenu(false);

    expect(menu.open()).toBe(true);
    expect(menu.show('diagnostics')).toBe(true);
    expect(menu.getSnapshot().view).toBe('diagnostics');
    expect(menu.back()).toBe(true);
    expect(menu.getSnapshot()).toEqual({ canClose: true, isOpen: true, view: 'home' });
    expect(menu.back()).toBe(true);
    expect(menu.getSnapshot().isOpen).toBe(false);
  });

  it('rejeita navegação quando o menu está fechado', () => {
    const menu = createSessionMenu(false);

    expect(menu.show('credits')).toBe(false);
    expect(menu.back()).toBe(false);
  });
});
