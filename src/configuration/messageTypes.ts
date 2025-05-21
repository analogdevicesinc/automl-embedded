/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


// Defines IDs for HTML elements
export const IDS = {
    automlButton: "run-automl-button",
    datasetPath: "kenning-configuration-dataset-path",
    datasetButton: "kenning-configuration-dataset-path-browse",
    platform: "kenning-configuration-platform",
    timeLimit: "kenning-configuration-time-limit",
    appSize: "kenning-configuration-app-size",
    targetPath: "kenning-configuration-target-model-path",
    targetPathButton: "kenning-configuration-target-model-path-browse",
    optimizer: "kenning-configuration-optimizer",
    simulate: "kenning-configuration-simulate",
} as const;
// Type containing values of ids
export type WebviewIds = typeof IDS[keyof typeof IDS];

// Defines the webview state type
export interface RunAutoMLState {
  datasetPath?: string,
  platform?: string,
  optimizer?: string,
  timeLimit?: string,
  appSize?: string,
  simulate?: boolean,
}
export type WebviewState = RunAutoMLState & {
    targetModelPath?: string,
    enableButton?: boolean,
    simulationsAvailable?: boolean,
    optimizerOptions?: [string, string][],
};

// Defines message types send to webview
interface UpdateConfMsg {
    type: "updateConfiguration",
}
type RestoreStateMsg = {
    type: "restoreState",
} & WebviewState;
interface EnableButtonMsg {
    type: "enableButton",
}
export type WebviewStringFields = typeof IDS["datasetPath" | "timeLimit" | "targetPath"];
interface SetFieldMsg {
    type: "setField",
    elementName: WebviewStringFields,
    value: string,
}
interface UpdatePlatformsMsg {
    type: "updatePlatforms",
    platforms: [string, string][],
}
interface UpdateOptimizersMsg {
    type: "updateOptimizers",
    optimizers: [string, string][],
}
interface ToggleSimulateMsg {
    type: "toggleSimulate",
    enable: boolean,
}
export type MessageTypeIn =
    | UpdateConfMsg
    | RestoreStateMsg
    | EnableButtonMsg
    | SetFieldMsg
    | UpdatePlatformsMsg
    | UpdateOptimizersMsg
    | ToggleSimulateMsg;

// Defines message types send from webview
interface BrowseDatasetMsg {
    type: "browseDataset",
}
interface BrowseTargetMsg {
    type: "browseTargetModelPath",
}
interface UpdateFieldMsg {
    type: "updateField",
    name: keyof WebviewState,
    value: WebviewState[keyof WebviewState],
}
export type GettableStorageName = keyof Omit<WebviewState, "optimizerOptions" | "enableButton">;
// Sends request to VSCode which responds with setField message
interface GetFieldMsg {
    type: "getField",
    elementName: WebviewStringFields,
    storageName: GettableStorageName,
}
type RunAutoMLMsg = {
    type: "runAutoML",
} & RunAutoMLState;
export type MessageTypeOut =
    | BrowseDatasetMsg
    | BrowseTargetMsg
    | UpdateFieldMsg
    | GetFieldMsg
    | RunAutoMLMsg;

