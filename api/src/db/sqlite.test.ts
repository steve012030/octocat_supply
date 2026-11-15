import { describe, expect, it, vi } from 'vitest';

vi.mock('./config', () => {
  const invalidDatabasePath = process.cwd();
  return {
    DB_CONFIG: {
      DB_FILE: invalidDatabasePath,
      DB_ENGINE: 'sqlite',
      ENABLE_WAL: false,
      TIMEOUT: 30000,
      FOREIGN_KEYS: true,
    },
    TEST_DB_CONFIG: {
      DB_FILE: ':memory:',
      DB_ENGINE: 'sqlite',
      ENABLE_WAL: false,
      TIMEOUT: 30000,
      FOREIGN_KEYS: true,
    },
  };
});

import { getDatabase } from './sqlite';

describe('SQLite connection setup', () => {
  it('wraps database file open failures with connection context', async () => {
    await expect(getDatabase()).rejects.toThrow(/^Failed to connect to database:/);
  });
});
