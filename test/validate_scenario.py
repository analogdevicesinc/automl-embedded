import json
import sys

from pathlib import Path

if len(sys.argv) < 2:
    msg = "Not enough arguments. Expected scenario path."
    raise RuntimeError(msg)

scenario_path = Path(sys.argv[1])
scenario = json.loads(scenario_path.read_text())

platform = scenario["platform"]["parameters"]
runtime_builder = scenario["runtime_builder"]["parameters"]
automl = scenario["automl"]["parameters"]
dataset = scenario["dataset"]["parameters"]

assert platform["name"] == "max32690evkit/max32690/m4"
assert platform["simulated"] is True

assert runtime_builder["workspace"] == "/tmp/vscode-mock-kenning-zephyr-runtime-example-app/kenning-zephyr-runtime"

assert abs(float(automl["time_limit"]) - 2) < 1e-3
assert abs(float(automl["application_size"]) - 75.5) < 1e-3
assert automl["n_best_models"] == 5

assert dataset["csv_file"] == "https://dl.antmicro.com/kenning/datasets/anomaly_detection/cats_nano.csv"
