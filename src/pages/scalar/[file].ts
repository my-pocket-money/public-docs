import { readFile } from 'node:fs/promises';
import type { APIRoute, GetStaticPaths } from 'astro';
import { scalarBundle } from '../../scalar';

// Serves Scalar's browser bundle from this site, at the version pnpm-lock.yaml
// pins, instead of the unversioned jsDelivr URL @scalar/astro loads by default.
export const getStaticPaths = (() => [{ params: { file: scalarBundle.file } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async () => {
	// The source map isn't served, so drop the comment that points at it.
	const bundle = (await readFile(scalarBundle.path, 'utf8')).replace(/\n\/\/# sourceMappingURL=\S+\s*$/, '\n');
	return new Response(bundle, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
};
