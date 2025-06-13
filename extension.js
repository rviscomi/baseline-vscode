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

	context.subscriptions.push(
		vscode.commands.registerCommand('baseline-vscode.scanBaselineTodos', () => scanBaselineTodos(context))
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
		// TODO: handle multiple matches per line
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
	const lineText = document.lineAt(position.line).text.substr(0, 100);
		// TODO: handle multiple matches per line
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

		const startingIndex = match.index + match[0].indexOf(featureId);
		if (position.character < startingIndex || position.character > startingIndex + featureId.length) {
			// The cursor is not positioned on the feature ID.
			return;
		}

		const markdownString = new vscode.MarkdownString();
		markdownString.supportHtml = true;
		markdownString.baseUri = vscode.Uri.file(path.join(this.context.extensionPath, 'img', path.sep));
		markdownString.appendMarkdown(getFeatureMarkdown(featureInfo));

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
${Object.keys(BROWSER_NAME).map((browser) => {
	const version = feature.status.support[browser];
	if (!version) {
		return `${getBrowserName(browser)} | 🅇`;
	}
	return `${getBrowserName(browser)} ${version} | ${getReleaseDate(browser, version)}`;
}).join('\n')}
`;
}

class BaselineTodoPanel {
	constructor(context) {
		this._panel = vscode.window.createWebviewPanel(
			'baselineTodos',
			'Baseline TODOs Report',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
			}
		);

		this._panel.onDidDispose(() => {
			this.dispose();
		});

		// Set up message listener for the webview panel
		this._panel.webview.onDidReceiveMessage(
			message => {
				if (message.type === 'todoClick') {
					this._handleTodoClick(message);
				}
			},
			null,
			context.subscriptions
		);

		this._panel.webview.html = this._getHtmlForWebview(context);
	}

	_handleTodoClick(message) {
		try {
			const uri = vscode.Uri.file(message.uri);
			
			vscode.workspace.openTextDocument(uri).then(doc => {
				vscode.window.showTextDocument(doc).then(editor => {
					const position = new vscode.Position(message.line - 1, 0);
					const range = new vscode.Range(position, position);
					editor.selection = new vscode.Selection(position, position);
					editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
				}, error => {
					console.error('Error showing document:', error);
				});
			}, error => {
				console.error('Error opening document:', error);
			});
		} catch (error) {
			console.error('Error handling todo click:', error);
		}
	}

	dispose() {
		this._panel.dispose();
	}

	_getHtmlForWebview(context) {
		const scriptPathOnDisk = vscode.Uri.joinPath(context.extensionUri, 'media', 'todo-panel.js');
		const scriptUri = this._panel.webview.asWebviewUri(scriptPathOnDisk);

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta name="color-scheme" content="light dark">
				<title>Baseline TODOs Report</title>
				<style>
					body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background-color: var(--vscode-editor-background); margin: 0; padding: 1em; }
					.todo-item { padding: 10px; border-bottom: 1px solid var(--vscode-editorWidget-border); cursor: pointer; }
					.todo-item:hover { background-color: var(--vscode-list-hoverBackground); }
					.feature-name { font-weight: bold; color: var(--vscode-textLink-foreground); }
					.file-info { color: var(--vscode-descriptionForeground); font-size: 0.9em; }
					.loading { text-align: center; padding: 20px; }
				</style>
			</head>
			<body>
				<div id="loading" class="loading">Loading TODOs...</div>
				<div id="todos"></div>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	updateTodos(todos) {
		const todosHtml = todos.map(todo => `
			<div class="todo-item" data-uri="${todo.uri}" data-line="${todo.line}">
				<div class="feature-name">${todo.featureName}</div>
				<div class="file-info">${todo.fileName}:${todo.line}</div>
			</div>`
		).join('');

		this._panel.webview.postMessage({
			type: 'updateTodos',
			content: todosHtml
		});
	}
}

async function scanBaselineTodos(context) {
	const panel = new BaselineTodoPanel(context);
	const todos = [];

	try {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('No workspace folder found');
			return;
		}

		// Single source of truth for allowed extensions
		const ALLOWED_EXTENSIONS = ['html', 'pug', 'css', 'scss', 'js', 'jsx', 'ts', 'tsx'];

		for (const folder of workspaceFolders) {
			// Read top-level .gitignore if it exists
			const gitignore = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder.uri, '.gitignore'))
				.then(data => data.toString().split('\n').filter(Boolean))
				.catch(() => []);

			const excludePattern = gitignore.length ? `{${gitignore.join(',')}}` : undefined;
			const files = await vscode.workspace.findFiles(
				new vscode.RelativePattern(folder, `**/*.{${ALLOWED_EXTENSIONS.join(',')}}`),
				excludePattern
			);

			for (const file of files) {
				const fileExt = path.extname(file.fsPath).toLowerCase().substring(1);
				
				// Double-check the extension matches our allowed list
				if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
					continue;
				}

				const content = await vscode.workspace.fs.readFile(file);
				const lines = content.toString().split('\n');

				for (let i = 0; i < lines.length; i++) {
					const match = lines[i].match(/TODO\(baseline\/([\w-]+)\)/);
					if (match) {
						const featureName = match[1];
						todos.push({
							featureName,
							fileName: path.basename(file.fsPath),
							uri: file.fsPath,
							line: i + 1
						});
					}
				}
			}
		}

		panel.updateTodos(todos);
	} catch (error) {
		vscode.window.showErrorMessage('Error scanning for TODOs: ' + error.message);
	}
}

module.exports = {
	activate,
	deactivate
}
