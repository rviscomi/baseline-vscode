const vscode = require('vscode');
const path = require('path');

let featureOptions = [];
let browsers = {};
const BROWSER_NAME = {
	'chrome': 'Chrome',
	'chrome_android': 'Chrome Android',
	'firefox': 'Firefox',
	'firefox_android': 'Firefox for Android',
	'safari': 'Safari',
	'safari_ios': 'Safari on iOS',
	'edge': 'Edge'
};

async function loadWebFeatures() {
	try {
		return await import('web-features');
	} catch (error) {
		console.error('Error importing web-features:', error);
	}
}

async function activate(context) {

	const webFeatures = await loadWebFeatures();
	browsers = webFeatures.browsers;
	featureOptions = Object.entries(webFeatures.features).map(([featureId, feature]) => {
		return Object.assign(feature, {
			featureId,
			label: feature.name,
			detail: feature.description,
			description: featureId,
			baselineStatus: getBaselineStatus(feature.status)
		});
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('baseline-vscode.baselineSearch', runBaselineSearch)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider({ pattern: '**' }, new BaselineHoverProvider(context))
	);

	vscode.workspace.onDidChangeTextDocument(handleBaselineHotPhrase, null, context.subscriptions);
}

async function runBaselineSearch() {
	const feature = await vscode.window.showQuickPick(featureOptions, {
		matchOnDetail: true,
		placeHolder: 'Search for a web feature',
		title: 'Baseline search'
	});

	if (!feature) {
		return;
	}

	console.log(feature);
	const selection = await vscode.window.showInformationMessage(
		`${feature.featureId} is Baseline ${feature.baselineStatus}`,
		'Explore'
	);
	if (!selection) {
		return;
	}
	if (selection === 'Explore') {
		vscode.env.openExternal(vscode.Uri.parse(`https://webstatus.dev/features/${feature.featureId}/`));
	}
}

async function handleBaselineHotPhrase(event) {
	const editor = vscode.window.activeTextEditor;
	if (!editor || event.document !== editor.document || editor.document.lineCount === 0) {
		return;
	}

	// Check if the line contains the "baseline/" hot phrase.
	const position = editor.selection.active;
	const linePrefix = editor.document.lineAt(position).text.substr(0, position.character + 1);
	if (!linePrefix.endsWith('baseline/')) {
		return;
	}

	// Search for the feature ID.
	const selection = await vscode.window.showQuickPick(featureOptions);
	if (!selection) {
		return;
	}

	// Add the selected feature ID to the document.
	editor.edit(editBuilder => {
		editBuilder.insert(position.translate(0, 1), selection.featureId);
	});
}

class BaselineHoverProvider {
	constructor(context) {
		this.context = context;
	}

	provideHover(document, position, token) {
		// TODO: match only when the cursor is positioned on the phrase itself.
    const lineText = document.lineAt(position.line).text.substr(0, 100);
    const match = lineText.match(/\bbaseline\/([a-z-]+)\b/i);
		if (!match) {
			return;
		}

		const featureId = match[1].toLowerCase();
		const featureInfo = featureOptions.find(feature => feature.featureId == featureId);
		if (!featureInfo) {
			console.warn('Unable to get Baseline info for feature:', featureId);
			return;
		}

		const markdownString = new vscode.MarkdownString();
		markdownString.supportHtml = true;
		markdownString.baseUri = vscode.Uri.file(path.join(this.context.extensionPath, 'img', path.sep));
		markdownString.appendMarkdown(getFeatureMarkdown(featureInfo));
		const range = new vscode.Range(
			position.line, match.index, position.line, match.index + match[0].length
		);
		return new vscode.Hover(markdownString, range);
	}
}

function deactivate() { }

function getBaselineStatus(status) {
	if (status.baseline == 'low') {
		return `Newly available since ${status.baseline_low_date}`;
	}
	if (status.baseline == 'high') {
		return `Widely available since ${status.baseline_high_date}`;
	}
	return 'Limited availability';
}

function getBrowserName(browserId) {
	const name = BROWSER_NAME[browserId];
	if (!name) {
		console.warn('Unknown browser ID:', browserId);
	}
	return name || browserId;
}

function getBaselineImg(status) {
	if (status.baseline == 'low') {
		return 'baseline-newly-icon.png';
	}
	if (status.baseline == 'high') {
		return 'baseline-widely-icon.png';
	}
	return 'baseline-limited-icon.png';
}

function getReleaseDate(browserId, version) {
	const browser = browsers[browserId];
	if (!browser) {
		console.warn('Unknown browser ID:', browserId);
		return 'Unknown';
	}

	const release = browser.releases.find(r => r.version === version);
	if (!release) {
		console.warn('Unknown version for browser', browserId, version);
		return 'Unknown';
	}

	return release.date;
}

function sanitizeFeatureName(featureName) {
	if (featureName.startsWith('<')) {
		return featureName.replace('<', '&#x3C;');
	}
	return featureName;
}

function getFeatureMarkdown(feature) {
	return `### ${sanitizeFeatureName(feature.name)}

${feature.description_html}

<img src="https://web-platform-dx.github.io/web-features/assets/img/${getBaselineImg(feature.status)}" alt="Baseline icon" width="25" height="14" style="vertical-align: middle;" /> \
Baseline ${feature.baselineStatus}

Browser version | Relase date
--- | ---
${Object.entries(feature.status.support).map(([browser, version]) => {
	return `${getBrowserName(browser)} ${version} | ${getReleaseDate(browser, version)}`;
}).join('\n')}
`;
}

module.exports = {
	activate,
	deactivate
}
