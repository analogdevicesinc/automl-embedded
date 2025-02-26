
export const AUTOML_SCENARIO_TEMPLATE = {
    platform:
    {
        type: "",
        parameters: {}
    },
    runtime_builder:
    {
        type: "ZephyrRuntimeBuilder",
        parameters:
        {
            workspace: "/opt/zephyr-workspace/kenning-zephyr-runtime",
            run_west_update: false,
            output_path: "",
            extra_targets: ["board-repl"]
        }
    },
    automl: {
        type: "AutoPyTorchML",
        parameters: {
            output_directory: "",
            time_limit: -1,
            use_models: ["PyTorchAnomalyDetectionVAE"],
            n_best_models: 5,
            optimize_metric: "f1",
            budget_type: "epochs",
            min_budget: 1,
            max_budget: 3,
            application_size: -1,
        }
    },
    dataset:
    {
        type: "kenning.datasets.anomaly_detection_dataset.AnomalyDetectionDataset",
        parameters:
        {
            dataset_root: "",
            csv_file: "",
            reduce_dataset: 0.0024,
            inference_batch_size: 1,
            split_seed: 12345,
            split_fraction_test: 0.05,
        }
    },
    optimizers:
    [
        {
            type: "kenning.optimizers.tflite.TFLiteCompiler",
            parameters:
            {
                target: "default",
                compiled_model_path: "",
                inference_input_type: "float32",
                inference_output_type: "float32"
            }
        }
    ],
};
