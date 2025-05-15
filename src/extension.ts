/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


/*
 * The module 'vscode' contains the VS Code extensibility API
 * Import the module and reference it with the alias vscode in your code below
 */
import * as vscode from 'vscode';

import { ReportsTreeDataProvider, ReportData, ModelData } from './kenning/reportsTreeView';
import { openReport, openConfiguration, chooseModel } from './kenning/openResults';
import { ConfigurationViewProvider } from './configuration/viewProvider';
import { Memento } from './utils';

/*
 * Function called on extension activation.
 */
export function activate(context: vscode.ExtensionContext) {
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
