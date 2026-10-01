import { expect, test } from '../../src/fixtures';

test.describe('Super-admin program summary backed by program_summary_mv', () => {
  test('shows promoter and referral totals after the view refreshes', async ({
    page,
    superAdmin,
    program,
    link,
    refreshProgramSummary,
  }) => {
    const apiKey = await superAdmin.createApiKey(program.programId);
    await superAdmin.createSignup(program.programId, apiKey, link.refVal, 'program-summary@cliq.test');
    await refreshProgramSummary();

    await page.goto('/admin/programs/summary');
    // Other workers create programs too; search so this one isn't paged out.
    await page.getByPlaceholder('Search programs').fill(program.name);

    const cells = page.getByRole('row').filter({ hasText: program.name }).getByRole('cell');
    await expect(cells.nth(0)).toHaveText(program.name);
    await expect(cells.nth(1)).toHaveText('1');
    await expect(cells.nth(2)).toHaveText('1');
  });
});
