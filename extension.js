const vscode = require('vscode');

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
	const featureOptions = Object.entries(webFeatures.features).map(([featureId, feature]) => {
		return Object.assign(feature, {
			featureId,
			label: feature.name,
			detail: feature.description,
			description: featureId,
			baselineStatus: getBaselineStatus(feature.status)
		});
	});

	const disposable = vscode.commands.registerCommand('baseline-vscode.baselineSearch', () => runBaselineSearch(featureOptions));
	context.subscriptions.push(disposable);
}

async function runBaselineSearch(featureOptions) {
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

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
