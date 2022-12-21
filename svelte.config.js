import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		preprocess({
			postcss: true,
		}),
	],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
		}),

		paths: {
			/** remove this true when publishing to github!!! */
			base: dev || true ? '' : '/priconne-quest-helper',
		},

		/*
		prerender: {
			crawl: true,
			enabled: true,
			onError: 'continue',
			default: true
		},*/
	}
};

export default config;
