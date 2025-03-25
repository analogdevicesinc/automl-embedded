import * as path from "path";
import * as vscode from 'vscode';

export interface ScenarioTemplate {
    platform: {
        type: string,
        parameters: {
            name?: string
            simulated?: boolean
            display_name?: string
        }
    }
    dataset: {
        type: string,
        parameters: {
            csv_file?: string
            dataset_root?: string
        }
    }
    runtime_builder: {
        type: string,
        parameters: {
            output_path?: string
            workspace?: string
        }
    }
    optimizers: {
        type: string,
        parameters: {
            compiled_model_path?: string
        }
    }[]
    automl: {
        type: string
        parameters: {
            output_directory?: string
            time_limit?: number
            application_size?: number
            n_best_models?: number
        }
    }
}

export const DEFAULT_BASE_SCENARIO = {
    platform:
    {
        type: "ZephyrPlatform",
        parameters: {
            name: undefined,
            simulated: undefined,
        },
    },
    runtime_builder:
    {
        type: "ZephyrRuntimeBuilder",
        parameters:
        {
            workspace: undefined,
            run_west_update: false,
            output_path: undefined,
            extra_targets: ["board-repl"],
        },
    },
    automl: {
        type: "AutoPyTorchML",
        parameters: {
            output_directory: undefined,
            time_limit: undefined,
            use_models: ["PyTorchAnomalyDetectionVAE"],
            n_best_models: 5,
            optimize_metric: "f1",
            budget_type: "epochs",
            min_budget: 1,
            max_budget: 3,
            application_size: undefined,
        },
    },
    dataset:
    {
        type: "kenning.datasets.anomaly_detection_dataset.AnomalyDetectionDataset",
        parameters:
        {
            dataset_root: undefined,
            csv_file: undefined,
            inference_batch_size: 1,
            split_seed: 12345,
            split_fraction_test: 0.1,
        },
    },
    optimizers:
    [
        {
            type: "kenning.optimizers.tflite.TFLiteCompiler",
            parameters:
            {
                target: "default",
                compiled_model_path: undefined,
                inference_input_type: "float32",
                inference_output_type: "float32",
            },
        },
    ],
};


export function validateScenario(scenario: any): scenario is ScenarioTemplate {
    interface Scenario1 {
        platform: {type?: string, parameters?: any},
        dataset: {type?: string, parameters?: any},
        runtime_builder: {type?: string, parameters?: any},
        automl: {type?: string, parameters?: any},
    };
    interface Scenario2 {
        optimizers: {
            type: string,
            parameters: {
                compiled_model_path?: string
            }
        }[]
    };

    for (const member of ['platform', 'dataset', 'runtime_builder', 'automl']) {
        if (!(member in scenario)) {
            return false;
        }

        const scenarioMember = (scenario as Scenario1)[member as keyof Scenario1];

        if (scenarioMember.type !== 'string'){
            return false;
        }

        if (scenarioMember.parameters === undefined){
            return false;
        }
    }

    if (!('optimizers' in scenario) || !Array.isArray((scenario as Scenario2).optimizers)) {
        return false;
    }

    for (const optimizer of (scenario as Scenario2).optimizers) {
        if (typeof optimizer.type !== 'string'){
            return false;
        }

        if (optimizer.parameters === undefined){
            return false;
        }
    }

    return true;
}

export function populateScenario(
    baseScenario: ScenarioTemplate,
    runDir: string,
    extraConfig: vscode.WorkspaceConfiguration,
    platform: string,
    datasetPath: string,
    timeLimit: string,
    appSize: string,
) {
    const scenario = JSON.parse(JSON.stringify(baseScenario)) as ScenarioTemplate;

    const configKenningZephyrRuntimePath: string | undefined = extraConfig.get("kenningZephyrRuntimePath");
    const runZephyrOutputPath = path.join(runDir, 'zephyr');
    const datasetRootPath = path.join(runDir, 'dataset');
    const compiledModelPath = path.join(runDir, 'vae.tflite');

    scenario.platform.parameters.name = platform;
    scenario.platform.parameters.simulated = extraConfig.get("simulate");

    scenario.runtime_builder.parameters.workspace = configKenningZephyrRuntimePath;
    scenario.runtime_builder.parameters.output_path = runZephyrOutputPath;

    scenario.automl.parameters.output_directory = runDir;
    scenario.automl.parameters.time_limit = Number.parseFloat(timeLimit);
    scenario.automl.parameters.application_size = Number.parseFloat(appSize);
    scenario.automl.parameters.n_best_models = extraConfig.get("numberOfOutputModels");

    scenario.dataset.parameters.dataset_root = datasetRootPath;
    scenario.dataset.parameters.csv_file = datasetPath;

    let optimizer;
    if ((optimizer = scenario.optimizers.at(-1)) !== undefined) {
        optimizer.parameters.compiled_model_path = compiledModelPath;
    }

    return scenario;
}