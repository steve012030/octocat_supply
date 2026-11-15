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
    await page.reload();
  });

  test('adds a product to the cart', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Increase quantity of Cart Test Product' }).click();
    await page.getByRole('button', { name: 'Add 1 Cart Test Product to cart' }).click();

    await expect(page.getByRole('link', { name: 'Shopping cart, 1 item' })).toBeVisible();
    await page.getByRole('link', { name: 'Shopping cart, 1 item' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Quantity of Cart Test Product' })).toHaveValue('1');
    await expect(page.locator('dl').getByText('$89.00', { exact: true })).toBeVisible();
  });

  test('adds another unit of a product already in the cart', async ({ page }) => {
    await page.goto('/products');
    const addProductButton = page.getByRole('button', { name: 'Add 1 Cart Test Product to cart' });
    const increaseQuantityButton = page.getByRole('button', {
      name: 'Increase quantity of Cart Test Product',
    });

    await increaseQuantityButton.click();
    await addProductButton.click();
    await increaseQuantityButton.click();
    await addProductButton.click();

    await expect(page.getByRole('link', { name: 'Shopping cart, 2 items' })).toBeVisible();
    await page.getByRole('link', { name: 'Shopping cart, 2 items' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Quantity of Cart Test Product' })).toHaveValue('2');
    await expect(page.locator('dl').getByText('$178.00', { exact: true })).toBeVisible();
  });

  test('changes the quantity and updates the order total', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Increase quantity of Cart Test Product' }).click();
    await page.getByRole('button', { name: 'Add 1 Cart Test Product to cart' }).click();
    await page.getByRole('link', { name: 'Shopping cart, 1 item' }).click();

    const quantity = page.getByRole('spinbutton', { name: 'Quantity of Cart Test Product' });
    await quantity.fill('3');

    await expect(quantity).toHaveValue('3');
    await expect(page.getByRole('link', { name: 'Shopping cart, 3 items' })).toBeVisible();
    await expect(page.locator('dl').getByText('$267.00', { exact: true })).toBeVisible();
    await expect(page.locator('dl').getByText('-$13.35', { exact: true })).toBeVisible();
    await expect(page.locator('dl').getByText('$263.65', { exact: true })).toBeVisible();

    await page.reload();
    await expect(quantity).toHaveValue('3');
  });

  test('removes a product and shows the empty cart state', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Increase quantity of Cart Test Product' }).click();
    await page.getByRole('button', { name: 'Add 1 Cart Test Product to cart' }).click();
    await page.getByRole('link', { name: 'Shopping cart, 1 item' }).click();

    await page.getByRole('button', { name: 'Remove Cart Test Product from cart' }).click();

    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shopping cart, 0 items' })).toBeVisible();
  });
});
