import { test as setup } from '@playwright/test';
import { CliqApi } from '../helpers/api/cliq-api';
import { credentials, env } from '../helpers/env';

/** Creates the one reusable platform account when the e2e database is empty. */
setup('bootstrap the e2e super admin', async ({ request }) => {
  const anonymous = new CliqApi(request);
  const response = await request.post(`${env.apiURL}/users/signup`, {
    data: {
      email: credentials.superAdmin.email,
      password: credentials.superAdmin.password,
      first_name: credentials.superAdmin.firstName,
      last_name: credentials.superAdmin.lastName,
    },
  });

  if (!response.ok() && response.status() !== 409) {
    throw new Error(`Could not create the e2e super admin (${response.status()}): ${await response.text()}`);
  }

  await CliqApi.signIn(request, credentials.superAdmin).catch((error: Error) => {
    throw new Error(
      `${error.message}\n\n${env.apiURL} already has a super admin with different credentials. ` +
      'Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in e2e/.env.e2e.',
    );
  });
  void anonymous;
});
