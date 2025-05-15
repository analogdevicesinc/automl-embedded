# Copyright (c) 2025 Analog Devices, Inc.
# Copyright (c) 2025 Antmicro <www.antmicro.com>
#
# SPDX-License-Identifier: Apache-2.0

import sys
import json
import yaml
import time
import shutil
from pathlib import Path

def main():
    if "available-platforms" in sys.argv:
        with open(Path(__file__).parent.parent / "resources/platforms/platforms.yml") as pfd:
            print(json.dumps(yaml.safe_load(pfd)))
        return 0

    time.sleep(10)

    Path("/tmp/mock_kenning_run").write_text(json.dumps(sys.argv))

    scenario_path = Path(sys.argv[sys.argv.index("--cfg") + 1])
    run_dir = scenario_path.parent

    report_dir = run_dir / "report"
    report_dir.mkdir()

    (report_dir / "report.md").touch()
    (report_dir / "report.summary.json").write_text("""[{"metrics": [{"type": "classification", "name": "Accuracy", "value": 0.96}, {"type": "classification", "name": "Mean precision", "value": 0.8226950352179467}, {"type": "classification", "name": "Mean sensitivity", "value": 0.8226950352179467}, {"type": "classification", "name": "G-mean", "value": 0.8077637458073943}, {"type": "classification", "name": "ROC AUC", "value": 0.8226950354609929}, {"type": "classification", "name": "F1 score", "value": 0.6666666666666666}, {"type": "performance", "name": "inferencetime_mean", "value": 0.0004580688799999995}, {"type": "performance", "name": "inferencetime_std", "value": 3.5112323437014854e-05}, {"type": "performance", "name": "inferencetime_median", "value": 0.0004764399999999981}, {"type": "renode_stats", "name": "instructions_per_inference_pass", "value": 0}, {"type": "renode_stats", "name": "top_10_opcodes_per_inference_pass", "value": []}], "scenarioPath": ".kenning/run_2025_03_24_15_53_46/automl_conf_0.yml", "modelName": "automl_conf_0"}, {"metrics": [{"type": "classification", "name": "Accuracy", "value": 0.96}, {"type": "classification", "name": "Mean precision", "value": 0.8226950352179467}, {"type": "classification", "name": "Mean sensitivity", "value": 0.8226950352179467}, {"type": "classification", "name": "G-mean", "value": 0.8077637458073943}, {"type": "classification", "name": "ROC AUC", "value": 0.8226950354609929}, {"type": "classification", "name": "F1 score", "value": 0.6666666666666666}, {"type": "performance", "name": "inferencetime_mean", "value": 0.0004470634800000014}, {"type": "performance", "name": "inferencetime_std", "value": 3.5930895177961004e-05}, {"type": "performance", "name": "inferencetime_median", "value": 0.00047612}, {"type": "renode_stats", "name": "instructions_per_inference_pass", "value": 0}, {"type": "renode_stats", "name": "top_10_opcodes_per_inference_pass", "value": []}], "scenarioPath": ".kenning/run_2025_03_24_15_53_46/automl_conf_1.yml", "modelName": "automl_conf_1"}, {"metrics": [{"type": "classification", "name": "Accuracy", "value": 0.956}, {"type": "classification", "name": "Mean precision", "value": 0.808716706771552}, {"type": "classification", "name": "Mean sensitivity", "value": 0.7893617019068356}, {"type": "classification", "name": "G-mean", "value": 0.7663119744181957}, {"type": "classification", "name": "ROC AUC", "value": 0.7893617021276595}, {"type": "classification", "name": "F1 score", "value": 0.6206896551724138}, {"type": "performance", "name": "inferencetime_mean", "value": 0.0011583102400000002}, {"type": "performance", "name": "inferencetime_std", "value": 1.8745891687044773e-05}, {"type": "performance", "name": "inferencetime_median", "value": 0.0011644000000000099}, {"type": "renode_stats", "name": "instructions_per_inference_pass", "value": 0}, {"type": "renode_stats", "name": "top_10_opcodes_per_inference_pass", "value": []}], "scenarioPath": ".kenning/run_2025_03_24_15_53_46/automl_conf_3.yml", "modelName": "automl_conf_3"}, {"metrics": [{"type": "classification", "name": "Accuracy", "value": 0.952}, {"type": "classification", "name": "Mean precision", "value": 0.7929243749456958}, {"type": "classification", "name": "Mean sensitivity", "value": 0.7560283685957245}, {"type": "classification", "name": "G-mean", "value": 0.7224858581540777}, {"type": "classification", "name": "ROC AUC", "value": 0.7560283687943262}, {"type": "classification", "name": "F1 score", "value": 0.5714285714285714}, {"type": "performance", "name": "inferencetime_mean", "value": 0.0010298693599999989}, {"type": "performance", "name": "inferencetime_std", "value": 9.404667287599007e-06}, {"type": "performance", "name": "inferencetime_median", "value": 0.0010334549999999887}, {"type": "renode_stats", "name": "instructions_per_inference_pass", "value": 0}, {"type": "renode_stats", "name": "top_10_opcodes_per_inference_pass", "value": []}], "scenarioPath": ".kenning/run_2025_03_24_15_53_46/automl_conf_4.yml", "modelName": "automl_conf_4"}]""")

    out_scenario = Path("/tmp/scenario.json")
    out_scenario.unlink(missing_ok=True)
    shutil.copyfile(scenario_path, out_scenario)
