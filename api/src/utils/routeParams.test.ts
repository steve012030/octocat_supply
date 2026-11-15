import { describe, expect, it } from 'vitest';
import { parsePositiveIntegerParam } from './routeParams';

describe('parsePositiveIntegerParam', () => {
  it('parses positive safe integers', () => {
    expect(parsePositiveIntegerParam('42')).toBe(42);
    expect(parsePositiveIntegerParam('0007')).toBe(7);
  });

  it.each(['', '0', '-1', '1.5', '12abc', '9007199254740992'])(
    'rejects malformed or out-of-range values: %s',
    (value) => {
      expect(parsePositiveIntegerParam(value)).toBeNull();
    },
  );
});
