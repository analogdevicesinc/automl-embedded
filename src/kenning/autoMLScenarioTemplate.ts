/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import * as path from "path";
import * as vscode from 'vscode';

export interface ScenarioTemplate {
    platform: {
        type: string,
        parameters: {
            name?: string
            simulated?: boolean
            display_name?: string
            auto_flash?: boolean
            openocd_path?: string
            uart_port?: string
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
            use_models?: (string | Record<string, Record<string, Record<string, [number, number]>>>)[]
            use_cuda?: boolean
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
            auto_flash: true,
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
            min_budget: 3,
            max_budget: 8,
            application_size: undefined,
            use_cuda: false,
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
                compiled_model_path: undefined,
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

const AI8X_COMPATIBLE_MODELS = ["Ai8xAnomalyDetectionCNN", "PyTorchAnomalyDetectionCNN"];

export function populateScenario(
    baseScenario: ScenarioTemplate,
    runDir: string,
    extraConfig: vscode.WorkspaceConfiguration,
    platform: string,
    optimizer: string,
    datasetPath: string,
    timeLimit: string,
    simulate: boolean,
    appSize?: string,
) {
    const scenario = JSON.parse(JSON.stringify(baseScenario)) as ScenarioTemplate;

    const configKenningZephyrRuntimePath: string | undefined = extraConfig.get("kenningZephyrRuntimePath");
    const runZephyrOutputPath = path.join(runDir, 'zephyr');
    const datasetRootPath = path.join(runDir, 'dataset');
    const compiledModelPath = path.join(runDir, 'vae.tflite');

    const platformParams = scenario.platform.parameters;
    platformParams.name = platform;
    platformParams.simulated = simulate;
    platformParams.auto_flash = !simulate;
    const openocdPath = extraConfig.get<string>("openocdPath");
    if (openocdPath) {
        platformParams.openocd_path = openocdPath;
    }
    const uartPath = extraConfig.get<string>("UARTPath");
    if (uartPath) {
        platformParams.uart_port = uartPath;
    }

    scenario.runtime_builder.parameters.workspace = configKenningZephyrRuntimePath;
    scenario.runtime_builder.parameters.output_path = runZephyrOutputPath;

    const autoMLParams = scenario.automl.parameters;
    autoMLParams.output_directory = runDir;
    autoMLParams.time_limit = Number.parseFloat(timeLimit);
    autoMLParams.application_size = (appSize) ? Number.parseFloat(appSize) : undefined;
    autoMLParams.n_best_models = extraConfig.get<number>("numberOfOutputModels");
    autoMLParams.use_cuda = extraConfig.get<boolean>("useCUDA");
    // Affect only ai8x compatible models
    if (optimizer === "Ai8xCompiler") {
        autoMLParams.use_models = autoMLParams.use_models?.filter(
            (v) => {
                let model: string;
                if (typeof v === "string") {
                    model = v;
                } else {
                    model = Object.keys(v).at(0) ?? "";
                }
                return AI8X_COMPATIBLE_MODELS.includes(model);
            },
        ) ?? [];
        // If models not defined, use Ai8xAnomalyDetectionCNN
        if ((autoMLParams.use_models?.length ?? 0) === 0) {
            autoMLParams.use_models = [{
                [AI8X_COMPATIBLE_MODELS[0]]: {
                    filters: {
                        list_range: [1, 2],
                        item_range: [2, 16],
                    },
                    conv_stride: {
                        item_range: [1, 1],
                    },
                    conv_dilation: {
                        item_range: [1, 1],
                    },
                    pool_stride: {
                        item_range: [1, 1],
                    },
                    pool_dilation: {
                        item_range: [1, 1],
                    },
                },
            }];
        }
    }

    scenario.dataset.parameters.dataset_root = datasetRootPath;
    scenario.dataset.parameters.csv_file = datasetPath;

    let opts;
    if ((opts = scenario.optimizers.at(-1)) !== undefined) {
        opts.parameters.compiled_model_path = compiledModelPath;
        opts.type = optimizer;
    }

    return scenario;
}
