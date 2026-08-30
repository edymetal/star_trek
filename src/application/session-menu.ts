export type SessionMenuView = 'credits' | 'diagnostics' | 'home' | 'settings';

export interface SessionMenuSnapshot {
  readonly canClose: boolean;
  readonly isOpen: boolean;
  readonly view: SessionMenuView;
}

export interface SessionMenu {
  back(): boolean;
  enterSession(): void;
  getSnapshot(): SessionMenuSnapshot;
  open(): boolean;
  show(view: Exclude<SessionMenuView, 'home'>): boolean;
}

export function createSessionMenu(initiallyOpen: boolean): SessionMenu {
  let isOpen = initiallyOpen;
  let sessionEntered = !initiallyOpen;
  let view: SessionMenuView = 'home';

  function snapshot(): SessionMenuSnapshot {
    return { canClose: sessionEntered, isOpen, view };
  }

  return {
    back() {
      if (!isOpen) return false;
      if (view !== 'home') {
        view = 'home';
        return true;
      }
      if (!sessionEntered) return false;
      isOpen = false;
      return true;
    },
    enterSession() {
      sessionEntered = true;
      isOpen = false;
      view = 'home';
    },
    getSnapshot: snapshot,
    open() {
      if (!sessionEntered || isOpen) return false;
      isOpen = true;
      view = 'home';
      return true;
    },
    show(nextView) {
      if (!isOpen) return false;
      view = nextView;
      return true;
    },
  };
}
