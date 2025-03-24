import * as vscode from 'vscode';
import * as path from 'path';

import { WebviewState } from './configuration/messageTypes';

export const REPORT_NAME = "report";
export const REPORT_MD = `${REPORT_NAME}.md`;
export const REPORT_HTML = `${REPORT_NAME}.html`;
export const REPORT_SUMMARY = `${REPORT_NAME}.summary.json`;
export const KENNING_DIR = ".kenning";
export const KChannel = vscode.window.createOutputChannel("Kenning");


export function getWorkspaceDir(): string | undefined {
    if (vscode.workspace.workspaceFolders === undefined) {
        return;
    }
    return vscode.workspace.workspaceFolders[0].uri.path;
}

export function getKenningWorkspaceDir(): string | undefined {
    const workspaceDir = getWorkspaceDir();
    if (workspaceDir === undefined) { return; }
    return path.join(workspaceDir, KENNING_DIR);
}

/**
 * Validates given path, if it is absolute, returns it without change. If it is relative,
 * returns it on top of the current workspace
 * @param p - path to validate
 */
export function validatePath(p: string | null | undefined): string | undefined {
    if (!p) { return; }
    if (!path.isAbsolute(p)) {
        const workspaceDir = getWorkspaceDir();
        if (workspaceDir === undefined) { return; }
        return path.join(workspaceDir, p);
    }
    return p;
}


/**
 * Interface defining worksapce state with restricted keys
 */
export interface Memento extends vscode.Memento {
		get<T>(key: keyof WebviewState): T | undefined;
		get<T>(key: keyof WebviewState, defaultValue: T): T;
		update(key: keyof WebviewState, value: any): Thenable<void>;
}
