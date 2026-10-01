import { expect, test, unique } from '../../src/fixtures';

test.describe('Referral analytics', () => {
  test('shows a referral created through a tracked link', async ({
    page,
    superAdmin,
    program,
    promoter,
    link,
  }) => {
    const email = `${unique('referral').replaceAll(' ', '.')}@cliq.test`;
    const apiKey = await superAdmin.createApiKey(program.programId);
    await superAdmin.createSignup(program.programId, apiKey, link.refVal, email);

    await page.goto(`/admin/${program.programId}/home/referrals`);

    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByText(promoter.name, { exact: true })).toBeVisible();
    await expect(page.getByText('Lead', { exact: true })).toBeVisible();
  });
});
