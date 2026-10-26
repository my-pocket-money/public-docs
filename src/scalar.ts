import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// Scalar's self-contained browser bundle, from the installed @scalar/api-reference.
// The package doesn't export it, so it's found beside the main entry. The
// version in the file name changes the URL whenever the pin changes.
const dist = dirname(createRequire(import.meta.url).resolve('@scalar/api-reference'));
const { version } = JSON.parse(readFileSync(join(dist, '../package.json'), 'utf8'));

export const scalarBundle = {
	path: join(dist, 'browser/standalone.js'),
	file: `api-reference-${version}.js`,
	url: `/scalar/api-reference-${version}.js`,
};
