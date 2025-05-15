/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import * as fs from "fs";
import * as path from "path";
import { spawnSync } from 'node:child_process';
import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { runScenario } from '../kenning/runScenario';
import { Memento } from '../utils';
import { DEFAULT_BASE_SCENARIO, ScenarioTemplate, validateScenario } from '../kenning/autoMLScenarioTemplate';
import { WebviewState, MessageTypeIn, MessageTypeOut, IDS } from './messageTypes';
import { checkConfig } from './checkConfig';
import cssContent from "./resources/main.module.scss?inline";
import cssClasses from "./resources/main.module.scss";


export class ConfigurationViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'kenning-edge-automl.configuration';

    private _view?: vscode.WebviewView;

    private readonly _extensionUri: vscode.Uri;
    private _workspaceState: Memento;

    private watchedScenarioPath?: string;
    private baseScenario?: ScenarioTemplate;
    private kenningPlatforms?: [string, string][];

    constructor(
        _extensionContext: vscode.ExtensionContext,
    ) {
        this._extensionUri = _extensionContext.extensionUri;
        this._workspaceState = _extensionContext.workspaceState;
    }

    private _postMessage(message: MessageTypeIn) {
        if (!this._view) {
            return;
        }
        this._view.webview.postMessage(message);
    }

    private _getState(key: keyof WebviewState, defValue: string | undefined = undefined) {
        return this._workspaceState.get(key, defValue);
    }

    private _updateState(key: keyof WebviewState, value: string) {
        return this._workspaceState.update(key, value);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                this._extensionUri,
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data: MessageTypeOut) => {
            switch (data.type) {
            case "runAutoML": {
                const undefinedFields: string[] = [];
                for (const [key, value] of Object.entries(data)) {
                    if (!value) {
                        undefinedFields.push(key);
                    }
                }
                if (undefinedFields.length > 0) {
                    vscode.window.showErrorMessage(`Missing data in configuration (${undefinedFields.join(', ')})`);
                    this.enableRunButton();
                    break;
                }
                if (!checkConfig()) {
                    this.enableRunButton();
                    break;
                }

                this.reloadBaseScenario();
                this.updatePlatforms();

                const baseScenario = this.baseScenario;
                if (baseScenario === undefined) {
                    this.enableRunButton();
                    break;
                }

                runScenario(this, data.platform!, data.datasetPath!, data.timeLimit!, data.appSize!, baseScenario);
                break;
            }
            case "browseDataset": {
                vscode.window.showOpenDialog({
                    openLabel: "Select dataset",
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        "Dataset CSV": ["csv"],
                    },
                }).then((fileUri) => {
                    if (fileUri?.[0]) {
                        this._postMessage({type: "setDatasetPath", value: fileUri[0].fsPath});
                        this._updateState("datasetPath", fileUri[0].fsPath);
                    }
                });
                break;
            }
            case "browseTargetModelPath": {
                vscode.window.showSaveDialog({
                    title: "Save selected models as",
                }).then(async (fileUri) => {
                    if (fileUri) {
                        const targetDir = path.dirname(fileUri.fsPath);
                        if (!fs.existsSync(targetDir)) {
                            await fs.promises.mkdir(targetDir, {recursive: true});
                        }
                        this._postMessage({type: "setTargetModelPath", value: fileUri.fsPath});
                        this._updateState('targetModelPath', fileUri.fsPath);
                    }
                });
                break;
            }
            case "updateField": {
                this._updateState(data.name, data.value);
                break;
            }
            case "getField": {
                const value = this._getState(data.storageName);
                if (value) {
                    this._postMessage({type: "getField", elementName: data.elementName, value});
                }
                break;
            }
            }
        });

        webviewView.onDidChangeVisibility(() => {
            this.restoreState();
        });

        this.reloadScenarioWatcher();
        vscode.workspace.onDidChangeConfiguration(data => {
            if (data.affectsConfiguration("kenning-edge-automl.kenningScenarioPath")) {
                this.reloadScenarioWatcher();
                this.reloadBaseScenario();
                this.updatePlatforms();
            }
        });
    }

    private reloadScenarioWatcher() {
        const scenarioPath = vscode.workspace.getConfiguration("kenning-edge-automl").get<string>("kenningScenarioPath");
        if (this.watchedScenarioPath !== undefined) {
            fs.unwatchFile(this.watchedScenarioPath);
        }

        if (scenarioPath === undefined) {
            return;
        }

        this.watchedScenarioPath = scenarioPath;

        fs.watchFile(scenarioPath, {interval: 500}, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                this.reloadBaseScenario();
                this.updatePlatforms();
            }
        });
    }

    private restoreState() {
        const state = {
            datasetPath: this._getState("datasetPath", ""),
            platform: this._getState("platform", "MAX32690 Evaluation Kit"),
            timeLimit: this._getState("timeLimit", "10"),
            appSize: this._getState("appSize", "80"),
            targetModelPath: this._getState("targetModelPath", ""),
        };

        if (this._view?.visible) {
            this._postMessage({
                type: "restoreState",
                ...state,
            });
        }
    }

    private loadYamlScenario(path: string) {
        let doc;

        try {
            doc = yaml.load(fs.readFileSync(path, 'utf8'));
        } catch (e) {
            console.log(`Couldn't load scenario ${e}`);
            return;
        }

        if (!validateScenario(doc)) {
            console.log("Invalid scenario");
            return;
        }

        return doc;
    }

    private reloadBaseScenario() {
        let scenario: ScenarioTemplate | undefined = DEFAULT_BASE_SCENARIO;

        const path = vscode.workspace.getConfiguration("kenning-edge-automl").get("kenningScenarioPath");

        if (typeof path !== 'string') {
            return;
        }

        if (path) {
            scenario = this.loadYamlScenario(path);
        }

        if (scenario && !path) {
            vscode.window.showInformationMessage(`Loaded the default scenario.`);
        } else if(scenario && path) {
            vscode.window.showInformationMessage(`Loaded the scenario from ${path}.`);
        } else {
            vscode.window.showErrorMessage(`Loading scenario '${path}' failed.`);
        }

        this.baseScenario = scenario;
    }

    private getKenningPlatforms(refresh=false): [string, string][] {
        if (!refresh) {
            const platforms = this.kenningPlatforms;
            if (platforms !== undefined) {
                return platforms;
            }
        }

        const getPlatformsCmd = ["-c", "import yaml; import json; import kenning.resources.platforms as platforms; from pathlib import Path; import inspect; fd = (Path(inspect.getfile(platforms)).parent / 'platforms.yml').open(); data = yaml.safe_load(fd); print(json.dumps(data)); fd.close()"];
        const listPlatforms = spawnSync("python3", getPlatformsCmd);

        const platforms: [string, string][] = [];
        const platformsDefs = JSON.parse(listPlatforms.stdout.toString()) as Map<string, any>;
        for (const [platform, fields] of (Object.entries(platformsDefs)) as [string, {default_platform: string, display_name: string}][]) {
            if (fields.default_platform !== "ZephyrPlatform") {continue;}
            platforms.push([fields.display_name, platform]);
        }
        this.kenningPlatforms = platforms;
        return platforms;
    }

    private getScenarioPlatforms(): [string, string][] {
        const scenario = this.baseScenario;
        if (scenario === undefined) {
            return [];
        }

        const name = scenario.platform.parameters.name;
        const displayName = scenario.platform.parameters.display_name;

        if (!name) {
            return [];
        }

        if (displayName === undefined) {
            return [[name, name]];
        }

        return [[displayName, name]];
    }

    private getPlatforms(refresh=false): [string, string][] {
        const platforms = [
            ...this.getScenarioPlatforms(),
            ...this.getKenningPlatforms(refresh),
        ];

        platforms.sort();
        return platforms;
    }

    private updatePlatforms(refresh=false) {
        const platforms = this.getPlatforms(refresh);
        this._postMessage({type: 'updatePlatforms', platforms: platforms});
    }

    public refreshConfiguration() {
        if (this._view) {
            this.updatePlatforms(true);
            this._postMessage({ type: 'updateConfiguration' });
        }
    }

    public enableRunButton() {
        this._postMessage({type: "enableButton"});
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        this.reloadBaseScenario();

        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "configuration", "resources", "main.js"));

        const platforms: [string, string][] = this.getPlatforms();
        const platformOptions: string[] = [];
        for (const platform of platforms) {
            platformOptions.push(
                `<option value="${platform[1]}" ${platform[1] === this._getState("platform", "MAX32690 Evaluation Kit") ? 'selected' : ''}>${platform[0]}</option>`,
            );
        }

        // Use a nonce to only allow a specific script to be run.
        const scriptNonce = getNonce();
        const stypeNonce = getNonce();

        // Predefine classes for fields and buttons
        const labelClasses = `${cssClasses.normal} ${cssClasses.pale}`;
        const inputClasses = `${cssClasses['vscode-textfield']} ${cssClasses['vscode-search-input']}`;
        const numberInputClasses = `${cssClasses['vscode-textfield']}`;
        const inputButtonClasses = `${cssClasses['vscode-button']} ${cssClasses['vscode-search-button']} ${cssClasses.codicon} ${cssClasses['codicon-folder']}`;

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                    Use a content security policy to only allow loading styles from our extension directory,
                    and only allow scripts that have a specific nonce.
                    (See the 'webview-sample' extension sample for img-src content security policy examples)
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src data:; style-src 'nonce-${stypeNonce}'; script-src 'nonce-${scriptNonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <style nonce="${stypeNonce}">${cssContent}</style>

                <title>Kenning AutoML Configuration</title>
            </head>
            <body>
                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.datasetPath}" class="${labelClasses}">Dataset path</label>
                </div>
                <div class="${cssClasses['vscode-search']} ${cssClasses['vscode-form-container']}">
                    <input id="${IDS.datasetPath}" class="${inputClasses}" value="${this._getState('datasetPath', '')}">
                    <button id="${IDS.datasetButton}" class="${inputButtonClasses}"></button>
                </div>

                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.platform}" class="${labelClasses}">Platform</label>
                </div>
                <div class="${cssClasses['vscode-select']}">
                    <select id="${IDS.platform}" class="${cssClasses['kenning-configuration-platform']}">
                        ${platformOptions.join("\n")}
                    </select>
                </div>

                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.timeLimit}" class="${labelClasses}">Time limit for AutoML (in minutes)</label>
                </div>
                <input type="number" step="0.1" id="${IDS.timeLimit}" class="${numberInputClasses}" value="${this._getState('timeLimit', '10')}"/>
                </br>

                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.appSize}" class="${labelClasses}">Application size (in KB)</label>
                </div>
                <input type="number" step="0.1" id="${IDS.appSize}" class="${numberInputClasses}" value="${this._getState('appSize', '80')}"/>
                </br>
                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.targetPath}" class="${labelClasses}">Selected model path</label>
                </div>
                <div class="${cssClasses['vscode-search']}">
                    <input id="${IDS.targetPath}" class="${inputClasses}" value="${this._getState('targetModelPath', '')}">
                    <button id="${IDS.targetPathButton}" class="${inputButtonClasses}"></button>
                </div>
                </br>

                <button id="${IDS.automlButton}" type="button" class="${cssClasses['vscode-button']} ${cssClasses.block}">Run AutoML Optimization</button>
                </br>

                <script nonce="${scriptNonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
