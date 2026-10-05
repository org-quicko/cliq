import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [swc.vite()],
	test: {
		include: ['test/integration/**/*.spec.ts'],
		environment: 'node',
		globals: true,
		globalSetup: ['test/support/containers.ts'],
		// Set here rather than via process.env in globalSetup: Vite/Vitest
		// special-case NODE_ENV when building each worker's env, so a
		// globalSetup mutation doesn't reliably reach the workers.
		env: {
			// typeOrmConfig gates `synchronize` on NODE_ENV. The schema comes from
			// the real migrations (run in globalSetup), so synchronize must stay
			// off or it tries to recreate the materialized views.
			NODE_ENV: 'production',
			JWT_SECRET: 'integration-test-secret',
			JWT_EXPIRES_IN: '1h',
			SALT_ROUNDS: '4',
			// MaterializedViewRefreshService reads this at class-decoration time.
			// Midnight on Jan 1 never fires during a run, so the job can't
			// interleave with a test's open transaction.
			REFRESH_MV_CRON: '0 0 0 1 1 *',
		},
		// Specs share one database. Running files in parallel would let one
		// file's writes leak into another's assertions.
		fileParallelism: false,
		testTimeout: 30000,
		hookTimeout: 60000,
	},
});
