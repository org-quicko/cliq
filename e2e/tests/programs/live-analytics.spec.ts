import { expect, test } from '../../src/fixtures';

test.describe('Program screens backed by trigger-maintained analytics', () => {
  test('shows the default circle from the live circle table', async ({ page, program }) => {
    await page.goto(`/admin/${program.programId}/home/circles`);

    await expect(page.getByText('DEFAULT_CIRCLE', { exact: true })).toBeVisible();
    await expect(page.getByText('Default', { exact: true })).toBeVisible();
  });

  test('shows a promoter in the trigger-maintained promoter analytics table', async ({
    page,
    superAdmin,
    program,
    promoter,
    link,
  }) => {
    const apiKey = await superAdmin.createApiKey(program.programId);
    await superAdmin.createSignup(program.programId, apiKey, link.refVal, 'promoter-analytics@cliq.test');
    await page.goto(`/admin/${program.programId}/home/promoters`);

    await expect(page.getByText(promoter.name, { exact: true })).toBeVisible();
    await expect(page.getByText('Total Promoters', { exact: true })).toBeVisible();
  });

  test('shows a link in the trigger-maintained link analytics table', async ({ page, program, promoter, link }) => {
    await page.goto(`/admin/${program.programId}/home/promoters/${promoter.promoterId}/links`);

    await expect(page.getByText(link.name, { exact: true })).toBeVisible();
    await expect(page.getByText(`https://e2e.cliq.test?ref=${link.refVal}`, { exact: true })).toBeVisible();
  });
});
