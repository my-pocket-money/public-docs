import { readFile } from 'node:fs/promises';
import type { APIRoute } from 'astro';

// Serves the locked release contract as-is, so the API reference and the
// download are the file that `pnpm spec:build` checked. Prerendered into dist/.
export const GET: APIRoute = async () => {
	const spec = await readFile(new URL('../../../openapi/relay/release/openapi.yaml', import.meta.url), 'utf8');
	return new Response(spec, { headers: { 'Content-Type': 'application/yaml; charset=utf-8' } });
};
