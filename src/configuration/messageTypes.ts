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
} as const;
// Type containing values of ids
export type WebviewIds = typeof IDS[keyof typeof IDS];

// Defines the webview state type
export interface RunAutoMLState {
  datasetPath?: string,
  platform?: string,
  timeLimit?: string,
  appSize?: string,
}
export type WebviewState = RunAutoMLState & { targetModelPath?: string };

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
interface SetDatasetMsg {
    type: "setDatasetPath",
    value: string,
}
interface SetTargetMsg {
    type: "setTargetModelPath",
    value: string,
}
interface SetFieldMsg {
    type: "getField",
    elementName: string,
    value: string,
}
interface UpdatePlatformsMsg {
    type: "updatePlatforms",
    platforms: [string, string][],
}
export type MessageTypeIn =
    | UpdateConfMsg
    | RestoreStateMsg
    | EnableButtonMsg
    | SetDatasetMsg
    | SetTargetMsg
    | SetFieldMsg
    | UpdatePlatformsMsg;

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
    value: string,
}
interface GetFieldMsg {
    type: "getField",
    elementName: WebviewIds,
    storageName: keyof WebviewState,
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

