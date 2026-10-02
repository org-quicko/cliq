import { expect, test, unique } from '../../helpers/fixtures';

test.describe('Program creation', () => {
  test('validates required fields before creating a program', async ({ page }) => {
    await page.goto('/admin/programs/create');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Program name is required')).toBeVisible();
    await expect(page.getByText('Website is required')).toBeVisible();
  });

  test('creates a program through the admin form', async ({ page, superAdmin }) => {
    const name = unique('Created in browser');
    await page.goto('/admin/programs/create');

    await page.getByLabel('Program name').fill(name);
    await page.getByLabel('Website URL').fill('https://browser-created.cliq.test');
    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/programs') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create' }).click();
    const response = await responsePromise;
    const body = await response.json() as { data: { program_id: string } };

    try {
      expect(response.ok()).toBeTruthy();
      await expect(page).toHaveURL(/\/admin\/programs\/summary$/);
    } finally {
      await superAdmin.deleteProgram(body.data.program_id);
    }
  });
});
