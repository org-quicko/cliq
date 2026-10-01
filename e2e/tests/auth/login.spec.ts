import { expect, test } from '@playwright/test';
import { credentials } from '../../src/env';

test.describe('Admin authentication', () => {
  test('signs the super admin into the portal', async ({ page }) => {
    await page.goto('/admin/login');

    await page.getByLabel('Email').fill(credentials.superAdmin.email);
    await page.getByLabel('Password').fill(credentials.superAdmin.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/admin\/programs$/);
  });

  test('rejects an invalid password', async ({ page }) => {
    await page.goto('/admin/login');

    await page.getByLabel('Email').fill(credentials.superAdmin.email);
    await page.getByLabel('Password').fill('not-the-e2e-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
