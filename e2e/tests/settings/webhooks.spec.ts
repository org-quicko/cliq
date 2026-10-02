import { expect, test, unique } from '../../helpers/fixtures';

test.describe('Program webhooks', () => {
  test('creates a webhook endpoint', async ({ page, program }) => {
    const url = `https://hooks.cliq.test/${unique('webhook').replaceAll(' ', '-')}`;
    await page.goto(`/admin/${program.programId}/home/settings/webhooks`);

    await page.getByRole('button', { name: 'Create' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Endpoint URL').fill(url);
    await dialog.getByLabel('Secret').fill('webhook-e2e-secret');
    await dialog.getByText('signup.created', { exact: true }).click();
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(url, { exact: true })).toBeVisible();
    await expect(page.getByText('signup.created', { exact: true }).first()).toBeVisible();
  });
});
