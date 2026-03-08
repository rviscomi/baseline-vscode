import { BROWSER_NAME, BASELINE_ID_REGEX } from './constants.js';
import * as vscode from 'vscode';
import { getReleaseDate, FeatureStatus } from './web-features.js';

export function extractFeatureId(match: any) {
	return match?.slice(1).find((group: any) => group !== undefined)?.toLowerCase();
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

export function findFeatureIdsInLine(document: vscode.TextDocument, lineIndex: number) {
	const lineText = document.lineAt(lineIndex).text;
	const matches: any[] = [];

	for (const match of lineText.matchAll(new RegExp(BASELINE_ID_REGEX, 'gi'))) {
		const featureId = extractFeatureId(match);
		if (featureId) {
			matches.push({
				featureId,
				startingIndex: match.index + match[0].indexOf(featureId)
			});
		}
	}

	const yamlMatch = /^\s*-\s+([a-z-]+)\s*$/.exec(lineText);
	if (yamlMatch) {
		if (isInsideWebFeatureIds(document, lineIndex)) {
			matches.push({
				featureId: yamlMatch[1],
				startingIndex: lineText.indexOf(yamlMatch[1])
			});
		}
	}

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

export function getBrowserName(browserId: string) {
	const name = (BROWSER_NAME as any)[browserId];
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

export function getFeatureMarkdown(feature: any) {
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

