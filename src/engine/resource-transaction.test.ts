import { describe, expect, it } from 'vitest';

import { createResourceTransaction } from './resource-transaction';

describe('createResourceTransaction', () => {
  it('desfaz recursos em ordem inversa quando a montagem falha', () => {
    const released: string[] = [];
    const transaction = createResourceTransaction();
    transaction.defer(() => released.push('device'));
    transaction.defer(() => released.push('app'));
    transaction.defer(() => released.push('materials'));
    transaction.defer(() => released.push('buffer'));

    transaction.rollback();

    expect(released).toEqual(['buffer', 'materials', 'app', 'device']);
  });

  it('permite transferir o cleanup para o runtime e o executa uma única vez', () => {
    let releases = 0;
    const transaction = createResourceTransaction();
    const cancelFirst = transaction.defer(() => {
      releases += 100;
    });
    transaction.defer(() => {
      releases += 1;
    });
    cancelFirst();
    const dispose = transaction.commit();

    dispose();
    dispose();

    expect(releases).toBe(1);
  });

  it('continua limpando os demais recursos quando um cleanup falha', () => {
    const released: string[] = [];
    const transaction = createResourceTransaction();
    transaction.defer(() => released.push('app'));
    transaction.defer(() => {
      throw new Error('falha de buffer');
    });
    transaction.defer(() => released.push('buffer auxiliar'));

    expect(() => transaction.rollback()).toThrow('falha de buffer');
    expect(released).toEqual(['buffer auxiliar', 'app']);
  });
});
