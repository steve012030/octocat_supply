import { describe, expect, it } from 'vitest';
import {
  SelectQueryBuilder,
  buildInsertSQL,
  buildUpdateSQL,
  generatePlaceholders,
  mapDatabaseRows,
  objectToCamelCase,
  objectToSnakeCase,
  toCamelCase,
  toSnakeCase,
  validateRequiredFields,
} from './sql';

describe('SQL helpers', () => {
  it('builds a SELECT query with optional clauses', () => {
    const query = new SelectQueryBuilder('products')
      .select(['products.product_id', 'products.name'])
      .join('suppliers', 'products.supplier_id = suppliers.supplier_id', 'LEFT')
      .where('suppliers.active = 1')
      .where('products.price > 0')
      .orderBy('products.name')
      .orderBy('products.price', 'DESC')
      .limit(10)
      .offset(5);

    expect(query.build()).toBe(
      'SELECT products.product_id, products.name FROM products LEFT JOIN suppliers ON products.supplier_id = suppliers.supplier_id WHERE suppliers.active = 1 AND products.price > 0 ORDER BY products.name ASC, products.price DESC LIMIT 10 OFFSET 5',
    );
    expect(new SelectQueryBuilder('suppliers').build()).toBe('SELECT * FROM suppliers');
  });

  it('converts keys between camelCase and snake_case', () => {
    expect(toSnakeCase('supplierId')).toBe('supplier_id');
    expect(toCamelCase('supplier_id')).toBe('supplierId');
    expect(objectToSnakeCase({ supplierId: 7, displayName: 'Acme' })).toEqual({
      supplier_id: 7,
      display_name: 'Acme',
    });
    expect(
      objectToCamelCase<{ supplierId: number; displayName: string }>({
        supplier_id: 7,
        display_name: 'Acme',
      }),
    ).toEqual({ supplierId: 7, displayName: 'Acme' });
    expect(mapDatabaseRows<{ supplierId: number }>([{ supplier_id: 7 }])).toEqual([
      { supplierId: 7 },
    ]);
  });

  it('builds insert and update SQL with bound values', () => {
    expect(buildInsertSQL('suppliers', { name: 'Acme', active: true })).toEqual({
      sql: 'INSERT INTO suppliers (name, active) VALUES (?, ?)',
      values: ['Acme', true],
    });
    expect(buildUpdateSQL('suppliers', { name: 'Updated Acme' }, 'supplier_id = ?')).toEqual({
      sql: 'UPDATE suppliers SET name = ? WHERE supplier_id = ?',
      values: ['Updated Acme'],
    });
    expect(generatePlaceholders(0)).toBe('');
    expect(generatePlaceholders(3)).toBe('?, ?, ?');
  });

  it('rejects missing required values', () => {
    expect(() => validateRequiredFields({ name: 'Acme' }, ['name'])).not.toThrow();
    expect(() => validateRequiredFields({ name: undefined }, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
    expect(() => validateRequiredFields({ name: null }, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
    expect(() => validateRequiredFields({ name: '' }, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
  });
});
