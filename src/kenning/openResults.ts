/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import * as path from "path";
import * as fs from "fs";
import * as vscode from 'vscode';
import * as yaml from "js-yaml";

import { ConfigurationViewProvider } from '../configuration/viewProvider';
import { getWorkspaceDir, getKenningWorkspaceDir, validatePath, REPORT_NAME, REPORT_HTML, KChannel, Memento } from '../utils';
import { ReportData, ModelData } from './reportsTreeView';


const styleOverrides = `
<style>
.md-header {
    visibility: hidden;
}
@media screen {
    [data-md-color-scheme=slate] {
        --md-default-bg-color: var(--vscode-editor-background);
    }
}
.bk-root {
    background: var(--vscode-editor-background);
}
.md-footer {
    visibility: hidden;
}
</style>
`;


function replaceLinks(
    report: ReportData,
    panel: vscode.WebviewPanel,
    _match: string,
    p1: string, _p2: string, p3: string,
): string {
    return `${p1}${panel.webview.asWebviewUri(vscode.Uri.file(path.join(report.reportDirectory, "report", p3)))}"`;
}

export function openReport(report: ReportData) {
    const workspaceDir = getKenningWorkspaceDir();
    if (workspaceDir === undefined) {return;}
    const reportHtml = path.join(report.reportDirectory, REPORT_NAME, REPORT_HTML);
    if (!fs.existsSync(reportHtml)) {return;}

    const panel = vscode.window.createWebviewPanel(
        `$kenning_view_${report.label}`,
        `View ${report.label}`,
        vscode.ViewColumn.One,
        {
            // Enable access for additional CSS and JS files
            localResourceRoots: [vscode.Uri.file(path.join(report.reportDirectory, REPORT_NAME, "_static"))],
            // Enabling scripts required for Bokeh plots
            enableScripts: true,
        },
    );
    vscode.workspace.openTextDocument(reportHtml).then((file) => {
        let htmlFile = file.getText();
        // Adjust links to local files
        htmlFile = htmlFile.replaceAll(
            /((href|src)=")(_static[^"]+)"/g,
            (m: string, p1: string, p2: string, p3: string) => replaceLinks(report, panel, m, p1, p2, p3),
        );
        htmlFile = htmlFile + "\n\n" + styleOverrides;
        panel.webview.html = htmlFile;
    });

}


export function openConfiguration(model: ModelData) {
    const scenarioPath = validatePath(model.data.scenarioPath);
    if (!scenarioPath || !fs.existsSync(scenarioPath)) {
        KChannel.appendLine(`Scenario not found`);
        return;
    }
    vscode.workspace.openTextDocument(vscode.Uri.file(scenarioPath)).then(
        doc => vscode.window.showTextDocument(doc),
    );
}


export async function chooseModel(model: ModelData, workspaceState: Memento | null, configurationProvider: ConfigurationViewProvider | null) {
    const scenarioPath = validatePath(model.data.scenarioPath);
    if (!scenarioPath || !fs.existsSync(scenarioPath)) {
        KChannel.appendLine(`Scenario not found`);
        return;
    }

    interface Scenario {
        optimizers: {
            parameters?: {
                compiled_model_path: string
            }
        }[],
        model_wrapper: {
            parameters?: {
                model_path: string
            }
        }

    }

    const extension = path.extname(scenarioPath);
    let scenario;
    if (extension === ".yml" || extension === ".yaml" || extension === ".json") {
        scenario = yaml.load(await fs.promises.readFile(scenarioPath, "utf8")) as Scenario;
    } else {
        KChannel.appendLine(`Unsupported format of a scenario`);
        return;
    }

    const optimizer = scenario.optimizers?.at(-1);
    if (optimizer === undefined) {
        return;
    }

    let modelPath: string | undefined = optimizer.parameters?.compiled_model_path;
    if (modelPath === undefined) {
        KChannel.appendLine("Scenario does not contain compiled model path, using unoptimized model");
        modelPath = scenario.model_wrapper?.parameters?.model_path;
        if (modelPath === undefined) {
            KChannel.appendLine("Scenario does not contain path to the model");
            return;
        }
    }
    modelPath = validatePath(modelPath);
    if (modelPath === undefined) {
        KChannel.appendLine("Cannot find model path");
        return;
    }

    let targetPath: string | undefined = workspaceState?.get("targetModelPath", undefined);
    if (targetPath === undefined || targetPath === "") {
        const uri = await vscode.window.showSaveDialog({
            title: "Save selected model as",
        });
        if (uri !== undefined) {
            targetPath = uri.fsPath;
            if (workspaceState) {
                await workspaceState.update('targetModelPath', targetPath);
                if (configurationProvider) {
                    configurationProvider.refreshConfiguration();
                }
            }
        }
    }

    if (targetPath) {
        if (!path.isAbsolute(targetPath)) {
            const workspaceDir = getWorkspaceDir();
            if (workspaceDir === undefined){
                vscode.window.showErrorMessage(`Cannot save model using relative path if no workspace is opened`);
                return;
            }
            targetPath = path.join(workspaceDir, targetPath);
        }
        if (fs.existsSync(targetPath)) {
            const stats = await fs.promises.lstat(targetPath);
            if (stats.isDirectory()) {
                vscode.window.showErrorMessage(`Chosen destination (${targetPath}) is a directory, model will not be saved`);
                return;
            }
        }
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            try {
                await fs.promises.mkdir(targetDir, {recursive: true});
            } catch (ex) {
                vscode.window.showErrorMessage(`Cannot create directory (${targetDir}) for a model`);
                KChannel.appendLine(`Error when creating directory for a model - ${ex}`);
                return;
            }
        }
        fs.copyFileSync(modelPath, targetPath);
        fs.copyFileSync(`${modelPath}.json`, `${targetPath}.json`);
        KChannel.appendLine(`Model saved to ${targetPath}`);
        vscode.window.showInformationMessage(`Model is saved to ${targetPath}`);
    }
}
