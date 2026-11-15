import { expect, test } from '@playwright/test';

const product = {
  productId: 1,
  name: 'Cart Test Product',
  description: 'A product used for shopping cart tests.',
  price: 89,
  imgName: 'catflix.png',
  sku: 'CART-001',
  unit: 'each',
  supplierId: 1,
};

test.describe('Shopping cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/products', (route) =>
      route.fulfill({ json: [product] }),
    );
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('octocat-supply-cart'));
  });

  test('adds products, updates quantities, persists, and removes items', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Increase quantity of Cart Test Product' }).click();
    await page.getByRole('button', { name: 'Add 1 Cart Test Product to cart' }).click();
    await expect(page.getByRole('link', { name: 'Shopping cart, 1 item' })).toBeVisible();

    await page.getByRole('button', { name: 'Increase quantity of Cart Test Product' }).click();
    await page.getByRole('button', { name: 'Add 1 Cart Test Product to cart' }).click();
    await expect(page.getByRole('link', { name: 'Shopping cart, 2 items' })).toBeVisible();
    await page.getByRole('link', { name: 'Shopping cart, 2 items' }).click();

    const quantity = page.getByRole('spinbutton', { name: 'Quantity of Cart Test Product' });
    await expect(quantity).toHaveValue('2');
    await expect(page.locator('dl').getByText('$178.00', { exact: true })).toBeVisible();
    await expect(page.locator('dl').getByText('-$8.90', { exact: true })).toBeVisible();
    await expect(page.locator('dl').getByText('$179.10', { exact: true })).toBeVisible();

    await quantity.fill('3');
    await expect(page.getByRole('link', { name: 'Shopping cart, 3 items' })).toBeVisible();
    await page.reload();
    await expect(quantity).toHaveValue('3');

    await page.getByRole('button', { name: 'Remove Cart Test Product from cart' }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shopping cart, 0 items' })).toBeVisible();
  });
});
