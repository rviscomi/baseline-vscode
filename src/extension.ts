import * as vscode from 'vscode';
import { getFeature, getAllFeatures, isValidFeatureId, FeatureOption, FeatureData } from './web-features.js';
import {
	PATTERNS,
	SUPPORTED_LANGUAGES
} from './constants.js';
import {
	findFeatureIdsInLine,
	getBaselineStatus
} from './utils.js';
import {
	BaselineHoverProvider,
	BaselineCodeActionProvider,
	BaselineDocumentLinkProvider
} from './providers.js';

let diagnosticCollection: vscode.DiagnosticCollection;
let featureOptions: FeatureOption[] = [];

let DECORATION_LIMITED: vscode.TextEditorDecorationType;
let DECORATION_NEWLY: vscode.TextEditorDecorationType;
let DECORATION_WIDELY: vscode.TextEditorDecorationType;

export async function activate(context: vscode.ExtensionContext) {
	featureOptions = Object.entries(getAllFeatures())
		.filter((entry): entry is [string, FeatureData] => entry[1].kind === 'feature')
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
			contentIconPath: vscode.Uri.file(context.asAbsolutePath('img/baseline-limited-icon.svg')),
			margin: '0 0 0 4px',
			width: '1.44em',
			height: '0.8em'
		}
	});

	DECORATION_NEWLY = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: vscode.Uri.file(context.asAbsolutePath('img/baseline-newly-icon.svg')),
			margin: '0 0 0 4px',
			width: '1.44em',
			height: '0.8em'
		}
	});

	DECORATION_WIDELY = vscode.window.createTextEditorDecorationType({
		after: {
			contentIconPath: vscode.Uri.file(context.asAbsolutePath('img/baseline-widely-icon.svg')),
			margin: '0 0 0 4px',
			width: '1.44em',
			height: '0.8em'
		}
	});

	context.subscriptions.push(DECORATION_LIMITED, DECORATION_NEWLY, DECORATION_WIDELY);

	context.subscriptions.push(
		vscode.commands.registerCommand('baseline-vscode.baselineSearch', runBaselineSearch)
	);
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, new BaselineHoverProvider(context, featureOptions))
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


export function deactivate() { }


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
	const { baseline, baseline_low_date: baselineNewlyDate } = status || {};

	const message = (baseline === 'low' || baseline === 'high') && baselineNewlyDate
		? `${featureName} is ${baseline === 'high' ? 'Widely available' : 'Newly available'}. It's been Baseline since ${baselineNewlyDate}.`
		: `${featureName} is not supported across all major browsers.`;

	const selection = await vscode.window.showInformationMessage(message, 'Explore');
	if (!selection) {
		return;
	}
	if (selection === 'Explore') {
		vscode.env.openExternal(vscode.Uri.parse(`https://webstatus.dev/features/${feature.featureId}/`));
	}
}


async function handleBaselineHotPhrase(event: vscode.TextDocumentChangeEvent) {
	if (!SUPPORTED_LANGUAGES.includes(event.document.languageId)) {
		return;
	}

	const editor = vscode.window.activeTextEditor;
	if (!editor || event.document !== editor.document || editor.document.lineCount === 0) {
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


function validateBaselineFeatureIds(document: vscode.TextDocument) {
	if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
		return;
	}

	const issues: vscode.Diagnostic[] = [];
	const limitedRanges: vscode.Range[] = [];
	const newlyRanges: vscode.Range[] = [];
	const widelyRanges: vscode.Range[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const matches = findFeatureIdsInLine(document, i);

		for (const match of matches) {
			const { featureId, startingIndex } = match;
			const range = new vscode.Range(i, startingIndex, i, startingIndex + featureId.length);

			if (isValidFeatureId(featureId)) {
				const feature = getFeature(featureId);
				const status = feature.status?.baseline;

				if (status === 'low') {
					newlyRanges.push(range);
				} else if (status === 'high') {
					widelyRanges.push(range);
				} else {
					limitedRanges.push(range);
				}
				continue;
			}

			let errorMessage = `Unrecognized Baseline feature ID: ${featureId}\n\nTry using the "Baseline search" command to find the feature you're looking for.`;
			const feature = getFeature(featureId);
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
		editor.setDecorations(DECORATION_NEWLY, newlyRanges);
		editor.setDecorations(DECORATION_WIDELY, widelyRanges);
	});
}

