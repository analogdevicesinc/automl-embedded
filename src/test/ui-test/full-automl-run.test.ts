import * as path from "path";
import { Workbench, EditorView, By, VSBrowser, until, SideBarView, CustomTreeItem, TitleBar } from 'vscode-extension-tester';
import { closeFolder, openFolder } from '../ui-test-utils/file-utils.js';

// An example how to handle a simple web view
describe('Run AutoML Test', () => {
    let workbench: Workbench;
    const testDirectory = "/tmp/vscode-mock-kenning-zephyr-runtime-example-app";


    before(async function () {
        this.timeout(0);
        workbench = new Workbench();
        // set path to kenning-zephyr-runtime in settings
        const settings = await workbench.openSettings();
        const kzrSetting = await settings.findSettingByID("kenning-edge-automl.kenningZephyrRuntimePath");
        await kzrSetting.setValue(path.join(testDirectory, "kenning-zephyr-runtime"));
        // open workspace with mocked kenning-zephyr-runtime-example-app
        await closeFolder();
        await workbench.getDriver().sleep(500);
        await openFolder(testDirectory);
        await workbench.getDriver().sleep(500);
    });

    after(async () => {
        await workbench.getDriver().switchTo().defaultContent();
        await new EditorView().closeAllEditors();
    });

    it('Run on MAX32690 Evaluation Kit', async () => {
        const chai = await import('chai');

        // check if entered the workspace
        const titleBar = new TitleBar();
        const title = await titleBar.getTitle();
        chai.expect(title).to.have.string("kenning-zephyr-runtime-example-app");

        await workbench.executeCommand("kenning-edge-automl.configuration.focus");
        await workbench.getDriver().sleep(500);

        // enter the configuration iframe
        await workbench.getDriver().switchTo().frame(0);
        await workbench.getDriver().switchTo().frame(0);

        // fill the configuration form and start AutoML
        const datasetPathInput = await workbench.getDriver().findElement(By.id("kenning-configuration-dataset-path"));

        await datasetPathInput.clear();
        await datasetPathInput.sendKeys("https://dl.antmicro.com/kenning/datasets/anomaly_detection/cats_nano.csv");

        const platformSelect = await workbench.getDriver().findElement(By.id("kenning-configuration-platform"));
        const platformSelectTarget = await platformSelect.findElement(By.css('option[value="max32690evkit/max32690/m4"]'));
        await platformSelectTarget.click();

        const timeLimitInput = await workbench.getDriver().findElement(By.id("kenning-configuration-time-limit"));
        await timeLimitInput.clear();
        await timeLimitInput.sendKeys("2");

        const applicationSizeInput = await workbench.getDriver().findElement(By.id("kenning-configuration-app-size"));
        await applicationSizeInput.clear();
        await applicationSizeInput.sendKeys("75.5");

        const runAutoMLButton = await workbench.getDriver().findElement(By.id("run-automl-button"));
        await runAutoMLButton.click();
        console.log("Started AutoML");
        await VSBrowser.instance.takeScreenshot("started");

        // handle AutoML dying early
        await workbench.getDriver().sleep(2000);
        chai.expect(await runAutoMLButton.isEnabled()).to.be.false;

        // wait for AutoML to finish
        await workbench.getDriver().wait(until.elementIsEnabled(runAutoMLButton));
        await workbench.getDriver().sleep(1000);
        console.log("Finished AutoML");
        await VSBrowser.instance.takeScreenshot("finished");

        // leave the configuration iframe
        await workbench.getDriver().switchTo().defaultContent();
        await workbench.getDriver().sleep(500);

        // get the reports
        const sidebarView = new SideBarView();
        const reportTree = (await sidebarView.getContent().getSection("Reports"));

        const reports = await reportTree.getVisibleItems();

        // ensure that the report was generated
        chai.expect(reports).to.not.be.empty;
        const report = reports.at(0)! as CustomTreeItem;
        const reportModels = await report.getChildren();

        // ensure that models were generated
        chai.expect(reportModels).to.not.be.empty;

        for (const model of reportModels) {
            await model.expand();
        }

        console.log("Found report");
        await VSBrowser.instance.takeScreenshot("report");
    });
});
