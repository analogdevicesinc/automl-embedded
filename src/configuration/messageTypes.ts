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
export type RunAutoMLState = {
  datasetPath?: string,
  platform?: string,
  timeLimit?: string,
  appSize?: string,
}
export type WebviewState = RunAutoMLState & { targetModelPath?: string };

// Defines message types send to webview
type UpdateConfMsg = {
    type: "updateConfiguration",
    platforms: [string, string][],
}
type RestoreStateMsg = {
    type: "restoreState",
} & WebviewState;
type EnableButtonMsg = {
    type: "enableButton",
}
type SetDatasetMsg = {
    type: "setDatasetPath",
    value: string,
}
type SetTargetMsg = {
    type: "setTargetModelPath",
    value: string,
}
type SetFieldMsg = {
    type: "getField",
    elementName: string,
    value: string,
}
export type MessageTypeIn =
    | UpdateConfMsg
    | RestoreStateMsg
    | EnableButtonMsg
    | SetDatasetMsg
    | SetTargetMsg
    | SetFieldMsg;

// Defines message types send from webview
type BrowseDatasetMsg = {
    type: "browseDataset",
}
type BrowseTargetMsg = {
    type: "browseTargetModelPath",
}
type UpdateFieldMsg = {
    type: "updateField",
    name: keyof WebviewState,
    value: string,
}
type GetFieldMsg = {
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

