import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from 'child_process';
import { runScenario } from '../kenning/runScenario';

export class ConfigurationViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'kenning-edge-automl.configuration';

    private _view?: vscode.WebviewView;

    private readonly _extensionUri: vscode.Uri;
    private _workspaceState: vscode.Memento;

    constructor(
        _extensionContext: vscode.ExtensionContext,
    ) {
        this._extensionUri = _extensionContext.extensionUri;
        this._workspaceState = _extensionContext.workspaceState;
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
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            console.log(`Received ${JSON.stringify(data)}`);
            switch (data.type) {
                case 'runAutoML': {
                    const undefinedFields: string[] = [];
                    for (const field of ["platform", "datasetPath", "timeLimit", "appSize"]) {
                        if (!data[field]) {
                            undefinedFields.push(field);
                        }
                    }
                    if (undefinedFields.length > 0) {
                        vscode.window.showErrorMessage(`Missing data in configuration (${undefinedFields.join(', ')})`);
                        this.enableRunButton();
                        break;
                    }
                    runScenario(this, data.platform, data.datasetPath, data.timeLimit, data.appSize);
                    break;
                }
                case 'browseDataset': {
                    vscode.window.showOpenDialog({
                        openLabel: "Select dataset",
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: {
                          "Dataset CSV": ["csv"],
                        },
                    }).then((fileUri) => {
                        if (fileUri && fileUri[0]) {
                            if (this._view) {
                                this._view.webview.postMessage({type: "setDatasetPath", value: fileUri[0].fsPath});
                            }
                            this._workspaceState.update('datasetpath', fileUri[0].fsPath);
                        }
                    });
                    break;
                }
                case 'browseTargetModelPath': {
                    vscode.window.showSaveDialog({
                        title: "Save selected models as",
                    }).then(async (fileUri) => {
                        if (fileUri) {
                            const targetDir = path.dirname(fileUri.fsPath);
                            if (!fs.existsSync(targetDir)) {
                                await fs.promises.mkdir(targetDir, {recursive: true});
                            }
                            if (this._view) {
                                this._view.webview.postMessage({type: "setTargetModelPath", value: fileUri.fsPath});
                            }
                            this._workspaceState.update('targetmodelpath', fileUri.fsPath);
                        }
                    });
                    break;
                }
                case 'updateField': {
                    this._workspaceState.update(data.name, data.value);
                    break;
                }
                case 'getField': {
                    if (this._view){
                        this._view.webview.postMessage({type: "getField", elementName: data.elementName, value: this._workspaceState.get(data.storageName)});
                    }
                    break;
                }
            }
        });

        webviewView.onDidChangeVisibility(() => {
            if (this._view && this._view.visible) {
                this._view.webview.postMessage({
                    type: "restoreState",
                    dataset: this._workspaceState.get('datasetpath', ''),
                    platform: this._workspaceState.get("platform", "MAX32690 Evaluation Kit"),
                    timeLimit: this._workspaceState.get('timelimit', '10'),
                    appSize: this._workspaceState.get('appsize', '74'),
                    targetModelPath: this._workspaceState.get('targetmodelpath', ''),
                });
            }
        });
    }

    private getKenningPlatforms(): [string, string][] {
        const getPlatformsCmd = ["-c", "import yaml; import json; import kenning.resources.platforms as platforms; from pathlib import Path; import inspect; fd = (Path(inspect.getfile(platforms)).parent / 'platforms.yml').open(); data = yaml.safe_load(fd); print(json.dumps(data)); fd.close()"];
        const listPlatforms = spawnSync("python3", getPlatformsCmd);

        console.log(`Kenning stdout: ${listPlatforms.stdout.toString()}`);
        console.log(`Kenning stderr: ${listPlatforms.stderr.toString()}`);
        const platforms: [string, string][] = [];
        const platformsDefs: Map<string, any> = JSON.parse(listPlatforms.stdout.toString());
        console.log(platformsDefs);
        for (const [platform, fields] of Object.entries(platformsDefs)) {
            if (fields.default_platform !== "ZephyrPlatform") {continue;}
            platforms.push([fields.display_name, platform]);
        }
        platforms.sort();
        return platforms;
    }

    public refreshConfiguration() {
        console.log("refresh config");
        if (this._view) {
            // Get platforms from Kenning
            const platforms = this.getKenningPlatforms();
            this._view.webview.postMessage({ type: 'updateConfiguration', platforms: platforms });
            console.log(`sent message to webview ${platforms}`);
        }
    }

    public enableRunButton() {
        if (this._view) {
            this._view.webview.postMessage({type: "enableButton"});
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'configuration', 'main.js'));

        // Do the same for the stylesheet.
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'configuration', 'main.css'));

        const elementsComponentsUri = vscode.Uri.joinPath(this._extensionUri, "resources", "elements-lite");
        const codiconsComponentsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "resources", "codicons", "codicon.css"));
        const includeElementsClasses: string[] = [];
        for (const cssClass of ["button", "textfield", "select", "label"]) {
            const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(elementsComponentsUri, cssClass, `${cssClass}.css`));
            includeElementsClasses.push(`<link href="${cssUri}" rel="stylesheet">`);
        };

        includeElementsClasses.push(`<link href="${codiconsComponentsUri}" rel="stylesheet">`);

        const platforms: [string, string][] = this.getKenningPlatforms();
        const platformOptions: string[] = [];
        for (const platform of platforms) {
            platformOptions.push(
                `<option value="${platform[1]}" ${platform[1] === this._workspaceState.get("platform", "MAX32690 Evaluation Kit") ? 'selected' : ''}>${platform[0]}</option>`
            );
        }

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                    Use a content security policy to only allow loading styles from our extension directory,
                    and only allow scripts that have a specific nonce.
                    (See the 'webview-sample' extension sample for img-src content security policy examples)
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                ${includeElementsClasses.join("\n")}
                <link href="${styleMainUri}" rel="stylesheet">

                <title>Kenning AutoML Configuration</title>
            </head>
            <body>
                <div class="vscode-label">
                    <label for="kenning-configuration-dataset-path" class="normal pale">Dataset path</label>
                </div>
                <div class="vscode-search vscode-form-container">
                    <input id="kenning-configuration-dataset-path" class="vscode-textfield vscode-search-input kenning-configuration-dataset-path" value="${this._workspaceState.get('datasetpath', '')}">
                    <button id="kenning-configuration-dataset-path-browse" class="vscode-button vscode-search-button codicon codicon-folder"/>
                </div>

                <div class="vscode-label">
                    <label for="kenning-configuration-platform" class="normal pale">Platform</label>
                </div>
                <div class="vscode-select">
                    <select id="kenning-configuration-platform" class="kenning-configuration-platform">
                        ${platformOptions.join("\n")}
                    </select>
                </div>

                <div class="vscode-label">
                    <label for="kenning-configuration-time-limit" class="normal pale">Time limit for AutoML (in minutes)</label>
                </div>
                <input type="number" step="0.1" id="kenning-configuration-time-limit" class="vscode-textfield kenning-configuration-time-limit" value="${this._workspaceState.get('timelimit', '10')}"/>
                </br>

                <div class="vscode-label">
                    <label for="kenning-configuration-app-size" class="normal pale">Application size (in KB)</label>
                </div>
                <input type="number" step="0.1" id="kenning-configuration-app-size" class="vscode-textfield kenning-configuration-time-limit" value="${this._workspaceState.get('appsize', '74')}"/>
                </br>
                <div class="vscode-label">
                    <label for="kenning-configuration-app-size" class="normal pale">Selected model path</label>
                </div>
                <div class="vscode-search">
                    <input id="kenning-configuration-target-model-path" class="vscode-textfield vscode-search-input kenning-configuration-target-model-path" value="${this._workspaceState.get('targetmodelpath', '')}">
                    <button id="kenning-configuration-target-model-path-browse" class="vscode-button vscode-search-button codicon codicon-folder"></button>
                </div>
                </br>

                <button id="run-automl-button" type="button" class="vscode-button block">Run AutoML Optimization</button>
                </br>

                <script nonce="${nonce}" src="${scriptUri}"></script>
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
