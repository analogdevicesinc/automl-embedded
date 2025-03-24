// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ReportsTreeDataProvider, ReportData, ModelData } from './kenning/reportsTreeView';
import { openReport, openConfiguration, chooseModel } from './kenning/openResults'; 
import { ConfigurationViewProvider } from './configuration/viewProvider';
import { Memento } from './utils';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "edge-automl-extension" is now active!');

	// Register provider for a tree view with reports
	const reportTreeViewProvider = new ReportsTreeDataProvider();
	vscode.window.registerTreeDataProvider(
		"kenning-edge-automl.reports",
		reportTreeViewProvider,
	);

	// Register custom commands
	const openReportCmd = vscode.commands.registerCommand(
		"edge-automl-extension.openReport",
		(report: ReportData) => openReport(report),
	);
	context.subscriptions.push(openReportCmd);

	const refreshReportCmd = vscode.commands.registerCommand(
		"edge-automl-extension.refreshReports",
		() => reportTreeViewProvider.refresh(),
	);
	context.subscriptions.push(refreshReportCmd);

	const openConfCmd = vscode.commands.registerCommand(
		"edge-automl-extension.openConfiguration",
		(model: ModelData) => openConfiguration(model),
	);
	context.subscriptions.push(openConfCmd);

        const configurationProvider = new ConfigurationViewProvider(context);
        const workspaceState: Memento = context.workspaceState;
	const chooseModelCmd = vscode.commands.registerCommand(
		"edge-automl-extension.chooseModel",
		(model: ModelData) => chooseModel(model, workspaceState, configurationProvider),
	);
	context.subscriptions.push(chooseModelCmd);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ConfigurationViewProvider.viewType, configurationProvider));

  context.subscriptions.push(vscode.commands.registerCommand('edge-automl-extension.refresh', () => {
    configurationProvider.refreshConfiguration();
  }));
}

// This method is called when your extension is deactivated
export function deactivate() { }
