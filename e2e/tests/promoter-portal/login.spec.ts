import { expect, promoterTest as test } from '../../src/fixtures';

test.describe('Promoter authentication', () => {
  test.use({ signedIn: false });

  test('signs a promoter into their program portal', async ({ page, program, member, promoter: _promoter }) => {
    await page.goto(`/${program.programId}/login`);

    await page.getByLabel('Email').fill(member.email);
    await page.getByLabel('Password').fill(member.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(new RegExp(`/${program.programId}/home/dashboard$`));
    await expect(page.getByText(`Welcome to your dashboard, ${member.firstName}`, { exact: true })).toBeVisible();
  });
});
