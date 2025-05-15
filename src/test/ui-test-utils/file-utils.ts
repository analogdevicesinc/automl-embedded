/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import { PathLike, rmSync, unlinkSync } from "fs";
import { EditorView, InputBox, Key, TitleBar } from "vscode-extension-tester";

/**
 * Open the given folder
 * @param folder - The folder to open
 */
export async function openFolder(folder: string): Promise<void> {
    const titleBar = new TitleBar();
    await titleBar.select("File", "Open Folder...");
    const input = await InputBox.create();
    await input.setText(folder);
    await input.confirm();
}

/**
 * Close the currently open folder, if any
 */
export async function closeFolder() {
    const titleBar = new TitleBar();
    const fileMenu = await titleBar.select("File");
    if (fileMenu !== undefined) {
        if (await fileMenu.hasItem("Close Folder")) {
            await fileMenu.select("Close Folder");
        } else {
            fileMenu.sendKeys(Key.ESCAPE).catch((error) => {
                console.log(`Escape failed: ${error}`);
            });
        }
    }
}

/**
 * Recursively delete the given folder
 * @param folder - the folder to delete
 */
export function deleteFolder(folder: PathLike) {
    rmSync(folder, { recursive: true, force: true });
}

/**
 * Recursively delete the given file
 * @param file - the file to delete
 */
export function deleteFile(file: PathLike) {
    unlinkSync(file);
}

/**
 * Closes Welcome Page and any other open tabs
 */

export async function closeWindows() {
    //Closes initial welcome page which is present when extension is activated
    const editorView = new EditorView();
    const titles = await editorView.getOpenEditorTitles();
    if (titles.includes("Welcome")) {
        await editorView.closeEditor("Welcome");
    }
    if (titles.includes("Settings")) {
        await editorView.closeEditor("Settings");
    }
    if (titles.includes("launch.json")) {
        await editorView.closeEditor("launch.json");
    }
}
