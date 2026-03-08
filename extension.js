const vscode = require('vscode');
const path = require('path');

let diagnosticCollection;
let featureOptions = [];
let webFeatures = {};

let DECORATION_LIMITED;
let DECORATION_LOW;
let DECORATION_HIGH;
const BROWSER_NAME = {
	'chrome': 'Chrome',
	'chrome_android': 'Chrome Android',
	'edge': 'Edge',
	'safari': 'Safari',
	'safari_ios': 'Safari on iOS',
	'firefox': 'Firefox',
	'firefox_android': 'Firefox for Android'
};

const SUPPORTED_LANGUAGES = ['javascript', 'markdown', 'html', 'css', 'yaml'];

const BaselineImages = {
	BASELINE_LIMITED: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIiB2aWV3Qm94PSIwIDAgNTQwIDMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8c3R5bGU+CiAgICAuZ3JheS1zaGFwZSB7CiAgICAgIGZpbGw6ICNDNkM2QzY7IC8qIExpZ2h0IG1vZGUgKi8KICAgIH0KCiAgICBAbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7CiAgICAgIC5ncmF5LXNoYXBlIHsKICAgICAgICBmaWxsOiAjNTY1NjU2OyAvKiBEYXJrIG1vZGUgKi8KICAgICAgfQogICAgfQogIDwvc3R5bGU+CiAgPHBhdGggZD0iTTE1MCAwTDI0MCA5MEwyMTAgMTIwTDEyMCAzMEwxNTAgMFoiIGZpbGw9IiNGMDk0MDkiLz4KICA8cGF0aCBkPSJNNDIwIDMwTDU0MCAxNTBMNDIwIDI3MEwzOTAgMjQwTDQ4MCAxNTBMMzkwIDYwTDQyMCAzMFoiIGNsYXNzPSJncmF5LXNoYXBlIi8+CiAgPHBhdGggZD0iTTMzMCAxODBMMzAwIDIxMEwzOTAgMzAwTDQyMCAyNzBMMzMwIDE4MFoiIGZpbGw9IiNGMDk0MDkiLz4KICA8cGF0aCBkPSJNMTIwIDMwTDE1MCA2MEw2MCAxNTBMMTUwIDI0MEwxMjAgMjcwTDAgMTUwTDEyMCAzMFoiIGNsYXNzPSJncmF5LXNoYXBlIi8+CiAgPHBhdGggZD0iTTM5MCAwTDQyMCAzMEwxNTAgMzAwTDEyMCAyNzBMMzkwIDBaIiBmaWxsPSIjRjA5NDA5Ii8+Cjwvc3ZnPg==',
	BASELINE_LOW: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIiB2aWV3Qm94PSIwIDAgNTQwIDMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8c3R5bGU+CiAgICAuYmx1ZS1zaGFwZSB7CiAgICAgIGZpbGw6ICNBOEM3RkE7IC8qIExpZ2h0IG1vZGUgKi8KICAgIH0KCiAgICBAbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7CiAgICAgIC5ibHVlLXNoYXBlIHsKICAgICAgICBmaWxsOiAjMkQ1MDlFOyAvKiBEYXJrIG1vZGUgKi8KICAgICAgfQogICAgfQoKICAgIC5kYXJrZXItYmx1ZS1zaGFwZSB7CiAgICAgICAgZmlsbDogIzFCNkVGMzsKICAgIH0KCiAgICBAbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7CiAgICAgICAgLmRhcmtlci1ibHVlLXNoYXBlIHsKICAgICAgICAgICAgZmlsbDogIzQxODVGRjsKICAgICAgICB9CiAgICB9CgogIDwvc3R5bGU+CiAgPHBhdGggZD0iTTE1MCAwTDE4MCAzMEwxNTAgNjBMMTIwIDMwTDE1MCAwWiIgY2xhc3M9ImJsdWUtc2hhcGUiLz4KICA8cGF0aCBkPSJNMjEwIDYwTDI0MCA5MEwyMTAgMTIwTDE4MCA5MEwyMTAgNjBaIiBjbGFzcz0iYmx1ZS1zaGFwZSIvPgogIDxwYXRoIGQ9Ik00NTAgNjBMNDgwIDkwTDQ1MCAxMjBMNDIwIDkwTDQ1MCA2MFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTUxMCAxMjBMNTQwIDE1MEw1MTAgMTgwTDQ4MCAxNTBMNTEwIDEyMFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTQ1MCAxODBMNDgwIDIxMEw0NTAgMjQwTDQyMCAyMTBMNDUwIDE4MFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTM5MCAyNDBMNDIwIDI3MEwzOTAgMzAwTDM2MCAyNzBMMzkwIDI0MFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTMzMCAxODBMMzYwIDIxMEwzMzAgMjQwTDMwMCAyMTBMMzMwIDE4MFoiIGNsYXNzPSJibHVlLXNoYXBlIi8+CiAgPHBhdGggZD0iTTkwIDYwTDEyMCA5MEw5MCAxMjBMNjAgOTBMOTAgNjBaIiBjbGFzcz0iYmx1ZS1zaGFwZSIvPgogIDxwYXRoIGQ9Ik0zOTAgMEw0MjAgMzBMMTUwIDMwMEwwIDE1MEwzMCAxMjBMMTUwIDI0MEwzOTAgMFoiIGNsYXNzPSJkYXJrZXItYmx1ZS1zaGFwZSIvPgo8L3N2Zz4=',
	BASELINE_HIGH: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIiB2aWV3Qm94PSIwIDAgNTQwIDMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8c3R5bGU+CiAgICAuZ3JlZW4tc2hhcGUgewogICAgICBmaWxsOiAjQzRFRUQwOyAvKiBMaWdodCBtb2RlICovCiAgICB9CgogICAgQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykgewogICAgICAuZ3JlZW4tc2hhcGUgewogICAgICAgIGZpbGw6ICMxMjUyMjU7IC8qIERhcmsgbW9kZSAqLwogICAgICB9CiAgICB9CiAgPC9zdHlsZT4KICA8cGF0aCBkPSJNNDIwIDMwTDM5MCA2MEw0ODAgMTUwTDM5MCAyNDBMMzMwIDE4MEwzMDAgMjEwTDM5MCAzMDBMNTQwIDE1MEw0MjAgMzBaIiBjbGFzcz0iZ3JlZW4tc2hhcGUiLz4KICA8cGF0aCBkPSJNMTUwIDBMMzAgMTIwTDYwIDE1MEwxNTAgNjBMMjEwIDEyMEwyNDAgOTBMMTUwIDBaIiBjbGFzcz0iZ3JlZW4tc2hhcGUiLz4KICA8cGF0aCBkPSJNMzkwIDBMNDIwIDMwTDE1MCAzMDBMMCAxNTBMMzAgMTIwTDE1MCAyNDBMMzkwIDBaIiBmaWxsPSIjMUVBNDQ2Ii8+Cjwvc3ZnPg=='
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

function isInsideWebFeatureIds(document, lineIndex) {
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

function findFeatureIdsInLine(document, lineIndex) {
	const lineText = document.lineAt(lineIndex).text;
	const matches = [];

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

	DECORATION_LIMITED = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: vscode.Uri.parse(BaselineImages.BASELINE_LIMITED),
			margin: '0 0 0 4px',
			width: '1.44em',
			height: '0.8em'
		}
	});

	DECORATION_LOW = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: vscode.Uri.parse(BaselineImages.BASELINE_LOW),
			margin: '0 0 0 4px',
			width: '1.44em',
			height: '0.8em'
		}
	});

	DECORATION_HIGH = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: vscode.Uri.parse(BaselineImages.BASELINE_HIGH),
			margin: '0 0 0 4px',
			width: '1.44em',
			height: '0.8em'
		}
	});

	context.subscriptions.push(DECORATION_LIMITED, DECORATION_LOW, DECORATION_HIGH);

	context.subscriptions.push(
		vscode.commands.registerCommand('baseline-vscode.baselineSearch', runBaselineSearch)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, new BaselineHoverProvider(context))
	);
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(SUPPORTED_LANGUAGES, new BaselineCodeActionProvider(), {
			providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
		})
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentLinkProvider(SUPPORTED_LANGUAGES, new BaselineDocumentLinkProvider())
	);

	vscode.workspace.textDocuments.forEach(document => {
		validateBaselineFeatureIds(document);
	});

	vscode.window.onDidChangeVisibleTextEditors(editors => {
		editors.forEach(editor => validateBaselineFeatureIds(editor.document));
	}, null, context.subscriptions);

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
	if (!editor || event.document !== editor.document || editor.document.lineCount === 0 || !SUPPORTED_LANGUAGES.includes(event.document.languageId)) {
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
	if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
		return;
	}
	const issues = [];
	const limitedRanges = [];
	const lowRanges = [];
	const highRanges = [];

	for (let i = 0; i < document.lineCount; i++) {
		const matches = findFeatureIdsInLine(document, i);

		for (const match of matches) {
			const { featureId, startingIndex } = match;
			const range = new vscode.Range(i, startingIndex, i, startingIndex + featureId.length);

			if (isValidFeatureId(featureId)) {
				const feature = webFeatures.features[featureId];
				const status = feature.status?.baseline;

				if (status === 'low') {
					lowRanges.push(range);
				} else if (status === 'high') {
					highRanges.push(range);
				} else {
					limitedRanges.push(range);
				}
				continue;
			}

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

	const editors = vscode.window.visibleTextEditors.filter(e => e.document === document);
	editors.forEach(editor => {
		editor.setDecorations(DECORATION_LIMITED, limitedRanges);
		editor.setDecorations(DECORATION_LOW, lowRanges);
		editor.setDecorations(DECORATION_HIGH, highRanges);
	});
}


class BaselineHoverProvider {
	constructor(context) {
		this.context = context;
	}

	provideHover(document, position) {
		const matches = findFeatureIdsInLine(document, position.line);

		for (const match of matches) {
			const { featureId, startingIndex } = match;
			const endingIndex = startingIndex + featureId.length;

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


class BaselineDocumentLinkProvider {
	provideDocumentLinks(document) {
		const links = [];
		for (let i = 0; i < document.lineCount; i++) {
			const matches = findFeatureIdsInLine(document, i);

			for (const match of matches) {
				const { featureId, startingIndex } = match;
				if (!isValidFeatureId(featureId)) {
					continue;
				}

				const range = new vscode.Range(i, startingIndex, i, startingIndex + featureId.length);
				const target = vscode.Uri.parse(`https://webstatus.dev/features/${featureId}/`);

				const link = new vscode.DocumentLink(range, target);
				link.tooltip = `View ${featureId} on webstatus.dev`;
				links.push(link);
			}
		}
		return links;
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


module.exports = {
	activate,
	deactivate,
	PATTERNS,
	extractFeatureId
}
