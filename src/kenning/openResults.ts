import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs";

import { ReportData, ModelData } from './reportsTreeView';
import { getWorkspaceDir, REPORT_NAME, REPORT_HTML } from '../utils';


function replaceLinks(
  report: ReportData,
  panel: vscode.WebviewPanel,
  _match: string,
  p1: string, _p2: string, p3: string,
): string {
  return p1 + panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(report.reportDirectory, "report", p3))
  ) + '"';
}

export function openReport(report: ReportData) {
  const workspaceDir = getWorkspaceDir();
  if (workspaceDir === undefined) {return;}
  const reportHtml = path.join(report.reportDirectory, REPORT_NAME, REPORT_HTML);
  if (!fs.existsSync(reportHtml)) {return;}

  const panel = vscode.window.createWebviewPanel(
  	`$kenning_view_${report.label}`,
  	`View ${report.label}`,
  	vscode.ViewColumn.One,
  	{
  	  // Enable access for additional CSS and JS files
  		localResourceRoots: [vscode.Uri.file(path.join(report.reportDirectory, REPORT_NAME, "_static"))],
  		// Enabling scripts required for Bokeh plots
  		enableScripts: true,
  	},
  );
  vscode.workspace.openTextDocument(reportHtml).then((file) => {
  	let htmlFile = file.getText();
  	// Adjust links to local files
  	htmlFile = htmlFile.replaceAll(
  	  /((href|src)=")(_static[^"]+)"/g,
  	  (m, p1, p2, p3) => replaceLinks(report, panel, m, p1, p2, p3),
  	);
  	panel.webview.html = htmlFile;
  });
  
}


export function openConfiguration(model: ModelData) {
	if (model.data.scenarioPath) {
		vscode.workspace.openTextDocument(vscode.Uri.file(model.data.scenarioPath)).then(
			doc => vscode.window.showTextDocument(doc)
		);
	}
}
