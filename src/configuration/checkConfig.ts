import { existsSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { KChannel } from '../utils';

/**
 * Checks whether the configuration is correct and required paths exist
 * @returns True if configuration is correct
 */
export function checkConfig(): boolean {
    const pluginConfig = vscode.workspace.getConfiguration("kenning-edge-automl");

    let errors: string[] = [];

    const kenningZephyrRuntimePath = pluginConfig.get("kenningZephyrRuntimePath") as string | undefined;

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

    const zephyrSdkPath = process.env.ZEPHYR_SDK_PATH;

    // Check if path to Zephyr is set and exists
    if (zephyrSdkPath === undefined) {
        errors.push(`ZEPHYR_SDK_PATH is not set`);
    } else if (!existsSync(zephyrSdkPath)) {
        errors.push(`Zephyr SDK not found at ${zephyrSdkPath}`);
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
