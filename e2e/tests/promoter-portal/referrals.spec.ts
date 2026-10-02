import { expect, promoterTest as test, promoterUnique as unique } from '../../helpers/fixtures';

test.describe('Promoter referrals', () => {
  test('shows a signup attributed to the promoter link', async ({
    page,
    superAdmin,
    program,
    link,
  }) => {
    const email = `${unique('promoter referral').replaceAll(' ', '.')}@cliq.test`;
    const apiKey = await superAdmin.createApiKey(program.programId);
    await superAdmin.createSignup(program.programId, apiKey, link.refVal, email);

    await page.goto(`/${program.programId}/home/referrals`);

    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByText('Lead', { exact: true })).toBeVisible();
  });
});
