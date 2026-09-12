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

export const IGNORE_LIST = [
	'feature-id',
	'example'
];

export const PATTERNS = {
	PREFIX: {
		full: /(?<![/\\.\w-])baseline\/((?:api|css|html|http|javascript|manifests|svg|mediatypes|mathml|webdriver|webassembly)\.[a-zA-Z0-9_@-]+(?:\.[a-zA-Z0-9_@-]+)*|[a-z-]+(?![/\w-]|(?:\.[a-z0-9])))/i,
		trigger: /(?<![/\\.\w-])baseline\/$/
	},
	TAG: {
		full: /<baseline-status[^>]*featureId=['"]?([a-z-]+)['"]?/i,
		trigger: /<baseline-status[^>]*featureId=['"]?$/
	},
	MACRO: {
		full: /{{\s*(?:macros\.BaselineStatus|BASELINE_STATUS)\(\s*['"]?([a-z-]+)['"]?\s*(?:,\s*['"]?([^'"]+?)['"]?\s*)?\)\s*}}/i,
		trigger: /{{\s*(?:macros\.BaselineStatus|BASELINE_STATUS)\(['"]?$/
	},
	TODO: {
		full: /TODO\(baseline\/([a-zA-Z0-9_@-]+(?:\.[a-zA-Z0-9_@-]+)*)\)/i,
		trigger: /TODO\(baseline\/$/
	},
	YAML: {
		full: /(?:^|\s)keywords:\s*(?:[^,\n]+,\s*)*webfeature_([a-z-]+)/i,
		trigger: /(?:^|\s)keywords:\s*(?:[^,\n]+,\s*)*webfeature_$/i
	}
};

export const BASELINE_ID_REGEX = new RegExp(
	Object.values(PATTERNS).map(p => p.full.source).join('|'),
	'i'
);

