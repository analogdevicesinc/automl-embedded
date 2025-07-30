---
description: General introduction and concepts for AutoML
author: Analog Devices
date: 2025-07-08
---

# Using the AutoML extension in Visual Studio Code

This how-to guide explains how to use the Analog Devices AutoML extension for Visual Studio Code to automate training, optimization, and deployment of machine learning models for embedded platforms such as MAX32690 and MAX78002.

## Prerequisites

- Visual Studio Code installed
- Project folder open (example: a Zephyr-based application)
- Docker and dev container support (if applicable)
- Internet access to download datasets or tools

### Launch the extension

1. Open Visual Studio Code and your project folder.
2. If using a dev container, reopen the project in the container.
3. Click the AutoML icon (**K** symbol) in the left sidebar to open the extension panel.

### Configure an AutoML task

Within the AutoML panel, fill in the experiment form:

- **Dataset Path**: Path or URL to a CSV dataset.
  - [Example dataset](https://dl.antmicro.com/kenning/datasets/anomaly_detection/cats_nano.csv)
- **Platform**: Select target platform (example: MAX32690 Evaluation Kit).
- **Runtime**: Choose model runtime (example: TFLite, AI8X).
- **Time Limit**: Set maximum search duration in minutes.
- **Application Size**: Define memory size constraint (in KB).
- **Evaluate in Simulation**: Toggle to use Renode instead of real hardware.
- **Selected Model Path** (optional): Output path for trained model.
  - Example: /workspaces/kenning-zephyr-runtime-example-app/model.tflite

### Run AutoML optimization

Click **Run AutoML Optimization** to start the process. The extension:

- Loads your dataset
- Searches for optimal models using NAS and AutoML
- Trains and evaluates candidates
- Optimizes and compiles for your selected target
- Evaluates results (in simulation or hardware)

A message appears after the run is complete.

### Review and select models

After completion, view the report in the REPORTS section:

- Each run appears as a run_entry
- Expand to see candidate models
- For each model:
  - View Metrics: Accuracy, F1, inference time, etc.
  - Save Model: Click floppy disk icon
  - View Config: Click file icon

## Integrate the model into your application

1. Save the model to a known path.
2. For Zephyr projects using Kenning Zephyr Runtime, build with:

   ```bash
   west build \ 
     -p always \ 
     -b max32690evkit/max32690/m4 app -- \ 
     -DEXTRA_CONF_FILE="tflite.conf" \ 
     -DCONFIG_KENNING_MODEL_PATH="/workspaces/kenning-zephyr-runtime-example-app/model.tflite" 
   ```

3. Optionally use VS Code tasks (example: Build Zephyr app).

### Simulate or flash to hardware

- Simulation: Run the **Simulate app in Renode** task.
- Flashing: Use the **Flash app to hardware** task or manual board instructions.
- Monitoring: Use a terminal (example: picocom -b 115200 /dev/ttyUSB0).

## Extension parameters and CLI integration

### Extension parameters

| Field              | Description                                 |
|--------------------|---------------------------------------------|
| Dataset Path       | CSV file path or URL                        |
| Platform           | Target hardware (example: MAX32690)            |
| Runtime            | TFLite, AI8X, etc.                          |
| Time Limit         | Duration of the AutoML search in minutes     |
| Application Size   | Memory constraint for the embedded target    |
| Evaluate Models    | Enables simulation through Renode                |
| Selected Model Path| Output path for exported model               |

### VS Code tasks (customizable)

- Build Zephyr App
- Simulate in Renode
- Flash to Hardware

## What Is AutoML for Embedded?

AutoML for Embedded is a VS Code extension that simplifies the creation of optimized ML models for constrained edge devices. Built on [Kenning](https://github.com/antmicro/kenning), it automates:

- Dataset preprocessing
- Model architecture search (NAS)
- Hyperparameter tuning
- Deployment and evaluation (hardware or simulation)

Designed for Analog Devices targets like MAX32690 and MAX78002, the extension accelerates development workflows for embedded ML.

## Customize AutoML workflows

### Custom scenarios

1. Prepare a custom scenario file (YAML or JSON) defining model specs, datasets, and training options.
2. In the extension settings, set the **Kenning Scenario Path** to your file.
3. Refer to [Kenning](https://github.com/antmicro/kenning) documentation for schema details.

### Dataset preparation

- Use CSV format with appropriate columns for your task (example: timestamps, sensor values).
- Follow [Kenning dataset](https://github.com/antmicro/kenning#datasets) guidelines.

### Model and search space customization

The extension supports:

- Built-in models (example: PyTorchAnomalyDetectionVAE, Ai8xAnomalyDetectionCNN)
- Custom models with ModelWrapper class in Kenning

To modify the search space:

- Adjust the configuration in the scenario file
- Implement and register new model classes as needed

## Troubleshooting

If errors occur, check:

- Extension settings (paths to Kenning, ai8x-training, ai8x-synthesis)
- Docker container status (if applicable)
- Dataset formatting and accessibility
- Device connection and permissions

If issues persist, review logs or consult the extension [GitHub repository](https://github.com/analogdevicesinc).
