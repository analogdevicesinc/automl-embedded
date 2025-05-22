/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import { existsSync, lstatSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { KChannel } from '../utils';
import { RunAutoMLState } from './messageTypes';

/**
 * Sets up environmental variables based on the plugin config
 */
function prepareEnv() {
    const conf2Var = {
        "zephyrSDKPath": "ZEPHYR_SDK_PATH",
        "ai8x-training": "AI8X_TRAINING_PATH",
        "ai8x-synthesis": "AI8X_SYNTHESIS_PATH",
    };

    const pluginConfig = vscode.workspace.getConfiguration("kenning-edge-automl");

    Object.entries(conf2Var).forEach((conf) => {
        if (pluginConfig.get(conf[0])) {
            process.env[conf[1]] = pluginConfig.get(conf[0]);
        }
    });

    if (pluginConfig.get("pyrenodePath")) {
        const renodePath: string = pluginConfig.get("pyrenodePath") ?? "renode";
        if (renodePath.endsWith(".tar.gz") || renodePath.endsWith(".tar.xz")) {
            process.env.PYRENODE_PKG = renodePath;
        } else {
            process.env.PYRENODE_BIN = renodePath;
        }
    }
}

/**
 * Checks whether the configuration is correct and required paths exist
 * @returns True if configuration is correct
 */
export function checkConfig(autoMLConf: RunAutoMLState): boolean {
    prepareEnv();

    const pluginConfig = vscode.workspace.getConfiguration("kenning-edge-automl");

    const errors: string[] = [];

    const kenningZephyrRuntimePath = pluginConfig.get<string>("kenningZephyrRuntimePath");

    // Check if Kenning Zephyr Runtime path is set and exists
    if (kenningZephyrRuntimePath === undefined) {
        errors.push("Kenning Zephyr Runtime path is not set");
    } else if (!existsSync(kenningZephyrRuntimePath)) {
        errors.push(`Provided path ${kenningZephyrRuntimePath} does not exist`);
    } else {
        const kenningZephyrRuntimeParsedPath = path.parse(kenningZephyrRuntimePath);

        // Check if west was initialized in Kenning Zephyr Runtime
        if (!existsSync(path.join(kenningZephyrRuntimeParsedPath.dir, '.west'))) {
            errors.push(`West is not initialized in ${kenningZephyrRuntimePath}`);
        }

        // Check if modules were initialized in Kenning Zephyr Runtime
        if (!existsSync(path.join(kenningZephyrRuntimeParsedPath.dir, 'zephyr'))) {
            errors.push(`Modules are not initialized in ${kenningZephyrRuntimePath}`);
        }
    }

    // Validate PYRENODE only if simulation is enabled
    if (autoMLConf.simulate) {
        const renodeRuntime = process.env.PYRENODE_RUNTIME ?? 'mono';

        if (renodeRuntime === 'mono') {
            const renodePortablePath = process.env.PYRENODE_PKG;

            // Check if path to Renode portable is set and exists
            if (renodePortablePath === undefined) {
                errors.push(`PYRENODE_PKG is not set`);
            } else if (!existsSync(renodePortablePath)) {
                errors.push(`Renode portable not found at ${renodePortablePath}`);
            }
        } else if (renodeRuntime === 'coreclr') {
            const renodeBinPath = process.env.PYRENODE_BIN;

            // Check if path to Renode executable is set and exists
            if (renodeBinPath === undefined) {
                errors.push(`PYRENODE_BIN is not set`);
            } else if (!existsSync(renodeBinPath)) {
                errors.push(`Renode executable not found at ${renodeBinPath}`);
            }
        } else {
            errors.push(`Invalid RENODE_RUNTIME ${renodeRuntime}`);
        }
    }

    const zephyrSdkPath = process.env.ZEPHYR_SDK_PATH;

    // Check if path to Zephyr is set and exists
    if (zephyrSdkPath === undefined) {
        errors.push(`ZEPHYR_SDK_PATH is not set`);
    } else if (!existsSync(zephyrSdkPath)) {
        errors.push(`Zephyr SDK not found at ${zephyrSdkPath}`);
    }

    // Check ai8x repositories
    if (autoMLConf?.optimizer === "Ai8xCompiler") {
        const ai8xTrainingPath = process.env.AI8X_TRAINING_PATH;
        if (ai8xTrainingPath === undefined) {
            errors.push(`AI8X_TRAINING_PATH is not defined`);
        } else if (!existsSync(ai8xTrainingPath)) {
            errors.push(`AI8X_TRAINING_PATH not found at ${ai8xTrainingPath}`);
        } else if(!existsSync(path.join(ai8xTrainingPath, ".venv"))) {
            errors.push(`AI8X_TRAINING_PATH not prepared, missing virtual env at ${ai8xTrainingPath}/.venv`);
        }

        const ai8xSynthesisPath = process.env.AI8X_SYNTHESIS_PATH;
        if (ai8xSynthesisPath === undefined) {
            errors.push(`AI8X_SYNTHESIS_PATH is not defined`);
        } else if (!existsSync(ai8xSynthesisPath)) {
            errors.push(`AI8X_SYNTHESIS_PATH not found at ${ai8xSynthesisPath}`);
        } else if(!existsSync(path.join(ai8xSynthesisPath, ".venv"))) {
            errors.push(`AI8X_SYNTHESIS_PATH not prepared, missing virtual env at ${ai8xSynthesisPath}/.venv`);
        }
    }

    const openocdPath = pluginConfig.get<string>("openocdPath");
    if (openocdPath) {
        if (!existsSync(openocdPath)) {
            errors.push(`OpenOCD not found at ${openocdPath}`);
        } else if (!lstatSync(openocdPath).isFile()) {
            errors.push(`OpenOCD is not a file ${openocdPath}`);
        }
    }

    if (errors.length > 0) {
        vscode.window.showErrorMessage(`Configuration errors. See output for more details.`);
        KChannel.appendLine(`Found configuration errors:`);
        errors.forEach(error => {
            KChannel.appendLine(`- ${error}`);
        });
        KChannel.show();
        return false;
    }

    return true;
}
