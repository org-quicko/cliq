import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [swc.vite()],
	test: {
		include: ['test/e2e/**/*.e2e-spec.ts'],
		environment: 'node',
		globals: true,
		globalSetup: ['test/support/containers.ts'],
		// See vitest.config.integration.mts for why these are set here.
		env: {
			NODE_ENV: 'production',
			// JwtModule is registered with JWT_SECRET and AuthGuard verifies
			// against it; both need it present before any module is loaded.
			JWT_SECRET: 'e2e-test-secret',
			JWT_EXPIRES_IN: '1h',
			SALT_ROUNDS: '4',
			REFRESH_MV_CRON: '0 0 0 1 1 *',
		},
		// Each e2e spec boots the full Nest app against the shared containers.
		fileParallelism: false,
		testTimeout: 30000,
		hookTimeout: 60000,
	},
});
