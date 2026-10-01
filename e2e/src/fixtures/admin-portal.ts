import { randomUUID } from 'node:crypto';
import { expect, test as base } from '@playwright/test';
import { CliqApi, type Link, type Program, type Promoter } from '../api/cliq-api';
import { credentials, env } from '../env';

type Fixtures = {
  superAdmin: CliqApi;
  program: Program;
  promoter: Promoter;
  link: Link;
};

export const unique = (prefix: string): string => `${prefix} ${randomUUID().slice(0, 8)}`;

export const test = base.extend<Fixtures>({
  superAdmin: async ({ playwright }, use) => {
    const request = await playwright.request.newContext();
    await use(await CliqApi.signIn(request, credentials.superAdmin));
    await request.dispose();
  },

  context: async ({ context, superAdmin }, use) => {
    await context.addCookies([{
      name: 'CLIQ_ACCESS_TOKEN',
      value: `Bearer ${superAdmin.accessToken}`,
      url: `${env.baseURL}/admin`,
      sameSite: 'Lax',
    }]);
    await use(context);
  },

  program: async ({ superAdmin }, use) => {
    const program = await superAdmin.createProgram(unique('E2E Program'));
    // Programs with tracked activity cannot currently be removed through the
    // API: the server leaves their circle/contact relations behind. The local
    // e2e stack owns a tmpfs database and `stack:down` clears it, so leaving
    // each uniquely named fixture in this throwaway database is intentional.
    await use(program);
  },

  promoter: async ({ superAdmin, program }, use) => {
    await use(await superAdmin.createPromoter(program.programId, unique('E2E Promoter')));
  },

  link: async ({ superAdmin, program, promoter }, use) => {
    const refVal = `e2e-${randomUUID().slice(0, 8)}`;
    await use(await superAdmin.createLink(program.programId, promoter.promoterId, unique('E2E Link'), refVal));
  },
});

export { expect };
