export const BROWSER_NAME: Record<string, string> = {
	'chrome': 'Chrome',
	'chrome_android': 'Chrome Android',
	'edge': 'Edge',
	'safari': 'Safari',
	'safari_ios': 'Safari on iOS',
	'firefox': 'Firefox',
	'firefox_android': 'Firefox for Android'
};



export const SUPPORTED_LANGUAGES: string[] = [
	'javascript',
	'javascriptreact',
	'typescript',
	'typescriptreact',
	'html',
	'css',
	'scss',
	'less',
	'vue',
	'svelte',
	'astro',
	'markdown',
	'mdx',
	'yaml',
	'json',
	'jsonc'
];

export const PATTERNS = {
	PREFIX: {
		full: /baseline\/([a-z-]+)\b/i,
		trigger: /baseline\/$/
	},
	TAG: {
		full: /<baseline-status[^>]*featureId=['"]?([a-z-]+)['"]?/i,
		trigger: /<baseline-status[^>]*featureId=['"]?$/
	},
	MACRO: {
		full: /{{\s*BASELINE_STATUS\(['"]?([a-z-]+)['"]?\)\s*}}/i,
		trigger: /{{\s*BASELINE_STATUS\(['"]?$/
	},
	TODO: {
		full: /TODO\(baseline\/([a-z-]+)\)/i,
		trigger: /TODO\(baseline\/$/
	}
};

export const BASELINE_ID_REGEX = new RegExp(
	Object.values(PATTERNS).map(p => p.full.source).join('|'),
	'i'
);

