import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { ProductsRepository } from '../repositories/productsRepo';
import { getProductsRepository } from '../repositories/productsRepo';
import { DatabaseError, NotFoundError, ValidationError, errorHandler } from '../utils/errors';
import productRouter from './product';

vi.mock('../repositories/productsRepo', () => ({
  getProductsRepository: vi.fn(),
}));

const product = {
  productId: 1,
  supplierId: 2,
  name: 'CAT 320 Excavator',
  description: 'Hydraulic excavator',
  price: 125000,
  sku: 'CAT-320',
  unit: 'each',
  imgName: 'cat-320.png',
};

const repository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as ProductsRepository;

describe('Product API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getProductsRepository).mockResolvedValue(repository);

    app = express();
    app.use(express.json());
    app.use('/products', productRouter);
    app.use(errorHandler);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a product', async () => {
    vi.mocked(repository.create).mockResolvedValue(product);

    const response = await request(app).post('/products').send(product);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(product);
    expect(repository.create).toHaveBeenCalledWith(product);
  });

  it('lists products and finds products by ID or name', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([product]);
    vi.mocked(repository.findById).mockResolvedValue(product);
    vi.mocked(repository.findByName).mockResolvedValue([product]);

    const listResponse = await request(app).get('/products');
    const idResponse = await request(app).get('/products/1');
    const nameResponse = await request(app).get('/products/name/CAT%20320%20Excavator');

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual([product]);
    expect(idResponse.status).toBe(200);
    expect(idResponse.body).toEqual(product);
    expect(nameResponse.status).toBe(200);
    expect(nameResponse.body).toEqual([product]);
    expect(repository.findByName).toHaveBeenCalledWith('CAT 320 Excavator');
  });

  it('returns 404 for a missing product ID and an empty array for an unmatched name', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);
    vi.mocked(repository.findByName).mockResolvedValue([]);

    const idResponse = await request(app).get('/products/999');
    const nameResponse = await request(app).get('/products/name/missing');

    expect(idResponse.status).toBe(404);
    expect(idResponse.text).toBe('Product not found');
    expect(nameResponse.status).toBe(200);
    expect(nameResponse.body).toEqual([]);
  });

  it('updates and deletes a product', async () => {
    vi.mocked(repository.update).mockResolvedValue({ ...product, name: 'Updated excavator' });
    vi.mocked(repository.delete).mockResolvedValue();

    const updateResponse = await request(app).put('/products/1').send({ name: 'Updated excavator' });
    const deleteResponse = await request(app).delete('/products/1');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Updated excavator');
    expect(deleteResponse.status).toBe(204);
  });

  it('maps validation and missing-record errors to their HTTP responses', async () => {
    vi.mocked(repository.create).mockRejectedValue(new ValidationError('Product name is required'));
    vi.mocked(repository.update).mockRejectedValue(new NotFoundError('Product', 999));
    vi.mocked(repository.delete).mockRejectedValue(new NotFoundError('Product', 999));

    const validationResponse = await request(app).post('/products').send({});
    const updateResponse = await request(app).put('/products/999').send({ name: 'Missing' });
    const deleteResponse = await request(app).delete('/products/999');

    expect(validationResponse.status).toBe(400);
    expect(validationResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  it('passes database failures to the error handler', async () => {
    vi.mocked(repository.findAll).mockRejectedValue(
      new DatabaseError('Database is temporarily unavailable', 'DATABASE_BUSY', 503),
    );

    const response = await request(app).get('/products');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('DATABASE_BUSY');
  });

  it('passes lookup and mutation failures to the error handler', async () => {
    const failure = new DatabaseError('Database is temporarily unavailable', 'DATABASE_BUSY', 503);
    vi.mocked(repository.findById).mockRejectedValue(failure);
    vi.mocked(repository.findByName).mockRejectedValue(failure);
    vi.mocked(repository.update).mockRejectedValue(failure);
    vi.mocked(repository.delete).mockRejectedValue(failure);

    const idResponse = await request(app).get('/products/1');
    const nameResponse = await request(app).get('/products/name/excavator');
    const updateResponse = await request(app).put('/products/1').send({ name: 'Updated' });
    const deleteResponse = await request(app).delete('/products/1');

    expect(idResponse.status).toBe(503);
    expect(nameResponse.status).toBe(503);
    expect(updateResponse.status).toBe(503);
    expect(deleteResponse.status).toBe(503);
  });
});
