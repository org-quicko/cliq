import { expect, promoterTest as test } from '../../helpers/fixtures';

test.describe('Promoter dashboard', () => {
  test('shows a promoter-created referral link and its tracked URL', async ({ page, program, link }) => {
    await page.goto(`/${program.programId}/home/dashboard`);

    await expect(page.getByText('My Links', { exact: true })).toBeVisible();
    await expect(page.getByText(link.name, { exact: true })).toBeVisible();
    await expect(page.getByText(`${program.website}?ref=`, { exact: true })).toBeVisible();
    await expect(page.getByText(link.refVal, { exact: true })).toBeVisible();
  });
});
