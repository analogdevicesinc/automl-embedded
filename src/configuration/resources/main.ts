/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import { WebviewApi } from "vscode-webview";
import { WebviewState, MessageTypeIn, MessageTypeOut, IDS, WebviewStringFields, GettableStorageName } from "../messageTypes";

import cssClasses from "./main.module.scss";

/*
 * This script will be run within the webview itself
 * It cannot access the main VS Code APIs directly.
 */
(function () {
const vscode: WebviewApi<null> = acquireVsCodeApi();

const runButton: HTMLButtonElement | null = document.querySelector(`#${IDS.automlButton}`);
const datasetField: HTMLInputElement | null = document.querySelector(`#${IDS.datasetPath}`);
const datasetFieldBrowseButton: HTMLButtonElement | null = document.querySelector(`#${IDS.datasetButton}`);
const platformField: HTMLSelectElement | null = document.querySelector(`#${IDS.platform}`);
const optimizerField: HTMLSelectElement | null = document.querySelector(`#${IDS.optimizer}`);
const timeLimitField: HTMLInputElement | null = document.querySelector(`#${IDS.timeLimit}`);
const appSizeField: HTMLInputElement | null = document.querySelector(`#${IDS.appSize}`);
const targetModelPath: HTMLInputElement | null = document.querySelector(`#${IDS.targetPath}`);
const targetModelPathBrowseButton: HTMLButtonElement | null = document.querySelector(`#${IDS.targetPathButton}`);
const simulateCheckbox: HTMLInputElement | null = document.querySelector(`#${IDS.simulate}`);

/**
 * Sends message to the main VSCode context.
 */
function postMessage(message: MessageTypeOut) {
    vscode.postMessage(message);
}

// Define onClick behavior for buttons
if (runButton !== null) {
    runButton.addEventListener('click', () => runAutoML());
}
if (datasetFieldBrowseButton !== null) {
    datasetFieldBrowseButton.addEventListener('click', () => postMessage({ type: "browseDataset"}));
}
if (targetModelPathBrowseButton !== null) {
    targetModelPathBrowseButton.addEventListener('click', () => postMessage({ type: "browseTargetModelPath"}));
}

/**
 * Sets listener to update workspace state once a given field is changed.
 */
function setStorageUpdater(
    element: HTMLInputElement | HTMLSelectElement | null,
    storageName: keyof WebviewState,
    eventType = 'change',
) {
    if (element === null) {return;}
    element.addEventListener(eventType, (event) => {
        let value: string | boolean = "";
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
            if (event.target.type === "checkbox") {
                value = event.target.checked;
            } else {
                value = event.target.value;
            }
        }
        postMessage({type: "updateField", name: storageName, value});
    });
}

/**
 * Sets value of field with value from workspace state.
 */
function getField(elementName: WebviewStringFields, storageName: GettableStorageName) {
    postMessage({type: "getField", elementName, storageName});
}

setStorageUpdater(datasetField, 'datasetPath');
setStorageUpdater(platformField, 'platform');
setStorageUpdater(optimizerField, 'optimizer');
setStorageUpdater(timeLimitField, 'timeLimit');
setStorageUpdater(appSizeField, 'appSize');
setStorageUpdater(targetModelPath, 'targetModelPath', 'input');
setStorageUpdater(simulateCheckbox, 'simulate');

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event: MessageEvent<MessageTypeIn>) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
    case "updateConfiguration": {
        getField(IDS.targetPath, "targetModelPath");
        break;
    }
    case "restoreState": {
        restoreState(message);
        break;
    }
    case "enableButton": {
        enableButton();
        break;
    }
    case "setField": {
        const element = document.querySelector(`#${message.elementName}`);
        if (
            element === null ||
                !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)
        ) {
            break;
        }
        element.value = message.value;
        break;
    }
    case "updatePlatforms": {
        updateSelectOptions(platformField, message.platforms);
        break;
    }
    case "updateOptimizers": {
        updateSelectOptions(
            optimizerField, message.optimizers,
        );
        break;
    }
    case "toggleSimulate": {
        setupSimulateCheckbox(message.enable);
        break;
    }
    }
});

/**
 * Restore webview state.
 */
function restoreState(state: WebviewState) {
    if (runButton && state.enableButton !== undefined) {
        runButton.disabled = !state.enableButton;
    }
    if (datasetField && state.datasetPath !== undefined) {
        datasetField.value = state.datasetPath;
    }
    if (platformField && state.platform !== undefined) {
        setOption(platformField, state.platform);
    }
    if (optimizerField && state.optimizerOptions) {
        updateSelectOptions(optimizerField, state.optimizerOptions);
    }
    if (optimizerField && state.optimizer !== undefined) {
        setOption(optimizerField, state.optimizer);
    }
    if (timeLimitField && state.timeLimit !== undefined) {
        timeLimitField.value = state.timeLimit;
    }
    if (appSizeField && state.appSize !== undefined) {
        appSizeField.value = state.appSize;
    }
    if (simulateCheckbox && state.simulate !== undefined) {
        simulateCheckbox.checked = state.simulate;
    }
    if (state.simulationsAvailable !== undefined) {
        setupSimulateCheckbox(state.simulationsAvailable);
    }
    if (targetModelPath && state.targetModelPath !== undefined) {
        targetModelPath.value = state.targetModelPath;
    }
}

/**
 * Updates options in select platforms.
 */
function updateSelectOptions(selectField: HTMLSelectElement | null, platforms: [string, string][]) {
    if (!selectField) {
        return;
    }

    const curPlatformName = getSelected(selectField);
    selectField.textContent = '';

    for (const platform of platforms) {
        const option: HTMLOptionElement = document.createElement('option');
        option.value = platform[1];
        option.textContent = platform[0] ?? null;
        selectField.appendChild(option);
    }

    if (curPlatformName !== undefined) {
        setOption(selectField, curPlatformName);
    }
}

function setOption(selectField: HTMLSelectElement, name: string) {
    for (let i = 0; i < selectField.options.length; ++i) {
        const option = selectField.options.item(i);
        if (option && option.value === name) {
            selectField.selectedIndex = option.index;
            return i;
        }
    }

    return;
}

function getSelected(selectField: HTMLSelectElement) {
    const idx = selectField.selectedIndex;

    if (idx < 0) {
        return;
    }

    return selectField.options.item(idx)?.value;
}

/**
 * Enables run button.
 */
function enableButton() {
    if (runButton) {
        runButton.disabled = false;
    }
}

function setupSimulateCheckbox(enable: boolean) {
    if (!simulateCheckbox) {return;}

    simulateCheckbox.disabled = !enable;
    if (!enable) {
        simulateCheckbox.checked = false;
        postMessage({type: "updateField", name: "simulationsAvailable", value: false});
    }
}

/**
 * Validates data and sets invalid class for input and select fields.
 */
function validateData(field: HTMLInputElement | HTMLSelectElement | null, markError = true) {
    const value = field?.value;
    if (!markError) {return value;}

    if (field && !value) {
        field.classList.add(cssClasses.invalid);
    } else if (field) {
        field.classList.remove(cssClasses.invalid);
    }
    return value;
}

/**
 * Gathers input values and triggers Kenning scenario.
 */
function runAutoML() {
    if (runButton !== null) {
        runButton.disabled = true;
        postMessage({type: "updateField", name: "enableButton", value: false});
    }
    const datasetPath = validateData(datasetField);
    const platform = validateData(platformField);
    const timeLimit = validateData(timeLimitField);
    const appSize = validateData(appSizeField, false);
    const optimizer = validateData(optimizerField);
    const simulate = simulateCheckbox?.checked;

    postMessage({ type: "runAutoML", datasetPath, platform, timeLimit, appSize, optimizer, simulate });
}

})();
