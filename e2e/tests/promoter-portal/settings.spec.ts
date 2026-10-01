import { expect, promoterTest as test } from '../../src/fixtures';

test.describe('Promoter settings', () => {
  test('shows the member profile and promoter identity', async ({ page, program, member, promoter }) => {
    await page.goto(`/${program.programId}/settings/profile`);

    await expect(page.getByText(member.email, { exact: true })).toBeVisible();
    await expect(page.getByText(`${member.firstName} ${member.lastName}`, { exact: true })).toBeVisible();

    await page.goto(`/${program.programId}/settings/promoter`);
    await expect(page).toHaveURL(new RegExp(`/${program.programId}/settings/promoter$`));
    await expect(page.getByText(promoter.promoterId, { exact: true })).toBeVisible();
    await expect(page.getByText(promoter.name, { exact: true })).toBeVisible();
  });
});
