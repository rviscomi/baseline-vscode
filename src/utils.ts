import { BROWSER_NAME, PATTERNS, IGNORE_LIST } from './constants.js';
import * as vscode from 'vscode';
import { getReleaseDate, FeatureStatus, FeatureOption } from './web-features.js';

export interface FeatureMatch {
	featureId: string;
	compatKey?: string;
	startingIndex: number;
	endingIndex: number;
}

export function extractFeatureId(match: RegExpMatchArray): string | undefined {
	return match?.slice(1).find((group: string) => group !== undefined)?.toLowerCase();
}

export function isInsideWebFeatureIds(document: vscode.TextDocument, lineIndex: number) {
	for (let i = lineIndex - 1; i >= 0; i--) {
		const text = document.lineAt(i).text.trim();
		if (text.startsWith('web-feature-ids:')) {
			return true;
		}
		if (text && text !== '---' && !text.startsWith('-') && !text.startsWith('#')) {
			return false;
		}
	}
	return false;
}

export function findFeatureIdsInLine(document: vscode.TextDocument, lineIndex: number): FeatureMatch[] {
	const lineText = document.lineAt(lineIndex).text;
	const matches: FeatureMatch[] = [];

	for (const [patternName, pattern] of Object.entries(PATTERNS)) {
		for (const match of lineText.matchAll(new RegExp(pattern.full, 'gi'))) {
			const featureId = match[1]?.toLowerCase();
			if (featureId && !IGNORE_LIST.includes(featureId)) {
				const compatKey = patternName === 'MACRO' ? match[2] : undefined;
				const matchStr = match[0];

				const featureIdStartInMatch = matchStr.indexOf(match[1]);
				const startingIndex = match.index + featureIdStartInMatch;
				
				let endingIndex: number;
				if (compatKey) {
					const compatKeyStartInMatch = matchStr.lastIndexOf(match[2]);
					endingIndex = match.index + compatKeyStartInMatch + match[2].length;
				} else {
					endingIndex = startingIndex + match[1].length;
				}

				matches.push({
					featureId,
					compatKey,
					startingIndex,
					endingIndex
				});
			}
		}
	}

	const yamlMatch = /^\s*-\s+([a-z-]+)\s*$/.exec(lineText);
	if (yamlMatch) {
		const featureId = yamlMatch[1];
		if (isInsideWebFeatureIds(document, lineIndex) && !IGNORE_LIST.includes(featureId)) {
			const startingIndex = lineText.indexOf(featureId);
			matches.push({
				featureId,
				startingIndex,
				endingIndex: startingIndex + featureId.length
			});
		}
	}

	// Sort matches by startingIndex to maintain chronological document order
	matches.sort((a, b) => a.startingIndex - b.startingIndex);

	return matches;
}

export function getBaselineStatus(status?: FeatureStatus) {
	if (!status) {
		return 'Status unavailable';
	}
	if (status.baseline == 'low') {
		return `Baseline Newly available since ${status.baseline_low_date}`;
	}
	if (status.baseline == 'high') {
		return `Baseline Widely available since ${status.baseline_high_date}`;
	}
	return 'Limited availability across major browsers';
}

export function getBrowserName(browserId: string): string {
	const name = BROWSER_NAME[browserId];
	if (!name) {
		console.warn('Unknown browser ID:', browserId);
	}
	return name || browserId;
}

export function getBaselineImg(status?: FeatureStatus) {
	if (!status) {
		return 'img/baseline-limited-icon.svg';
	}
	if (status.baseline == 'low') {
		return 'img/baseline-newly-icon.svg';
	}
	if (status.baseline == 'high') {
		return 'img/baseline-widely-icon.svg';
	}
	return 'img/baseline-limited-icon.svg';
}



export function sanitizeFeatureName(featureName: string) {
	if (featureName.startsWith('<')) {
		return featureName.replace('<', '&#x3C;');
	}
	return featureName;
}

export function getFeatureMarkdown(feature: FeatureOption): string {
	return `### <img src="${getBaselineImg(feature.status)}" alt="Baseline icon" width="25" height="14" align="center" /> ${sanitizeFeatureName(feature.name)}

${feature.description_html}

${feature.baselineStatus}

Browser version | Relase date
--- | ---
${Object.keys(BROWSER_NAME).map((browser) => {
		const version = feature.status?.support?.[browser];
		if (!version) {
			return `${getBrowserName(browser)} | 🅇`;
		}
		return `${getBrowserName(browser)} ${version} | ${getReleaseDate(browser, version)}`;
	}).join('\n')}
`;
}

export function getCompatFeatureMarkdown(feature: FeatureOption, compatKey: string): string {
	const compatStatus = feature.status?.by_compat_key?.[compatKey];
	if (!compatStatus) {
		return getFeatureMarkdown(feature);
	}

	const baselineStatusText = getBaselineStatus(compatStatus);
	const imgPath = getBaselineImg(compatStatus);

	return `### <img src="${imgPath}" alt="Baseline icon" width="25" height="14" align="center" /> ${sanitizeFeatureName(feature.name)} (${compatKey})

${feature.description_html}

**Subfeature status:** ${baselineStatusText}

Browser version | Relase date
--- | ---
${Object.keys(BROWSER_NAME).map((browser) => {
		const version = compatStatus.support?.[browser];
		if (!version) {
			return `${getBrowserName(browser)} | 🅇`;
		}
		return `${getBrowserName(browser)} ${version} | ${getReleaseDate(browser, version)}`;
	}).join('\n')}
`;
}

