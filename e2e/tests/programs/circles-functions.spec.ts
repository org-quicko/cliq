import type { Page } from '@playwright/test';
import { expect, test, unique } from '../../helpers/fixtures';
import { env } from '../../helpers/env';

const circleURL = (programId: string, circleId: string) => `/admin/${programId}/home/circles/${circleId}`;
const functionRow = (page: Page, name: string) => page.locator('app-function-actions').filter({
  has: page.getByRole('button', { name: `Actions for ${name}`, exact: true }),
}).locator('..');

async function openActions(page: Page, name: string) {
  await page.getByRole('button', { name: `Actions for ${name}`, exact: true }).click();
}

async function select(page: Page, label: string, option: string) {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

async function continueStep(page: Page, heading: string) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
}

test.describe('Circle and function management', () => {
  test('edits a circle and confirms deletion before removing it', async ({ page, superAdmin, program, request }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Circle'));
    const name = unique('Renamed circle');
    await page.goto(circleURL(program.programId, circle.circle_id));
    await page.getByRole('button', { name: 'Circle actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Name', { exact: true }).fill('   ');
    await expect(editDialog.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await editDialog.getByLabel('Name', { exact: true }).fill(name);
    await editDialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(editDialog).not.toBeVisible();
    await expect(page.getByText(name, { exact: true }).last()).toBeVisible();
    await page.reload();
    await expect(page.getByText(name, { exact: true }).last()).toBeVisible();

    await page.getByRole('button', { name: 'Circle actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Circle actions' })).toBeVisible();
    await page.getByRole('button', { name: 'Circle actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(`/admin/${program.programId}/home/circles`);
    await expect(page.getByText(name, { exact: true })).not.toBeVisible();
    const response = await request.get(`${env.apiURL}/programs/${program.programId}/circles/${circle.circle_id}`, {
      headers: { Authorization: `Bearer ${superAdmin.accessToken}` },
    });
    expect(response.status()).toBe(404);
  });

  test('creates an active commission function through the shared steps and validates conditions', async ({ page, superAdmin, program }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Commission circle'));
    const name = unique('Commission');
    await page.goto(circleURL(program.programId, circle.circle_id));
    await page.getByRole('button', { name: 'Create function', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Function name is required', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Status', { exact: true })).toHaveCount(0);
    await page.getByLabel('Function name').fill(name);
    await continueStep(page, 'Effect');
    await page.getByLabel('Commission value', { exact: true }).fill('101');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('percentages cannot exceed 100');
    await page.getByLabel('Commission value', { exact: true }).fill('15');
    await continueStep(page, 'Conditions');
    await page.getByRole('button', { name: 'Add condition', exact: true }).click();
    await page.getByLabel('Value', { exact: true }).fill('0');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('at least 1');
    await page.getByLabel('Value', { exact: true }).fill('1000');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByLabel('Commission value', { exact: true })).toHaveValue('15');
    await continueStep(page, 'Conditions');
    await expect(page.getByLabel('Value', { exact: true })).toHaveValue('1000');
    await continueStep(page, 'Review');
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByText('Revenue is at least ₹1,000.00', { exact: true })).toBeVisible();
    const responsePromise = page.waitForResponse(response => response.url().endsWith('/functions') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create function', exact: true }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const functionId = (await response.json() as { data: { function_id: string } }).data.function_id;
    await expect(page).toHaveURL(`${circleURL(program.programId, circle.circle_id)}/functions`);
    await expect(functionRow(page, name).getByText('Active', { exact: true })).toBeVisible();
    const saved = await superAdmin.getFunction(program.programId, functionId);
    expect(saved).toMatchObject({ name, status: 'active', circle_id: circle.circle_id, effect_type: 'generate_commission' });
    expect(saved.effect.commission).toEqual({ commission_type: 'percentage', commission_value: 15 });
    expect(saved.conditions[0].condition).toEqual({ parameter: 'revenue', operator: 'greater_than_or_equal_to', value: 1000 });
  });

  test('creates a switch-circle function with an item condition', async ({ page, superAdmin, program }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Source circle'));
    const target = await superAdmin.createCircle(program.programId, unique('Target circle'));
    const name = unique('Switch circle');
    await page.goto(`${circleURL(program.programId, circle.circle_id)}/functions`);
    await page.getByRole('button', { name: 'Create function', exact: true }).click();
    await page.getByLabel('Function name').fill(name);
    await continueStep(page, 'Effect');
    await select(page, 'Effect', 'Switch circle');
    await select(page, 'Target circle', target.name);
    await continueStep(page, 'Conditions');
    await page.getByRole('button', { name: 'Add condition', exact: true }).click();
    await select(page, 'Parameter', 'Item Id');
    await select(page, 'Comparison', 'contains');
    await page.getByLabel('Value', { exact: true }).fill('premium');
    await continueStep(page, 'Review');
    await expect(page.getByText(`Switch to ${target.name}`, { exact: true })).toBeVisible();
    const responsePromise = page.waitForResponse(response => response.url().endsWith('/functions') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create function', exact: true }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const functionId = (await response.json() as { data: { function_id: string } }).data.function_id;
    await expect(functionRow(page, name)).toBeVisible();
    const saved = await superAdmin.getFunction(program.programId, functionId);
    expect(saved.status).toBe('active');
    expect(saved.effect.target_circle_id).toBe(target.circle_id);
    expect(saved.conditions[0].condition).toEqual({ parameter: 'item_id', operator: 'contains', value: 'premium' });
  });

  test('edits an inactive function without reactivating it and removes its conditions', async ({ page, superAdmin, program }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Edit circle'));
    const func = await superAdmin.createFunction(program.programId, circle.circle_id, unique('Before edit'), {
      status: 'inactive', conditions: [{ condition: { parameter: 'revenue', operator: 'greater_than', value: 50 } }],
    });
    const name = unique('After edit');
    await page.goto(circleURL(program.programId, circle.circle_id));
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await expect(page.getByLabel('Function name')).toHaveValue(func.name);
    await expect(page.getByLabel('Status', { exact: true })).toHaveCount(0);
    await page.getByLabel('Function name').fill(name);
    await continueStep(page, 'Effect');
    await expect(page.getByLabel('Commission value', { exact: true })).toHaveValue('10');
    await select(page, 'Commission type', 'Fixed');
    await page.getByLabel('Commission value', { exact: true }).fill('25');
    await continueStep(page, 'Conditions');
    await expect(page.getByLabel('Value', { exact: true })).toHaveValue('50');
    await page.getByRole('button', { name: 'Remove condition 1', exact: true }).click();
    await continueStep(page, 'Review');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(functionRow(page, name).getByText('Inactive', { exact: true })).toBeVisible();
    const saved = await superAdmin.getFunction(program.programId, func.function_id);
    expect(saved).toMatchObject({ name, status: 'inactive', conditions: [] });
    expect(saved.effect.commission).toEqual({ commission_type: 'fixed', commission_value: 25 });
  });

  test('toggles status across both lists, persists after reload, and confirms function deletion', async ({ page, superAdmin, program, request }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Actions circle'));
    const func = await superAdmin.createFunction(program.programId, circle.circle_id, unique('Actions function'));
    const summaryURL = circleURL(program.programId, circle.circle_id);
    await page.goto(`${summaryURL}/functions`);
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: /Mark inactive/ }).click();
    await expect(functionRow(page, func.name).getByText('Inactive', { exact: true })).toBeVisible();
    await page.reload();
    await expect(functionRow(page, func.name).getByText('Inactive', { exact: true })).toBeVisible();
    expect((await superAdmin.getFunction(program.programId, func.function_id)).status).toBe('inactive');
    await page.goto(summaryURL);
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: /Mark active/ }).click();
    await expect(functionRow(page, func.name).getByText('Active', { exact: true })).toBeVisible();
    expect((await superAdmin.getFunction(program.programId, func.function_id)).status).toBe('active');
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(functionRow(page, func.name)).toBeVisible();
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('No functions in this circle', { exact: true })).toBeVisible();
    const response = await request.get(`${env.apiURL}/programs/${program.programId}/functions/${func.function_id}`, {
      headers: { Authorization: `Bearer ${superAdmin.accessToken}` },
    });
    expect(response.status()).toBe(404);
  });

  test('reports a failed status update and allows retry without changing the displayed status', async ({ page, superAdmin, program }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Retry circle'));
    const func = await superAdmin.createFunction(program.programId, circle.circle_id, unique('Retry function'));
    await page.goto(`${circleURL(program.programId, circle.circle_id)}/functions`);
    const endpoint = `**/api/programs/${program.programId}/functions/${func.function_id}`;
    await page.route(endpoint, async route => {
      if (route.request().method() === 'PATCH') await route.fulfill({ status: 500, json: { message: 'Test failure' } });
      else await route.continue();
    });
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: /Mark inactive/ }).click();
    await expect(page.getByText('Unable to update function status. Please try again.', { exact: true })).toBeVisible();
    await expect(functionRow(page, func.name).getByText('Active', { exact: true })).toBeVisible();
    expect((await superAdmin.getFunction(program.programId, func.function_id)).status).toBe('active');
    await page.unroute(endpoint);
    await openActions(page, func.name);
    await page.getByRole('menuitem', { name: /Mark inactive/ }).click();
    await expect(functionRow(page, func.name).getByText('Inactive', { exact: true })).toBeVisible();
  });

  test('scrolls condition rows while keeping the heading and add button fixed', async ({ page, superAdmin, program }) => {
    const circle = await superAdmin.createCircle(program.programId, unique('Scrolling circle'));
    await page.goto(`${circleURL(program.programId, circle.circle_id)}/functions`);
    await page.getByRole('button', { name: 'Create function', exact: true }).click();
    await page.getByLabel('Function name').fill(unique('Scrolling function'));
    await continueStep(page, 'Effect');
    await continueStep(page, 'Conditions');
    for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Add condition', exact: true }).click();
    const heading = page.getByRole('heading', { name: 'Conditions', exact: true });
    const addButton = page.getByRole('button', { name: 'Add condition', exact: true });
    const before = { heading: await heading.boundingBox(), add: await addButton.boundingBox() };
    const region = page.getByRole('region', { name: 'Conditions', exact: true });
    await region.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await region.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    expect((await heading.boundingBox())?.y).toBe(before.heading?.y);
    expect((await addButton.boundingBox())?.y).toBe(before.add?.y);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  });
});
