import { randomUUID } from 'node:crypto';
import { expect, test as base } from '@playwright/test';
import { CliqApi, type Link, type MemberCredentials, type Program, type Promoter } from '../api/cliq-api';
import { credentials, env } from '../env';

type Options = { signedIn: boolean };
type Fixtures = {
  superAdmin: CliqApi;
  program: Program;
  member: MemberCredentials;
  memberApi: CliqApi;
  promoter: Promoter;
  link: Link;
};

export const unique = (prefix: string): string => `${prefix} ${randomUUID().slice(0, 8)}`;

export const test = base.extend<Options & Fixtures>({
  signedIn: [true, { option: true }],

  superAdmin: async ({ playwright }, use) => {
    const request = await playwright.request.newContext();
    await use(await CliqApi.signIn(request, credentials.superAdmin));
    await request.dispose();
  },

  program: async ({ superAdmin }, use) => {
    await use(await superAdmin.createProgram(unique('E2E Promoter Portal')));
  },

  member: async ({ program, superAdmin }, use) => {
    const suffix = randomUUID().slice(0, 8);
    const member = {
      email: `e2e-member-${suffix}@cliq.test`,
      password: 'Member#e2e1',
      firstName: 'E2E',
      lastName: `Member ${suffix}`,
    };
    await superAdmin.createMember(program.programId, member);
    await use(member);
  },

  memberApi: async ({ playwright, program, member }, use) => {
    const request = await playwright.request.newContext();
    await use(await CliqApi.signInMember(request, program.programId, member));
    await request.dispose();
  },

  context: async ({ context, memberApi, signedIn }, use) => {
    if (signedIn) {
      await context.addCookies([{
        name: 'CLIQ_ACCESS_TOKEN',
        value: `Bearer ${memberApi.accessToken}`,
        url: env.baseURL,
        sameSite: 'Lax',
      }]);
    }
    await use(context);
  },

  promoter: async ({ memberApi, program }, use) => {
    await use(await memberApi.createPromoter(program.programId, unique('E2E Promoter')));
  },

  link: async ({ memberApi, program, promoter }, use) => {
    const refVal = `e2e-${randomUUID().slice(0, 8)}`;
    await use(await memberApi.createLink(program.programId, promoter.promoterId, unique('E2E Link'), refVal));
  },
});

export { expect };
