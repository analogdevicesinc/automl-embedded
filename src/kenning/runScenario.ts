import { spawn } from "child_process";
import * as vscode from 'vscode';
import { existsSync, mkdirSync, writeFile } from "fs";
import { AUTOML_SCENARIO_TEMPLATE } from "./autoMLScenarioTemplate";
import { getWorkspaceDir, REPORT_NAME, REPORT_MD, KChannel } from "../utils";
import { ConfigurationViewProvider } from "../configuration/viewProvider";

const ANSI_FILTER_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export function runScenario(configurationView: ConfigurationViewProvider, platform: string, datasetPath: string, timeLimit: string, appSize: string) {
    KChannel.show();
    KChannel.appendLine(`AppSize: ${appSize} (${typeof appSize})`); // TODO: support app size

    const pluginConfig = vscode.workspace.getConfiguration("kenning-edge-automl");

    const now = new Date();
    const now_y = now.getFullYear();
    const now_m = String(now.getMonth() + 1).padStart(2, '0');
    const now_d = String(now.getDate()).padStart(2, '0');
    const now_H = String(now.getHours()).padStart(2, '0');
    const now_M = String(now.getMinutes()).padStart(2, '0');
    const now_S = String(now.getSeconds()).padStart(2, '0');
    const runId = `run_${now_y}_${now_m}_${now_d}_${now_H}_${now_M}_${now_S}`;
    const runsDir = getWorkspaceDir();
    if (runsDir === undefined) {
        KChannel.append("Open workspace before running Kenning");
        return;
    }
    const runDir = `${runsDir}/${runId}`;
    const runScenarioPath = `${runDir}/scenario.json`;
    const runReportPath = `${runDir}/${REPORT_NAME}/${REPORT_MD}`;
    const runZephyrOutputPath = `${runDir}/zephyr/`;

    let scenario = AUTOML_SCENARIO_TEMPLATE;

    scenario.platform.type = "ZephyrPlatform";
    // Local platform does not have name parameter
    scenario.platform.parameters = { name: platform };
    scenario.runtime_builder.parameters.output_path = runZephyrOutputPath;
    scenario.runtime_builder.parameters.workspace = pluginConfig.get("kenningZephyrRuntimePath") ?? scenario.runtime_builder.parameters.workspace;
    scenario.dataset.parameters.csv_file = datasetPath;
    scenario.dataset.parameters.dataset_root = `${runDir}/dataset/`;
    scenario.optimizers[0].parameters.compiled_model_path = `${runDir}/vae.tflite`;
    scenario.automl.parameters.output_directory = runDir;
    scenario.automl.parameters.time_limit = Number.parseFloat(timeLimit);

    if (!existsSync(runsDir)) {
        mkdirSync(runsDir);
    }
    mkdirSync(runDir);

    writeFile(
        runScenarioPath, JSON.stringify(scenario, null, 4),
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

            var kenningProcess = spawn(
                "python3",  [
                    "-m", "kenning", "automl", "optimize", "test", "report",
                    "--report-path", runReportPath,
                    "--cfg", runScenarioPath,
                    "--verbosity", "DEBUG",
                    "--to-html",
                    "--save-summary",
                    "--allow-failures",
                ],
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
        }
    );
}
