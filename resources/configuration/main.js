//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // @ts-ignore - Internal VSCode function available in WebView
    const vscode = acquireVsCodeApi();

    /** @type {HTMLButtonElement | null} */
    const runButton = document.querySelector('#run-automl-button');
    /** @type {HTMLInputElement | null} */
    const datasetField = document.querySelector('#kenning-configuration-dataset-path');
    /** @type {HTMLButtonElement | null} */
    const datasetFieldBrowseButton = document.querySelector('#kenning-configuration-dataset-path-browse');
    /** @type {HTMLSelectElement | null} */
    const platformField = document.querySelector('#kenning-configuration-platform');
    /** @type {HTMLInputElement | null} */
    const timeLimitField = document.querySelector('#kenning-configuration-time-limit');
    /** @type {HTMLInputElement | null} */
    const appSizeField = document.querySelector('#kenning-configuration-app-size');
    /** @type {HTMLInputElement | null} */
    const targetModelPath = document.querySelector('#kenning-configuration-target-model-path');
    /** @type {HTMLButtonElement | null} */
    const targetModelPathBrowseButton = document.querySelector('#kenning-configuration-target-model-path-browse');
    if (runButton !== null) {
        runButton.addEventListener('click', () => runAutoML());
    }
    if (datasetFieldBrowseButton !== null) {
        datasetFieldBrowseButton.addEventListener('click', () => vscode.postMessage({ type: 'browseDataset'}));
    }
    if (targetModelPathBrowseButton !== null) {
        targetModelPathBrowseButton.addEventListener('click', () => vscode.postMessage({ type: 'browseTargetModelPath'}));
    }

    /**
     * Sets listener to update workspace state once a given field is changed
     * @param {HTMLInputElement | HTMLSelectElement | null} element 
     * @param {string} storageName 
     * @param {string} [eventType='change']
     */
    function setStorageUpdater(element, storageName, eventType = 'change') {
        if (element === null) {return;}
        element.addEventListener(eventType, (event) => {
            // @ts-ignore - Target is either HTMLInputElement or HTMLSelectElement
            vscode.postMessage({type: 'updateField', name: storageName, value: event.target?.value ?? event.target?.selected ?? ""});
        });
    }

    /**
     * Sets value of field with value from workspace state
     * @param {string} elementName 
     * @param {string} storageName 
     */
    function getField(elementName, storageName) {
        vscode.postMessage({type: 'getField', elementName: elementName, storageName: storageName});
    }

    setStorageUpdater(datasetField, 'datasetpath');
    setStorageUpdater(platformField, 'platform');
    setStorageUpdater(timeLimitField, 'timelimit');
    setStorageUpdater(appSizeField, 'appsize');
    setStorageUpdater(targetModelPath, 'targetmodelpath', 'input');

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'updateConfiguration': {
                updatePlatformsSelect(message.platforms);
                getField("#kenning-configuration-target-model-path", "targetmodelpath");
                break;
            }
            case 'restoreState': {
                restoreState(message);
                break;
            }
            case 'enableButton': {
                enableButton();
                break;
            }
            case 'setDatasetPath': {
                if (datasetField !== null) {
                    datasetField.value = message.value;
                }
                break;
            }
            case 'setTargetModelPath': {
                if (targetModelPath) {
                    targetModelPath.value = message.value;
                }
            }
            case 'getField': {
                const element = document.querySelector(message.elementName);
                if (element !== null) {
                    element.value = message.value;
                }
            }
        }
    });

    /**
     * Restore webview state.
     * @typedef {{dataset?: string, platform?: string, timeLimit?: string, appSize?: string, targetModelPath?: string}} State
     * @param {State} state
     */
    function restoreState(state) {
        if (datasetField && state.dataset !== undefined) {
            datasetField.value = state.dataset;
        }
        if (platformField && state.platform !== undefined) {
            for (const option of platformField.options) {
                if (option.value === state.platform) {
                    platformField.selectedIndex = option.index;
                    break;
                }
            }
        }
        if (timeLimitField && state.timeLimit !== undefined) {
            timeLimitField.value = state.timeLimit;
        }
        if (appSizeField && state.appSize !== undefined) {
            appSizeField.value = state.appSize;
        }
        if (targetModelPath && state.targetModelPath !== undefined) {
            targetModelPath.value = state.targetModelPath;
        }
    }
    
    /**
     * Updates options in select platforms.
     * @param {string[]} platforms
     */
    function updatePlatformsSelect(platforms) {
        console.log(`updating platforms`);
        const select = document.querySelector('#kenning-configuration-platform');
        if (select) {
            select.textContent = '';

            for (const platform of platforms) {
                console.log(`platform: ${platform}`);
                /** @type {HTMLOptionElement} */
                const option = document.createElement('option');
                option.value = platform[1];
                option.textContent = platform[0] ?? null;
                select?.appendChild(option);
            }
        }
    }

    /**
     * Enables run button.
     */
    function enableButton() {
        if (runButton) {
            runButton.disabled = false;
        }
    }

    /**
     * Validates data and sets invalid class for input and select fields.
     * @param {HTMLInputElement | HTMLSelectElement | null} field
     */
    function validateData(field) {
        const value = field?.value;
        if (field && !value) {
            field.classList.add("invalid");
        } else if (field) {
            field.classList.remove("invalid");
        }
        return value;
    }

    /**
     * Gathers input values and triggers Kenning scenario.
     */
    function runAutoML() {
        if (runButton !== null) {
            runButton.disabled = true;
        }
        const datasetPath = validateData(datasetField);
        const platform = validateData(platformField);
        const timeLimit = validateData(timeLimitField);
        const appSize = validateData(appSizeField);

        vscode.postMessage({ type: 'runAutoML', datasetPath, platform, timeLimit, appSize });
    }

}());


