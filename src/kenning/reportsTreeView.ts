import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { globSync } from 'glob';

import { getWorkspaceDir, REPORT_NAME, REPORT_MD, REPORT_SUMMARY, REPORT_HTML, KChannel } from "../utils";

export class ReportsTreeDataProvider implements vscode.TreeDataProvider<BaseItemData> {
    private _onDidChangeTreeData = new vscode.EventEmitter<void | BaseItemData | BaseItemData[] | null | undefined>();
    onDidChangeTreeData?: vscode.Event<void | BaseItemData | BaseItemData[] | null | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: BaseItemData): vscode.TreeItem | Thenable<vscode.TreeItem> {
      return element;
    }

    /**
     * Generates first level of items representing generated reports
     * @returns List of tree items representing reports
     */
    getRootChildren(): vscode.ProviderResult<ReportData[]> {
      const workspaceDir = getWorkspaceDir();
      if (workspaceDir === undefined) {
        KChannel.show();
        KChannel.appendLine("Open workspace to find existing reports");
        return;
      }

      const reports: ReportData[] = [];
      // Find all report files matching the given pattern
      const foundReports = globSync(path.join(workspaceDir, "*", REPORT_NAME, REPORT_MD));
      for (const reportPath of foundReports) {
        const reportDir = path.normalize(path.join(reportPath ,".."));
        const reportSummary = path.join(reportDir, REPORT_SUMMARY);
        reports.push(new ReportData(
          path.basename(path.dirname(reportDir)),
          reportDir,
          (fs.existsSync(reportSummary)) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        ));
      }
      return reports;
    }

    /**
     * Generates second level of items representing models compared in report
     * @param report - tree item reporesenting report containing information about models
     * @returns List of tree items representing models
     */
    getReportChildren(report: ReportData): vscode.ProviderResult<ModelData[]> {
      const reportSummary = path.join(report.reportDirectory, REPORT_SUMMARY);
      if (!fs.existsSync(reportSummary)) {
        return;
      }
      // Read summary file and create according items
      const modelsMetrics = require(reportSummary) as ReportSummary;
      const modelItems: ModelData[] = [];
      for (const modelSummary of modelsMetrics) {
        modelItems.push(new ModelData(modelSummary.modelName, report, modelSummary, "", "", vscode.TreeItemCollapsibleState.Collapsed));
      }
      return modelItems;
    }

    /**
     * Generates third level of items representing models metrics
     * @param model - tree item reporesenting model
     * @returns List of tree items representing model metrics
     */
    getModelChildren(model: ModelData): vscode.ProviderResult<BaseItemData[]> {
      const metricsItems: BaseItemData[] = [];
      for (const metric of model.data.metrics) {
        // Skip non-classification metrics
        if (metric.type !== "classification") {continue;}
        metricsItems.push(new BaseItemData(metric.name, `${metric.name}: ${metric.value}`, metric.value.toString(), vscode.TreeItemCollapsibleState.None));
      }
      return metricsItems;
    }

    getChildren(element?: BaseItemData | undefined): vscode.ProviderResult<BaseItemData[]> {
      // Creating childs of report - searching for models
      if (element instanceof ReportData) {
        return this.getReportChildren(element);
      }

      // Creating childs of models - searching for metrics
      if (element instanceof ModelData) {
        return this.getModelChildren(element);
      }

      // element not provided - searching for reports
      return this.getRootChildren();
    }

    refresh() {
      this._onDidChangeTreeData.fire(undefined);
    }
}

class BaseItemData extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
  }
}

export class ReportData extends BaseItemData {
  constructor(
    public readonly label: string,
    public readonly reportDirectory: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(
      label, "REPORT", path.normalize(path.join(reportDirectory, "..")),  collapsibleState
    );
    // Add tag enabling open report button
    if (fs.existsSync(path.join(reportDirectory, REPORT_NAME, REPORT_HTML))) {
      this.contextValue += ";openReport";
    }
  }

  contextValue = "reportData";
  iconPath = new vscode.ThemeIcon("notebook-kernel-select");
}


/**
 * Type representing format of model description from Kenning report summary JSON
 */
type ModelSummary = {
  modelName: string,
  scenarioPath: string | null | undefined,
  metrics: { type: string, name: string, value: number }[],
}
/**
 * Type representing format of Kenning report summary JSON
 */
type ReportSummary = ModelSummary[];

export class ModelData extends BaseItemData {
  constructor(
    public readonly label: string,
    public readonly report: ReportData,
    public readonly data: ModelSummary,
    public readonly tooltip: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, tooltip, description, collapsibleState);
    // Disable collapsibility if no metric is available
    if (data.metrics.length === 0) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    // Add tag enabling open config button
    if (data.scenarioPath && fs.existsSync(data.scenarioPath)) {
      this.contextValue += ";openConfig";
    }
  }

  contextValue = "modelData";
  iconPath = new vscode.ThemeIcon("chip");
}
