const vscode = require('vscode');

let featureOptions = [];

async function loadWebFeatures() {
	try {
		return await import('web-features');
	} catch (error) {
		console.error('Error importing web-features:', error);
	}
}

function getBaselineStatus(status) {
	if (status.baseline == 'low') {
		return `Newly available since ${status.baseline_low_date}`;
	}
	if (status.baseline == 'high') {
		return `Widely available since ${status.baseline_high_date}`;
	}
	return 'Limited availability';
}

async function activate(context) {

	const webFeatures = await loadWebFeatures();
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
		vscode.languages.registerHoverProvider({ pattern: '**' }, new BaselineHoverProvider())
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
	provideHover(document, position, token) {
    const lineText = document.lineAt(position.line).text;
    const match = lineText.match(/\bbaseline\/([a-z-]+)\b/);
		if (!match) {
			return;
		}

		const featureId = match[1];
		const featureInfo = featureOptions.find(feature => feature.featureId == featureId);
		if (!featureInfo) {
			console.warn('Unable to get Baseline info for feature:', featureId);
			return;
		}

		const range = new vscode.Range(
			position.line, match.index, position.line, match.index + match[0].length
		);
		const markdownString = new vscode.MarkdownString();
		markdownString.appendMarkdown(`**${featureId}**

${featureInfo.detail}

${featureInfo.baselineStatus}`);
		return new vscode.Hover(markdownString, range);
	}
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
