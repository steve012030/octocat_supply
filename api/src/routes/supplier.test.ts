import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { SuppliersRepository } from '../repositories/suppliersRepo';
import { getSuppliersRepository } from '../repositories/suppliersRepo';
import { DatabaseError, NotFoundError, ValidationError, errorHandler } from '../utils/errors';
import supplierRouter from './supplier';

vi.mock('../repositories/suppliersRepo', () => ({
  getSuppliersRepository: vi.fn(),
}));

const supplier = {
  supplierId: 1,
  name: 'Acme Equipment',
  description: 'Heavy equipment supplier',
  contactPerson: 'Alex Smith',
  email: 'alex@acme.example',
  phone: '555-0100',
  active: true,
  verified: true,
};

const repository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as SuppliersRepository;

describe('Supplier API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSuppliersRepository).mockResolvedValue(repository);

    app = express();
    app.use(express.json());
    app.use('/suppliers', supplierRouter);
    app.use(errorHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a supplier', async () => {
    vi.mocked(repository.create).mockResolvedValue(supplier);

    const response = await request(app).post('/suppliers').send(supplier);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(supplier);
    expect(repository.create).toHaveBeenCalledWith(supplier);
  });

  it('lists suppliers and gets a supplier by ID', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([supplier]);
    vi.mocked(repository.findById).mockResolvedValue(supplier);

    const listResponse = await request(app).get('/suppliers');
    const idResponse = await request(app).get('/suppliers/1');

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual([supplier]);
    expect(idResponse.status).toBe(200);
    expect(idResponse.body).toEqual(supplier);
  });

  it('returns a supplier status and reports missing suppliers', async () => {
    vi.mocked(repository.findById).mockResolvedValueOnce(supplier).mockResolvedValueOnce(null);

    const statusResponse = await request(app).get('/suppliers/1/status');
    const missingResponse = await request(app).get('/suppliers/999');
    const missingStatusResponse = await request(app).get('/suppliers/999/status');

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toEqual({ status: 'APPROVED' });
    expect(missingResponse.status).toBe(404);
    expect(missingResponse.text).toBe('Supplier not found');
    expect(missingStatusResponse.status).toBe(404);
  });

  it('updates and deletes a supplier', async () => {
    vi.mocked(repository.update).mockResolvedValue({ ...supplier, name: 'Updated supplier' });
    vi.mocked(repository.delete).mockResolvedValue();

    const updateResponse = await request(app).put('/suppliers/1').send({ name: 'Updated supplier' });
    const deleteResponse = await request(app).delete('/suppliers/1');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Updated supplier');
    expect(deleteResponse.status).toBe(204);
  });

  it('maps validation and missing-record errors to their HTTP responses', async () => {
    vi.mocked(repository.create).mockRejectedValue(new ValidationError('Supplier name is required'));
    vi.mocked(repository.update).mockRejectedValue(new NotFoundError('Supplier', 999));
    vi.mocked(repository.delete).mockRejectedValue(new NotFoundError('Supplier', 999));

    const validationResponse = await request(app).post('/suppliers').send({});
    const updateResponse = await request(app).put('/suppliers/999').send({ name: 'Missing' });
    const deleteResponse = await request(app).delete('/suppliers/999');

    expect(validationResponse.status).toBe(400);
    expect(validationResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  it('passes database failures to the error handler', async () => {
    vi.mocked(repository.findAll).mockRejectedValue(
      new DatabaseError('Database is temporarily unavailable', 'DATABASE_BUSY', 503),
    );

    const response = await request(app).get('/suppliers');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('DATABASE_BUSY');
  });

  it('returns 400 for malformed supplier ID parameters before accessing the repository', async () => {
    const getResponse = await request(app).get('/suppliers/not-a-number');
    const updateResponse = await request(app).put('/suppliers/1.5').send({ name: 'Updated' });
    const deleteResponse = await request(app).delete('/suppliers/9007199254740992');
    const statusResponse = await request(app).get('/suppliers/-1/status');

    expect(getResponse.status).toBe(400);
    expect(updateResponse.status).toBe(400);
    expect(deleteResponse.status).toBe(400);
    expect(statusResponse.status).toBe(400);
    expect(getSuppliersRepository).not.toHaveBeenCalled();
  });

  it('passes repository connection failures to the error handler', async () => {
    vi.mocked(getSuppliersRepository).mockRejectedValue(
      new Error('Failed to connect to database: unable to open database file'),
    );

    const response = await request(app).get('/suppliers');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('An unexpected error occurred');
  });

  it('passes supplier lookup, status, and mutation failures to the error handler', async () => {
    const failure = new DatabaseError('Database is temporarily unavailable', 'DATABASE_BUSY', 503);
    vi.mocked(repository.findById).mockRejectedValue(failure);
    vi.mocked(repository.update).mockRejectedValue(failure);
    vi.mocked(repository.delete).mockRejectedValue(failure);

    const idResponse = await request(app).get('/suppliers/1');
    const statusResponse = await request(app).get('/suppliers/1/status');
    const updateResponse = await request(app).put('/suppliers/1').send({ name: 'Updated' });
    const deleteResponse = await request(app).delete('/suppliers/1');

    expect(idResponse.status).toBe(503);
    expect(statusResponse.status).toBe(503);
    expect(updateResponse.status).toBe(503);
    expect(deleteResponse.status).toBe(503);
  });
});
