// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { scalarStarlight } from '@scalar/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import { scalarBundle } from './src/scalar';

// Shared by every API reference. Function-valued options are dropped, since
// @scalar/starlight serializes this into the page.
const scalarConfiguration = {
	// Self-hosted at the pinned version; see src/pages/scalar/[file].ts.
	cdn: scalarBundle.url,
	defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
	featuredClients: ['shell/curl', 'node/fetch', 'python/requests', 'go/native'],
	// Test requests would send a reader's API key from the browser, through a
	// proxy for any API without CORS. Code samples only, until that's decided.
	hideTestRequestButton: true,
	hideClientButton: true,
	// Scalar's AI chat and developer toolbar default on for localhost only;
	// turn them off so local previews look like production.
	agent: { disabled: true },
	mcp: { disabled: true },
	showDeveloperTools: 'never',
	hideDarkModeToggle: true,
	withDefaultFonts: false,
	documentDownloadType: 'yaml',
};

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.pocketmoney.global',
	integrations: [
		starlight({
			title: 'Pocket Money Docs',
			description: 'Guides and API references for building on Pocket Money.',
			logo: { src: './src/assets/pocket-money.svg', replacesTitle: false },
			favicon: '/favicon.svg',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/my-pocket-money/public-docs' }],
			editLink: { baseUrl: 'https://github.com/my-pocket-money/public-docs/edit/main/' },
			customCss: [
				// Inter with its optical-size axis for reading; Outfit for the wordmark only.
				'@fontsource-variable/inter/opsz.css',
				'@fontsource-variable/outfit',
				'@fontsource-variable/jetbrains-mono',
				'./src/styles/public-docs.css',
			],
			components: {
				Head: './src/components/Head.astro',
				Header: './src/components/Header.astro',
				Sidebar: './src/components/Sidebar.astro',
			},
			plugins: [
				// Before sidebar-topics: with no sidebar defined yet, Scalar leaves
				// the sidebar alone, and each topic links its own reference.
				scalarStarlight({
					pathname: '/relay/api',
					label: 'API reference',
					title: 'Relay API reference',
					configuration: { ...scalarConfiguration, url: '/relay/openapi.yaml' },
				}),
				starlightSidebarTopics([
					{
						label: 'Relay',
						link: '/relay/',
						items: [
							'relay',
							'relay/transfers',
							{ label: 'Guides', items: [{ autogenerate: { directory: 'relay/guides' } }] },
							'relay/changelog',
						],
					},
					{
						label: 'Connect',
						link: '/connect/',
						items: ['connect'],
					},
				]),
				starlightLinksValidator({
					errorOnLocalLinks: false,
					// Served by an injected route and a static endpoint, not content pages.
					exclude: ['/relay/api/', '/relay/openapi.yaml'],
				}),
			],
		}),
	],
});
