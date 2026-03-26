import * as vscode from 'vscode';
import path from 'path';
import { findFeatureIdsInLine, getFeatureMarkdown } from './utils.js';
import { getFeature, FeatureOption } from './web-features.js';

export class BaselineHoverProvider implements vscode.HoverProvider {
	private context: vscode.ExtensionContext;
	private featureOptions: FeatureOption[];

	constructor(context: vscode.ExtensionContext, featureOptions: FeatureOption[]) {
		this.context = context;
		this.featureOptions = featureOptions;
	}

	provideHover(document: vscode.TextDocument, position: vscode.Position) {
		const matches = findFeatureIdsInLine(document, position.line);

		for (const match of matches) {
			const { featureId, startingIndex } = match;
			const endingIndex = startingIndex + featureId.length;

			if (position.character < startingIndex || position.character >= endingIndex) {
				continue;
			}

			const featureInfo = this.featureOptions.find(feature => feature.featureId == featureId);
			if (!featureInfo) {
				continue;
			}

			const markdownString = new vscode.MarkdownString();
			markdownString.supportHtml = true;
			markdownString.baseUri = vscode.Uri.file(path.join(this.context.extensionPath, path.sep));
			markdownString.appendMarkdown(getFeatureMarkdown(featureInfo));

			const range = new vscode.Range(
				position.line, startingIndex, position.line, endingIndex
			);
			return new vscode.Hover(markdownString, range);
		}
	}
}

export class BaselineCodeActionProvider implements vscode.CodeActionProvider {
	constructor() {
	}

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext) {
		const actions: vscode.CodeAction[] = [];
		for (const diagnostic of context.diagnostics) {
			const featureId = document.getText(diagnostic.range);
			const feature = getFeature(featureId);
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

export class BaselineDocumentLinkProvider implements vscode.DocumentLinkProvider {
	constructor() {
	}

	provideDocumentLinks(document: vscode.TextDocument) {
		const links: vscode.DocumentLink[] = [];
		for (let i = 0; i < document.lineCount; i++) {
			const matches = findFeatureIdsInLine(document, i);

			for (const match of matches) {
				const { featureId, startingIndex } = match;
				const feature = getFeature(featureId);
				if (!feature || feature.kind !== 'feature') {
					continue;
				}

				const range = new vscode.Range(i, startingIndex, i, startingIndex + featureId.length);
				const target = vscode.Uri.parse(`https://webstatus.dev/features/${featureId}/`);

				const link = new vscode.DocumentLink(range, target);
				link.tooltip = `View ${feature.name} on webstatus.dev`;
				links.push(link);
			}
		}
		return links;
	}
}
