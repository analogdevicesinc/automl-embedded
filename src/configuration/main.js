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
    const datasetFieldBrowseButton = document.querySelector('#kenning-configuration-dataset-path-browse');
    /** @type {HTMLSelectElement | null} */
    const platformField = document.querySelector('#kenning-configuration-platform');
    /** @type {HTMLInputElement | null} */
    const timeLimitField = document.querySelector('#kenning-configuration-time-limit');
    /** @type {HTMLInputElement | null} */
    const appSizeField = document.querySelector('#kenning-configuration-app-size');
    if (runButton !== null) {
        runButton.addEventListener('click', () => runAutoML());
    }
    if (datasetFieldBrowseButton !== null) {
        datasetFieldBrowseButton.addEventListener('click', () => searchDataset());
    }

    /**
    * Sets listener to update workspace state once a given field is changed
    */
    function setStorageUpdater(element, storageName, eventType = 'focusout') {
        if (element === null) {return;}
        element.addEventListener(eventType, (event) => {
            vscode.postMessage({type: 'updateField', name: storageName, value: event.target.value ?? event.target.selected});
        });
    }

    setStorageUpdater(datasetField, 'datasetpath');
    setStorageUpdater(platformField, 'platform', 'change');
    setStorageUpdater(timeLimitField, 'timelimit');
    setStorageUpdater(appSizeField, 'appsize');

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'updatePlatforms': {
                updatePlatformsSelect(message.platforms);
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
        }
    });

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

    /**
     * Opens a file browser for dataset.
     */
    function searchDataset() {
        vscode.postMessage({ type: 'browseDataset'});
    }

}());


