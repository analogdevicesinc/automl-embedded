/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import { spawn } from "node:child_process";
import { mkdirSync, writeFile } from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import { getWorkspaceDir, REPORT_NAME, REPORT_MD, KENNING_DIR, KChannel } from "../utils";
import { ConfigurationViewProvider } from "../configuration/viewProvider";
import { populateScenario, ScenarioTemplate } from "./autoMLScenarioTemplate";

const ANSI_FILTER_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

function prepareRunDir(runsDir: string) {
    const now = new Date();
    const now_y = now.getFullYear();
    const now_m = String(now.getMonth() + 1).padStart(2, '0');
    const now_d = String(now.getDate()).padStart(2, '0');
    const now_H = String(now.getHours()).padStart(2, '0');
    const now_M = String(now.getMinutes()).padStart(2, '0');
    const now_S = String(now.getSeconds()).padStart(2, '0');
    const runId = `run_${now_y}_${now_m}_${now_d}_${now_H}_${now_M}_${now_S}`;
    return path.join(runsDir, runId);
}

export function runScenario(configurationView: ConfigurationViewProvider, platform: string, optimizer: string, datasetPath: string, timeLimit: string, appSize: string | undefined, simulate: boolean, baseScenario: ScenarioTemplate) {
    KChannel.show();

    const pluginConfig = vscode.workspace.getConfiguration("kenning-edge-automl");

    const workspaceDir = getWorkspaceDir();
    if (workspaceDir === undefined) {
        KChannel.append("Open workspace before running Kenning");
        configurationView.enableRunButton();
        return;
    }

    const runsDir = path.join(".", KENNING_DIR);
    const runDir = prepareRunDir(runsDir);

    const runScenarioPath = path.join(runDir, "scenario.json");
    const runReportPath = path.join(runDir, REPORT_NAME, REPORT_MD);

    const scenario = populateScenario(
        baseScenario,
        runDir,
        pluginConfig,
        platform,
        optimizer,
        datasetPath,
        timeLimit,
        simulate,
        appSize,
    );

    const absRunDir = path.join(workspaceDir, runDir);
    mkdirSync(absRunDir, {recursive: true});

    writeFile(
        path.join(workspaceDir, runScenarioPath),
        JSON.stringify(scenario, null, 4),
        err => {
            if (err) {
                console.log(err);
            }
        },
    );

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Running Kenning scenario",
            cancellable: true,
        }, (_progress, token) => {

            const kenningProcess = spawn(
                "kenning",  [
                    "automl", "optimize", "test", "report",
                    "--report-path", runReportPath,
                    "--cfg", runScenarioPath,
                    "--verbosity", "INFO",
                    "--to-html",
                    "--save-summary",
                    "--allow-failures",
                    "--comparison-only",
                    "--skip-general-information",
                ],
                {
                    cwd: workspaceDir,
                },
            );

            token.onCancellationRequested(() => {
                kenningProcess.kill();
            });

            kenningProcess.stdout.on('data', (data: string) => {
                KChannel.append(data.toString().replace(ANSI_FILTER_REGEX, ""));
            });

            kenningProcess.stderr.on('data', (data: string) => {
                KChannel.append(data.toString().replace(ANSI_FILTER_REGEX, ""));
            });

            const kenningProcessEnd = new Promise<void>(resolve => {
                kenningProcess.on('exit', code => {
                    KChannel.appendLine('\nKenning process exited with code ' + code?.toString());
                    vscode.commands.executeCommand("edge-automl-extension.refreshReports");
                    configurationView.enableRunButton();
                    resolve();
                });

            });

            return kenningProcessEnd;
        },
    );
}
