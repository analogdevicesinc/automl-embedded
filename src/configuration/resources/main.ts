import { WebviewApi } from "vscode-webview";
import { WebviewState, MessageTypeIn, MessageTypeOut, IDS, WebviewIds } from "../messageTypes";

import cssClasses from "./main.module.scss";

type InternalState = {
  buttonEnabled: boolean,
};

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode: WebviewApi<InternalState> = acquireVsCodeApi();

  const runButton: HTMLButtonElement | null = document.querySelector(`#${IDS.automlButton}`);
  const datasetField: HTMLInputElement | null = document.querySelector(`#${IDS.datasetPath}`);
  const datasetFieldBrowseButton: HTMLButtonElement | null = document.querySelector(`#${IDS.datasetButton}`);
  const platformField: HTMLSelectElement | null = document.querySelector(`#${IDS.platform}`);
  const timeLimitField: HTMLInputElement | null = document.querySelector(`#${IDS.timeLimit}`);
  const appSizeField: HTMLInputElement | null = document.querySelector(`#${IDS.appSize}`);
  const targetModelPath: HTMLInputElement | null = document.querySelector(`#${IDS.targetPath}`);
  const targetModelPathBrowseButton: HTMLButtonElement | null = document.querySelector(`#${IDS.targetPathButton}`);

  /**
   * Sends message to the main VSCode context.
   */
  function postMessage(message: MessageTypeOut) {
      vscode.postMessage(message);
  }

  const state = vscode.getState() ?? { buttonEnabled: true };
  /**
   * Sets internal state of the webview.
   */
  function setState({buttonEnabled}: {buttonEnabled?: boolean}) {
      state.buttonEnabled = buttonEnabled ?? state.buttonEnabled;
      vscode.setState(state);
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
  if (!state.buttonEnabled && runButton !== null) {
      runButton.disabled = true;
  }

  /**
   * Sets listener to update workspace state once a given field is changed.
   */
  function setStorageUpdater(
    element: HTMLInputElement | HTMLSelectElement | null,
    storageName: keyof WebviewState,
    eventType: string = 'change',
  ) {
      if (element === null) {return;}
      element.addEventListener(eventType, (event) => {
        let value: string = "";
        console.log("EVENT TARGET TYPE:", typeof(event.target), event.target);
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
            value = event.target.value;
          }
          postMessage({type: "updateField", name: storageName, value});
      });
  }

  /**
   * Sets value of field with value from workspace state.
   */
  function getField(elementName: WebviewIds, storageName: keyof WebviewState) {
      postMessage({type: "getField", elementName, storageName});
  }

  setStorageUpdater(datasetField, 'datasetPath');
  setStorageUpdater(platformField, 'platform');
  setStorageUpdater(timeLimitField, 'timeLimit');
  setStorageUpdater(appSizeField, 'appSize');
  setStorageUpdater(targetModelPath, 'targetModelPath', 'input');

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event: MessageEvent<MessageTypeIn>) => {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
          case "updateConfiguration": {
              updatePlatformsSelect(message.platforms);
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
          case "setDatasetPath": {
              if (datasetField !== null) {
                  datasetField.value = message.value;
              }
              break;
          }
          case "setTargetModelPath": {
              if (targetModelPath) {
                  targetModelPath.value = message.value;
              }
              break;
          }
          case "getField": {
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
      }
  });

  /**
   * Restore webview state.
   */
  function restoreState(state: WebviewState) {
      if (datasetField && state.datasetPath !== undefined) {
          datasetField.value = state.datasetPath;
      }
      if (platformField && state.platform !== undefined) {
          for (let i = 0; i < platformField.options.length; ++i) {
              const option = platformField.options.item(i);
              if (option && option.value === state.platform) {
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
   */
  function updatePlatformsSelect(platforms: [string, string][]) {
      console.log(`updating platforms`);
      const select = document.querySelector('#kenning-configuration-platform');
      if (select) {
          select.textContent = '';

          for (const platform of platforms) {
              console.log(`platform: ${platform}`);
              const option: HTMLOptionElement = document.createElement('option');
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
          setState({buttonEnabled: true});
      }
  }

  /**
   * Validates data and sets invalid class for input and select fields.
   */
  function validateData(field: HTMLInputElement | HTMLSelectElement | null) {
      const value = field?.value;
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
          setState({buttonEnabled: false});
      }
      const datasetPath = validateData(datasetField);
      const platform = validateData(platformField);
      const timeLimit = validateData(timeLimitField);
      const appSize = validateData(appSizeField);

      postMessage({ type: "runAutoML", datasetPath, platform, timeLimit, appSize });
  }

})();
