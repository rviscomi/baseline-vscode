const vscode = require('vscode');

async function loadWebFeatures() {
  try {
    return await import('web-features');
  } catch (error) {
    console.error('Error importing web-features:', error);
  }
}

async function activate(context) {

	const webFeatures = await loadWebFeatures();
	console.log(webFeatures);
	const featureOptions = Object.entries(webFeatures.features).map(([featureId, feature]) => {
		return Object.assign(feature, {
			featureId,
			label: feature.name,
			detail: feature.description,
			description: featureId
		});
	});

	const disposable = vscode.commands.registerCommand('baseline-vscode.baselineSearch', async function () {
		const feature = await vscode.window.showQuickPick(featureOptions, {
			matchOnDetail: true,
			placeHolder: 'Search for a web feature',
			title: 'Baseline search'
		});

		if (!feature) {
			return;
		}

		console.log(feature);
		vscode.env.openExternal(vscode.Uri.parse(`https://webstatus.dev/features/${feature.featureId}/`));
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
