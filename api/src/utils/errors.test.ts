import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  errorHandler,
  handleDatabaseError,
} from './errors';

describe('Database error handling', () => {
  it('converts unknown failures to a database error', () => {
    expect(() => handleDatabaseError(new Error('connection failed'))).toThrow(
      expect.objectContaining({
        name: 'DatabaseError',
        code: 'DATABASE_ERROR',
        statusCode: 500,
      }),
    );
    expect(() => handleDatabaseError('unexpected failure')).toThrow(DatabaseError);
  });

  it('maps SQLite constraints to conflict and validation errors', () => {
    expect(() =>
      handleDatabaseError(new DatabaseError('UNIQUE constraint failed', 'SQLITE_CONSTRAINT')),
    ).toThrow(ConflictError);
    expect(() =>
      handleDatabaseError(new DatabaseError('FOREIGN KEY constraint failed', 'SQLITE_CONSTRAINT')),
    ).toThrow(ValidationError);
    expect(() =>
      handleDatabaseError(new DatabaseError('CHECK constraint failed', 'SQLITE_CONSTRAINT')),
    ).toThrow(ValidationError);
  });

  it('maps locked databases and missing update targets to domain errors', () => {
    expect(() =>
      handleDatabaseError(new DatabaseError('locked', 'SQLITE_BUSY')),
    ).toThrow(expect.objectContaining({ code: 'DATABASE_BUSY', statusCode: 503 }));
    expect(() =>
      handleDatabaseError(new DatabaseError('No rows affected'), 'Product', 9),
    ).toThrow(NotFoundError);
    expect(() => handleDatabaseError(new DatabaseError('No rows affected'))).toThrow(
      'No rows affected',
    );
    expect(() => handleDatabaseError(new DatabaseError('other database error'))).toThrow(
      'other database error',
    );
  });

  it('returns structured domain errors and hides unexpected error details', async () => {
    const app = express();
    app.get('/unexpected', (_req, _res, next) => next(new Error('private database details')));
    app.get('/database', (_req, _res, next) =>
      next(new DatabaseError('Database unavailable', 'DATABASE_BUSY', 503)),
    );
    app.use(errorHandler);

    const unexpectedResponse = await request(app).get('/unexpected');
    const databaseResponse = await request(app).get('/database');

    expect(unexpectedResponse.status).toBe(500);
    expect(unexpectedResponse.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
    expect(databaseResponse.status).toBe(503);
    expect(databaseResponse.body.error.code).toBe('DATABASE_BUSY');
  });
});
