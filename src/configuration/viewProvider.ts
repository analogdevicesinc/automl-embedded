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
    private kenningOptimizers?: Map<string, string[]>;
    private kenningSimulablePlatforms?: Map<string, boolean>;

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

    private _getState<T>(key: keyof WebviewState, defValue: T | undefined = undefined): T | undefined {
        if (defValue !== undefined) {
            return this._workspaceState.get<T>(key, defValue);
        }
        return this._workspaceState.get<T>(key);
    }

    private _updateState(key: keyof WebviewState, value: WebviewState[keyof WebviewState]) {
        if (key === "platform") {
            this._postMessage({
                type: "updateOptimizers",
                optimizers: (this.kenningOptimizers?.get(value as string) ?? []).map(
                    (v): [string, string] => [this._processOptimizerName(v), v],
                ),
            });
            const simulationAvailable = this._checkSimulationAvailability(value as string);
            this._postMessage({
                type: "toggleSimulate",
                enable: simulationAvailable,
            });
            this._workspaceState.update("simulationsAvailable", simulationAvailable);
        }
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
                    if (key !== "appSize" && (value === undefined || value === "")) {
                        undefinedFields.push(key);
                    }
                }
                if (undefinedFields.length > 0) {
                    vscode.window.showErrorMessage(`Missing data in configuration (${undefinedFields.join(', ')})`);
                    this.enableRunButton();
                    break;
                }
                if (!checkConfig(data)) {
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

                runScenario(this, data.platform!, data.optimizer!, data.datasetPath!, data.timeLimit!, data?.appSize, data.simulate!, baseScenario);
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
                        this._postMessage({type: "setField", elementName: IDS.datasetPath, value: fileUri[0].fsPath});
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
                        this._postMessage({type: "setField", elementName: IDS.targetPath, value: fileUri.fsPath});
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
                const value = this._getState<string>(data.storageName);
                if (value) {
                    this._postMessage({type: "setField", elementName: data.elementName, value});
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
        const platform = this._getState("platform", "MAX32690 Evaluation Kit");
        const optimizerOptions = (this.kenningOptimizers?.get(platform ?? "") ?? []).map((v): [string, string] => [this._processOptimizerName(v), v]);
        const state = {
            datasetPath: this._getState("datasetPath", ""),
            platform,
            optimizerOptions,
            optimizer: this._getState("optimizer", optimizerOptions[0]?.at(0) ?? ""),
            timeLimit: this._getState("timeLimit", "10"),
            appSize: this._getState("appSize", "0"),
            simulate: this._getState("simulate", true),
            targetModelPath: this._getState("targetModelPath", ""),
            enableButton: this._getState("enableButton", true),
            simulationsAvailable: this._getState("simulationsAvailable", false),
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

        const getPlatformsCmd = ["available-platforms", "--json"];
        const listPlatforms = spawnSync("kenning", getPlatformsCmd);

        const platforms: [string, string][] = [];
        const platformsOptimizers = new Map<string, string[]>();
        const simulablePlatforms = new Map<string, boolean>();
        const platformsDefs = JSON.parse(listPlatforms.stdout.toString()) as Map<string, any>;
        interface PlatformFields {default_platform: string, display_name: string, default_optimizer: string[], platform_resc_path?: string}
        for (const [platform, fields] of (Object.entries(platformsDefs)) as [string, PlatformFields][]) {
            if (fields.default_platform !== "ZephyrPlatform") {continue;}
            platforms.push([fields.display_name, platform]);
            platformsOptimizers.set(platform, fields.default_optimizer);
            simulablePlatforms.set(platform, fields.platform_resc_path !== undefined);
        }
        this.kenningPlatforms = platforms;
        this.kenningOptimizers = platformsOptimizers;
        this.kenningSimulablePlatforms = simulablePlatforms;
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
        this._updateState("enableButton", true);
    }

    private _checkSimulationAvailability(platform: string | undefined) {
        return this.kenningSimulablePlatforms?.get(platform ?? "") ?? false;
    }

    private _processOptimizerName(optimizer: string) {
        return optimizer.replace(/Compiler$/, '');
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        this.reloadBaseScenario();

        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "configuration", "resources", "main.js"));

        // Prepare platform options
        const platforms: [string, string][] = this.getPlatforms();
        const platformOptions: string[] = [];
        const platformState = this._getState("platform", "max32690evkit/max32690/m4");
        const optimizers: string[] = [];
        for (const platform of platforms) {
            platformOptions.push(
                `<option value="${platform[1]}" ${platform[1] === platformState ? 'selected' : ''}>${platform[0]}</option>`,
            );
            if (platform[1] === platformState) {
                optimizers.push(...(this.kenningOptimizers?.get(platform[1]) ?? []));
            }
        }
        // Prepare optimizer options
        const optimizerOptions: string[] = [];
        let optimizerState = this._getState<string>("optimizer");
        if (optimizerState && !optimizers.includes(optimizerState)) {
            optimizerState = optimizers.at(0);
        }
        optimizers.forEach((opt) => {
            optimizerOptions.push(
                `<option value="${opt}" ${opt === optimizerState ? 'selected' : ''}>${this._processOptimizerName(opt)}</option>`,
            );
        });
        // Prepare simulate checkbox
        const simulationAvailable = this._checkSimulationAvailability(platformState);
        let enableSimulation = this._getState("simulate", false) as boolean;
        if (!simulationAvailable && enableSimulation) {
            enableSimulation = false;
            this._updateState("simulate", false);
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
                    <label for="${IDS.optimizer}" class="${labelClasses}">Runtime</label>
                </div>
                <div class="${cssClasses['vscode-select']}">
                    <select id="${IDS.optimizer}" class="${cssClasses['kenning-configuration-optimizer']}">
                        ${optimizerOptions.join("\n")}
                    </select>
                </div>

                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.timeLimit}" class="${labelClasses}">Time limit for AutoML (in minutes)</label>
                </div>
                <input type="number" step="0.1" id="${IDS.timeLimit}" class="${numberInputClasses}" value="${this._getState('timeLimit', '10')}"/>
                </br>

                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.appSize}" class="${labelClasses}">Application size (in KB) (optional)</label>
                </div>
                <input type="number" step="0.1" id="${IDS.appSize}" class="${numberInputClasses}" value="${this._getState('appSize', '0')}"/>
                </br>

                <div class="${cssClasses['vscode-label']}">
                    <label for="${IDS.targetPath}" class="${labelClasses}">Selected model path</label>
                </div>
                <div class="${cssClasses['vscode-search']}">
                    <input id="${IDS.targetPath}" class="${inputClasses}" value="${this._getState('targetModelPath', '')}">
                    <button id="${IDS.targetPathButton}" class="${inputButtonClasses}"></button>
                </div>
                </br>

                <div class="${cssClasses['vscode-checkbox']} ${cssClasses['vscode-label']}">
                    <input type="checkbox" id="${IDS.simulate}" ${(enableSimulation) ? 'checked' : ''} ${(simulationAvailable) ? '': 'disabled'}/>
                    <label for="${IDS.simulate}">
                        <span class="${cssClasses.icon}">
                            <i class="${cssClasses['icon-checked']} ${cssClasses.codicon} ${cssClasses['codicon-check']}"></i>
                            <i class="${cssClasses['icon-indeterminate']} ${cssClasses.codicon} ${cssClasses['codicon-chrome-minimize']}"></i>
                        </span>
                        <span class="${cssClasses.text} ${labelClasses}">Evaluate models in simulation</span>
                    </label>
                </div>
                </br>
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
