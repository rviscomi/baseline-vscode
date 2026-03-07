const vscode = require('vscode');
const path = require('path');

let diagnosticCollection;
let featureOptions = [];
let webFeatures = {};
const BROWSER_NAME = {
	'chrome': 'Chrome',
	'chrome_android': 'Chrome Android',
	'edge': 'Edge',
	'safari': 'Safari',
	'safari_ios': 'Safari on iOS',
	'firefox': 'Firefox',
	'firefox_android': 'Firefox for Android'
};

const BaselineImages = {
	BASELINE_LIMITED: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCA1NDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxzdHlsZT4KICAgIC5ncmF5LXNoYXBlIHsKICAgICAgZmlsbDogI0M2QzZDNjsgLyogTGlnaHQgbW9kZSAqLwogICAgfQoKICAgIEBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHsKICAgICAgLmdyYXktc2hhcGUgewogICAgICAgIGZpbGw6ICM1NjU2NTY7IC8qIERhcmsgbW9kZSAqLwogICAgICB9CiAgICB9CiAgPC9zdHlsZT4KICA8cGF0aCBkPSJNMTUwIDBMMjQwIDkwTDIxMCAxMjBMMTIwIDMwTDE1MCAwWiIgZmlsbD0iI0YwOTQwOSIvPgogIDxwYXRoIGQ9Ik00MjAgMzBMNTQwIDE1MEw0MjAgMjcwTDM5MCAyNDBMNDgwIDE1MEwzOTAgNjBMNDIwIDMwWiIgY2xhc3M9ImdyYXktc2hhcGUiLz4KICA8cGF0aCBkPSJNMzMwIDE4MEwzMDAgMjEwTDM5MCAzMDBMNDIwIDI3MEwzMzAgMTgwWiIgZmlsbD0iI0YwOTQwOSIvPgogIDxwYXRoIGQ9Ik0xMjAgMzBMMTUwIDYwTDYwIDE1MEwxNTAgMjQwTDEyMCAyNzBMMCAxNTBMMTIwIDMwWiIgY2xhc3M9ImdyYXktc2hhcGUiLz4KICA8cGF0aCBkPSJNMzkwIDBMNDIwIDMwTDE1MCAzMDBMMTIwIDI3MEwzOTAgMFoiIGZpbGw9IiNGMDk0MDkiLz4KPC9zdmc+',
	BASELINE_LOW: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCA1NDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxzdHlsZT4KICAgIC5ibHVlLXNoYXBlIHsKICAgICAgZmlsbDogI0E4QzdGQTsgLyogTGlnaHQgbW9kZSAqLwogICAgfQoKICAgIEBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHsKICAgICAgLmJsdWUtc2hhcGUgewogICAgICAgIGZpbGw6ICMyRDUwOUU7IC8qIERhcmsgbW9kZSAqLwogICAgICB9CiAgICB9CgogICAgLmRhcmtlci1ibHVlLXNoYXBlIHsKICAgICAgICBmaWxsOiAjMUI2RUYzOwogICAgfQoKICAgIEBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHsKICAgICAgICAuZGFya2VyLWJsdWUtc2hhcGUgewogICAgICAgICAgICBmaWxsOiAjNDE4NUZGOwogICAgICAgIH0KICAgIH0KCiAgPC9zdHlsZT4KICA8cGF0aCBkPSJNMTUwIDBMMTgwIDMwTDE1MCA2MEwxMjAgMzBMMTUwIDBaIiBjbGFzcz0iYmx1ZS1zaGFwZSIvPgogIDxwYXRoIGQ9Ik0yMTAgNjBMMjQwIDkwTDIxMCAxMjBMMTgwIDkwTDIxMCA2MFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTQ1MCA2MEw0ODAgOTBMNDUwIDEyMEw0MjAgOTBMNDUwIDYwWiIgY2xhc3M9ImJsdWUtc2hhcGUiLz4KICA8cGF0aCBkPSJNNTEwIDEyMEw1NDAgMTUwTDUxMCAxODBMNDgwIDE1MEw1MTAgMTIwWiIgY2xhc3M9ImJsdWUtc2hhcGUiLz4KICA8cGF0aCBkPSJNNDUwIDE4MEw0ODAgMjEwTDQ1MCAyNDBMNDIwIDIxMEw0NTAgMTgwWiIgY2xhc3M9ImJsdWUtc2hhcGUiLz4KICA8cGF0aCBkPSJNMzkwIDI0MEw0MjAgMjcwTDM5MCAzMDBMMzYwIDI3MEwzOTAgMjQwWiIgY2xhc3M9ImJsdWUtc2hhcGUiLz4KICA8cGF0aCBkPSJNMzMwIDE4MEwzNjAgMjEwTDMzMCAyNDBMMzAwIDIxMEwzMzAgMTgwWiIgY2xhc3M9ImJsdWUtc2hhcGUiLz4KICA8cGF0aCBkPSJNOTAgNjBMMTIwIDkwTDkwIDEyMEw2MCA5MEw5MCA2MFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTM5MCAwTDQyMCAzMEwxNTAgMzAwTDAgMTUwTDMwIDEyMEwxNTAgMjQwTDM5MCAwWiIgY2xhc3M9ImRhcmtlci1ibHVlLXNoYXBlIi8+Cjwvc3ZnPg==',
	BASELINE_HIGH: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCA1NDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxzdHlsZT4KICAgIC5ncmVlbi1zaGFwZSB7CiAgICAgIGZpbGw6ICNDNEVFRDA7IC8qIExpZ2h0IG1vZGUgKi8KICAgIH0KCiAgICBAbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7CiAgICAgIC5ncmVlbi1zaGFwZSB7CiAgICAgICAgZmlsbDogIzEyNTIyNTsgLyogRGFyayBtb2RlICovCiAgICAgIH0KICAgIH0KICA8L3N0eWxlPgogIDxwYXRoIGQ9Ik00MjAgMzBMMzkwIDYwTDQ4MCAxNTBMMzkwIDI0MEwzMzAgMTgwTDMwMCAyMTBMMzkwIDMwMEw1NDAgMTUwTDQyMCAzMFoiIGNsYXNzPSJncmVlbi1zaGFwZSIvPgogIDxwYXRoIGQ9Ik0xNTAgMEwzMCAxMjBMNjAgMTUwTDE1MCA2MEwyMTAgMTIwTDI0MCA5MEwxNTAgMFoiIGNsYXNzPSJncmVlbi1zaGFwZSIvPgogIDxwYXRoIGQ9Ik0zOTAgMEw0MjAgMzBMMzkwIDYwTDMwIDMwMEwwIDI3MEwzOTAgMFoiIGZpbGw9IiMxRUE0NDYiLz4KPC9zdmc+'
};

const PATTERNS = {
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

const BASELINE_ID_REGEX = new RegExp(
	Object.values(PATTERNS).map(p => p.full.source).join('|'),
	'i'
);

function extractFeatureId(match) {
	return match?.slice(1).find(group => group !== undefined)?.toLowerCase();
}

async function loadWebFeatures() {
	try {
		return await import('web-features');
	} catch (error) {
		console.error('Error importing web-features:', error);
	}
}

async function activate(context) {
	webFeatures = await loadWebFeatures();
	featureOptions = Object.entries(webFeatures.features)
		.filter(([, feature]) => feature.kind === 'feature')
		.map(([featureId, feature]) => {
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
		vscode.languages.registerHoverProvider(['javascript', 'markdown', 'html'], new BaselineHoverProvider(context))
	);
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(['javascript', 'markdown', 'html'], new BaselineCodeActionProvider(), {
			providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
		})
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

	const { name: featureName, status } = feature;
	const { baseline, baseline_low_date } = status || {};

	const message = (baseline === 'low' || baseline === 'high') && baseline_low_date
		? `${featureName} is ${baseline === 'high' ? 'Widely available' : 'Newly available'}. It's been Baseline since ${baseline_low_date}.`
		: `${featureName} is not supported across all major browsers.`;

	const selection = await vscode.window.showInformationMessage(message, 'Explore');
	if (!selection) {
		return;
	}
	if (selection === 'Explore') {
		vscode.env.openExternal(vscode.Uri.parse(`https://webstatus.dev/features/${feature.featureId}/`));
	}
}


async function handleBaselineHotPhrase(event) {
	const editor = vscode.window.activeTextEditor;
	if (!editor || event.document !== editor.document || editor.document.lineCount === 0 || !['javascript', 'markdown', 'html'].includes(event.document.languageId)) {
		return;
	}

	// Check if the line matches any trigger pattern.
	const position = editor.selection.active;
	const linePrefix = editor.document.lineAt(position).text.substr(0, position.character + 1);
	const hasTriggerMatch = Object.values(PATTERNS).some(p => linePrefix.match(p.trigger));
	if (!hasTriggerMatch) {
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
	if (!['javascript', 'markdown', 'html'].includes(document.languageId)) {
		return;
	}
	const issues = [];
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;
		const matches = line.matchAll(new RegExp(BASELINE_ID_REGEX, 'gi'));

		for (const match of matches) {
			const featureId = extractFeatureId(match);
			if (isValidFeatureId(featureId)) {
				continue;
			}

			const startingIndex = match.index + match[0].indexOf(featureId);
			const range = new vscode.Range(i, startingIndex, i, startingIndex + featureId.length);
			
			let errorMessage = `Unrecognized Baseline feature ID: ${featureId}\n\nTry using the "Baseline search" command to find the feature you're looking for.`;
			const feature = webFeatures.features[featureId];
			if (feature) {
				if (feature.kind === 'moved') {
					errorMessage = `Baseline feature ID '${featureId}' has been replaced by '${feature.redirect_target}'.`;
				} else if (feature.kind === 'split') {
					errorMessage = `Baseline feature ID '${featureId}' has been split into: ${feature.redirect_targets.join(', ')}.`;
				}
			}

			const diagnostic = new vscode.Diagnostic(range, errorMessage, vscode.DiagnosticSeverity.Error);
			issues.push(diagnostic);
		}
	}

	diagnosticCollection.set(document.uri, issues);
}


class BaselineHoverProvider {
	constructor(context) {
		this.context = context;
	}

	provideHover(document, position) {
		const lineText = document.lineAt(position.line).text.substr(0, 100);
		const matches = lineText.matchAll(new RegExp(BASELINE_ID_REGEX, 'gi'));

		for (const match of matches) {
			const featureId = extractFeatureId(match);
			const startingIndex = match.index;
			const endingIndex = match.index + match[0].length;

			if (position.character < startingIndex || position.character >= endingIndex) {
				continue;
			}

			const featureInfo = featureOptions.find(feature => feature.featureId == featureId);
			if (!featureInfo) {
				continue;
			}

			const markdownString = new vscode.MarkdownString();
			markdownString.supportHtml = true;
			markdownString.baseUri = vscode.Uri.file(path.join(this.context.extensionPath, 'img', path.sep));
			markdownString.appendMarkdown(getFeatureMarkdown(featureInfo));

			const range = new vscode.Range(
				position.line, startingIndex, position.line, endingIndex
			);
			return new vscode.Hover(markdownString, range);
		}
	}
}


class BaselineCodeActionProvider {
	provideCodeActions(document, range, context) {
		const actions = [];
		for (const diagnostic of context.diagnostics) {
			const featureId = document.getText(diagnostic.range);
			const feature = webFeatures.features[featureId];
			if (feature && feature.kind === 'moved') {
				const fix = new vscode.CodeAction(`Replace with '${feature.redirect_target}'`, vscode.CodeActionKind.QuickFix);
				fix.edit = new vscode.WorkspaceEdit();
				fix.edit.replace(document.uri, diagnostic.range, feature.redirect_target);
				fix.diagnostics = [diagnostic];
				fix.isPreferred = true;
				actions.push(fix);
			}
		}
		return actions;
	}
}


function getBaselineStatus(status) {
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


function getBrowserName(browserId) {
	const name = BROWSER_NAME[browserId];
	if (!name) {
		console.warn('Unknown browser ID:', browserId);
	}
	return name || browserId;
}


function getBaselineImg(status) {
	if (!status) {
		return BaselineImages.BASELINE_LIMITED;
	}
	if (status.baseline == 'low') {
		return BaselineImages.BASELINE_LOW;
	}
	if (status.baseline == 'high') {
		return BaselineImages.BASELINE_HIGH;
	}
	return BaselineImages.BASELINE_LIMITED;
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
	const feature = webFeatures.features[featureId];
	return feature && feature.kind === 'feature';
}


function sanitizeFeatureName(featureName) {
	if (featureName.startsWith('<')) {
		return featureName.replace('<', '&#x3C;');
	}
	return featureName;
}


function getFeatureMarkdown(feature) {
	return `### <img src="${getBaselineImg(feature.status)}" alt="Baseline icon" height="14" style="aspect-ratio: 25 / 14;" /> ${sanitizeFeatureName(feature.name)}

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


module.exports = {
	activate,
	deactivate,
	PATTERNS,
	extractFeatureId
}
