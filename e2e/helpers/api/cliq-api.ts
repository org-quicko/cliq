import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../env';

type SuperAdminCredentials = {
  email: string;
  password: string;
};

export interface Program {
  programId: string;
  name: string;
  website: string;
}

export interface Circle {
  circle_id: string;
  name: string;
}

export interface ProgramFunction {
  function_id: string;
  circle_id: string;
  name: string;
  trigger: string;
  status: 'active' | 'inactive';
  effect_type: string;
  effect: {
    commission?: { commission_type: string; commission_value: number };
    target_circle_id?: string;
  };
  conditions: { condition_id: string; condition: { parameter: string; operator: string; value: number | string } }[];
}

export interface Promoter {
  promoterId: string;
  name: string;
}

export interface MemberCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Link {
  name: string;
  refVal: string;
}

interface ApiKey {
  key: string;
  secret: string;
}

async function unwrap<T>(description: string, response: Promise<APIResponse>): Promise<T> {
  const result = await response;
  const body = (await result.json()) as { data?: T; message?: string };
  if (!result.ok()) {
    throw new Error(`${description} failed (${result.status()}): ${body.message ?? JSON.stringify(body)}`);
  }
  return body.data as T;
}

export class CliqApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  get accessToken(): string {
    if (!this.token) throw new Error('This request needs an authenticated API client.');
    return this.token;
  }

  static async signIn(request: APIRequestContext, credentials: SuperAdminCredentials): Promise<CliqApi> {
    const data = await unwrap<{ access_token: string }>(
      `sign in as ${credentials.email}`,
      request.post(`${env.apiURL}/users/login`, {
        data: { email: credentials.email, password: credentials.password },
      }),
    );
    return new CliqApi(request, data.access_token);
  }

  static async signInMember(
    request: APIRequestContext,
    programId: string,
    credentials: Pick<MemberCredentials, 'email' | 'password'>,
  ): Promise<CliqApi> {
    const data = await unwrap<{ access_token: string }>(
      `sign in member ${credentials.email}`,
      request.post(`${env.apiURL}/programs/${programId}/members/login`, {
        data: credentials,
      }),
    );
    return new CliqApi(request, data.access_token);
  }

  private auth(): Record<string, string> {
    if (!this.token) throw new Error('This request needs an authenticated API client.');
    return { Authorization: `Bearer ${this.token}` };
  }

  async createProgram(name: string): Promise<Program> {
    const data = await unwrap<{ program_id: string; name: string; website: string }>(
      `create program ${name}`,
      this.request.post(`${env.apiURL}/programs`, {
        headers: this.auth(),
        data: {
          name,
          website: 'https://e2e.cliq.test',
          currency: 'INR',
          visibility: 'public',
          referral_key_type: 'email',
          time_zone: 'Asia/Kolkata',
        },
      }),
    );
    return { programId: data.program_id, name: data.name, website: data.website };
  }

  async deleteProgram(programId: string): Promise<void> {
    await unwrap(`delete program ${programId}`, this.request.delete(`${env.apiURL}/programs/${programId}`, {
      headers: this.auth(),
    }));
  }

  async createCircle(programId: string, name: string): Promise<Circle> {
    return unwrap<Circle>(`create circle ${name}`, this.request.post(`${env.apiURL}/programs/${programId}/circles`, {
      headers: this.auth(), data: { name },
    }));
  }

  async createFunction(programId: string, circleId: string, name: string, overrides: Record<string, unknown> = {}): Promise<ProgramFunction> {
    return unwrap<ProgramFunction>(`create function ${name}`, this.request.post(`${env.apiURL}/programs/${programId}/functions`, {
      headers: this.auth(),
      data: {
        name, circle_id: circleId, trigger: 'purchase', effect_type: 'generate_commission',
        effect: { commission: { commission_type: 'percentage', commission_value: 10 } },
        conditions: [], ...overrides,
      },
    }));
  }

  async getFunction(programId: string, functionId: string): Promise<ProgramFunction> {
    return unwrap<ProgramFunction>(`get function ${functionId}`, this.request.get(`${env.apiURL}/programs/${programId}/functions/${functionId}`, {
      headers: this.auth(),
    }));
  }

  async createMember(programId: string, member: MemberCredentials): Promise<void> {
    await unwrap(
      `create member ${member.email}`,
      this.request.post(`${env.apiURL}/programs/${programId}/members/signup`, {
        data: {
          email: member.email,
          password: member.password,
          first_name: member.firstName,
          last_name: member.lastName,
        },
      }),
    );
  }

  async createPromoter(programId: string, name: string): Promise<Promoter> {
    const data = await unwrap<{ promoter_id: string; name: string }>(
      `create promoter ${name}`,
      this.request.post(`${env.apiURL}/programs/${programId}/promoters`, {
        headers: this.auth(),
        data: { name },
      }),
    );
    await unwrap(
      `register promoter ${data.promoter_id}`,
      this.request.post(`${env.apiURL}/programs/${programId}/promoters/${data.promoter_id}/register`, {
        headers: this.auth(),
        data: { accepted_terms_and_conditions: true },
      }),
    );
    return { promoterId: data.promoter_id, name: data.name };
  }

  async createLink(programId: string, promoterId: string, name: string, refVal: string): Promise<Link> {
    await unwrap(
      `create link ${name}`,
      this.request.post(`${env.apiURL}/programs/${programId}/promoters/${promoterId}/links`, {
        headers: this.auth(),
        data: { name, ref_val: refVal },
      }),
    );
    return { name, refVal };
  }

  async createApiKey(programId: string): Promise<ApiKey> {
    return unwrap<ApiKey>(
      `create API key for ${programId}`,
      this.request.post(`${env.apiURL}/programs/${programId}/api-keys`, { headers: this.auth() }),
    );
  }

  async createSignup(programId: string, apiKey: ApiKey, refVal: string, email: string): Promise<void> {
    await unwrap(
      `create signup for ${email}`,
      this.request.post(`${env.apiURL}/signups`, {
        headers: { 'x-api-key': apiKey.key, 'x-api-secret': apiKey.secret, program_id: programId },
        data: { ref_val: refVal, email, first_name: 'E2E', last_name: 'Referral' },
      }),
    );
  }
}
