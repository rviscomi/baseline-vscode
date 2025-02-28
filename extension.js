const vscode = require('vscode');
const path = require('path');

let diagnosticCollection;
let featureOptions = [];
let webFeatures = {};
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
	webFeatures = await loadWebFeatures();
	featureOptions = Object.entries(webFeatures.features).map(([featureId, feature]) => {
		return Object.assign(feature, {
			featureId,
			label: feature.name,
			detail: feature.description,
			description: featureId,
			baselineStatus: getBaselineStatus(feature.status)
		});
	});

	diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
	context.subscriptions.push(diagnosticCollection);

	context.subscriptions.push(
		vscode.commands.registerCommand('baseline-vscode.baselineSearch', runBaselineSearch)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider({ pattern: '**' }, new BaselineHoverProvider(context))
	);

	vscode.workspace.textDocuments.forEach(document => {
		validateBaselineFeatureIds(document);
	});

	vscode.workspace.onDidChangeTextDocument(event => {
		handleBaselineHotPhrase(event);
		validateBaselineFeatureIds(event.document);
	}, null, context.subscriptions);
	
	vscode.workspace.onDidOpenTextDocument(document => {
    validateBaselineFeatureIds(document);
  });
	vscode.workspace.onDidSaveTextDocument(document => {
		validateBaselineFeatureIds(document);
	});
}


function deactivate() { }


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
		`${feature.featureId} is ${feature.baselineStatus}`,
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

	// Check if the line contains either hot phrase.
	const position = editor.selection.active;
	const linePrefix = editor.document.lineAt(position).text.substr(0, position.character + 1);
	if (!linePrefix.endsWith('baseline/') && !linePrefix.match(/<baseline-status[^>]*featureId=[\'"]?$/)) {
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


function validateBaselineFeatureIds(document) {
	const issues = [];
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;
		const match = line.match(/(?:\bbaseline\/([a-z-]+)\b|<baseline-status[^>]*featureId=[\'"]?([a-z-]+)[\'"]?)/i);
		if (!match) {
			continue;
		}

		const featureId = (match[1] ?? match[2]).toLowerCase();
		if (isValidFeatureId(featureId)) {
			continue;
		}

		const startingIndex = match.index + match[0].indexOf(featureId);
		const range = new vscode.Range(i, startingIndex, i, startingIndex +featureId.length);
		const diagnostic = new vscode.Diagnostic(range, `Unrecognized Baseline feature ID: ${featureId}\n\nTry using the "Baseline search" command to find the feature you're looking for.`, vscode.DiagnosticSeverity.Error);
		issues.push(diagnostic);
	}

	diagnosticCollection.set(document.uri, issues);
}


class BaselineHoverProvider {
	constructor(context) {
		this.context = context;
	}

	provideHover(document, position, token) {
		// TODO: match only when the cursor is positioned on the phrase itself.
    const lineText = document.lineAt(position.line).text.substr(0, 100);
    const match = lineText.match(/(?:\bbaseline\/([a-z-]+)\b|<baseline-status[^>]*featureId=[\'"]?([a-z-]+)[\'"]?)/i);
		if (!match) {
			return;
		}

		const featureId = (match[1] ?? match[2]).toLowerCase();
		const featureInfo = featureOptions.find(feature => feature.featureId == featureId);
		if (!featureInfo) {
			// The feature ID is invalid and will be flagged by the diagnostic provider.
			return;
		}

		const markdownString = new vscode.MarkdownString();
		markdownString.supportHtml = true;
		markdownString.baseUri = vscode.Uri.file(path.join(this.context.extensionPath, 'img', path.sep));
		markdownString.appendMarkdown(getFeatureMarkdown(featureInfo));

		const startingIndex = match.index + match[0].indexOf(featureId);
		const range = new vscode.Range(
			position.line, startingIndex, position.line, startingIndex + featureId.length
		);
		return new vscode.Hover(markdownString, range);
	}
}


function getBaselineStatus(status) {
	if (status.baseline == 'low') {
		return `Baseline Newly available since ${status.baseline_low_date}`;
	}
	if (status.baseline == 'high') {
		return `Baseline Widely available since ${status.baseline_high_date}`;
	}
	return 'Limited availability across major browsers';
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
	const browser = webFeatures.browsers[browserId];
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


function isValidFeatureId(featureId) {
	return featureId in webFeatures.features;
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
${feature.baselineStatus}

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
