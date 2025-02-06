import * as vscode from 'vscode';

export const REPORT_NAME = "report";
export const REPORT_MD = `${REPORT_NAME}.md`;
export const REPORT_HTML = `${REPORT_NAME}.html`;
export const REPORT_SUMMARY = `${REPORT_NAME}.summary.json`;
export const KChannel = vscode.window.createOutputChannel("kenning");

export function getWorkspaceDir(): string | undefined {
    if (vscode.workspace.workspaceFolders === undefined) {
        return;
    }
    const workspaceDir = vscode.workspace.workspaceFolders[0].uri.path;
    return `${workspaceDir}/.kenning`;
  
}
