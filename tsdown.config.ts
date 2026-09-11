import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['index.ts', 'cli.ts'],
	format: 'esm',
	clean: true,
	dts: true,
	external: ['puppeteer'],
	// Keep .js rather than tsdown's default .mjs: `bin` and `exports` in
	// package.json point at dist/cli.js and dist/index.js.
	outExtensions: () => ({ js: '.js' }),
	// Note: tsdown forces sourcemaps on whenever tsconfig has `declarationMap`,
	// which ours does, so dist gains .map files that tsup did not emit. They are
	// not published - `files` already excludes `dist/**/*.map`.
});
