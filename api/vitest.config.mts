import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	// SWC (instead of Vite's default esbuild transform) so decorator metadata
	// is emitted — Nest's DI and class-validator both rely on it.
	plugins: [swc.vite()],
	test: {
		include: ['src/**/*.spec.ts'],
		environment: 'node',
		globals: true,
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,js}'],
		},
	},
});
