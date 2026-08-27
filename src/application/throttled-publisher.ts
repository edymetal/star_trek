export interface ThrottledPublisher<T> {
  publishIfDue(deltaSeconds: number, createValue: () => T): boolean;
  publishNow(value: T): void;
}

export function createThrottledPublisher<T>(
  intervalSeconds: number,
  publish: (value: T) => void,
): ThrottledPublisher<T> {
  if (!(intervalSeconds > 0)) {
    throw new Error('O intervalo de publicação precisa ser maior que zero.');
  }

  let elapsedSeconds = intervalSeconds;

  return {
    publishIfDue(deltaSeconds, createValue) {
      elapsedSeconds += Math.max(0, deltaSeconds);
      if (elapsedSeconds + Number.EPSILON < intervalSeconds) {
        return false;
      }

      elapsedSeconds %= intervalSeconds;
      publish(createValue());
      return true;
    },
    publishNow(value) {
      elapsedSeconds = 0;
      publish(value);
    },
  };
}
