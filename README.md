# AutoML plugin for embedded platforms

Copyright (c) 2025 [Analog Devices, Inc.](https://www.analog.com/en/index.html)

Copyright (c) 2025 [Antmicro](https://www.antmicro.com)

VSCode Extension for training, optimizing and deploying tailored models on Edge platforms using AutoML and Neural Architecture Search techniques with the [Kenning ML framework](https://github.com/antmicro/kenning).

## Features

* Loads datasets from files for anomaly detection tasks in CSV format
* Accepts a target platform on which the model will be deployed
* Accepts a target runtime which will be used to evaluate the model
* Accepts application size to make sure the model will fit along with the rest of the application on the target platform
* Automatically trains the models, trying to find the right training parameters and model architecture using AutoML and Neural Architecture Search algorithms
* Optimizes, compiles and deploys models on target hardware
* Evaluates the model, either in simulation or on target hardware
* Provides detailed performance and quality analysis of generated models

## Demo

Video below demonstrates AutoML training, followed by evaluation of generated models on [MAX78002 Evaluation Kit](https://www.analog.com/en/resources/evaluation-hardware-and-software/evaluation-boards-kits/max78002evkit.html) and overview of the generated AutoML summary report.

[![Watch the video](https://github.com/user-attachments/assets/c0a1100c-be29-4109-bc01-c2246af5d2d3)](https://github.com/user-attachments/assets/c0a1100c-be29-4109-bc01-c2246af5d2d3)

## Plugin requirements

* Visual Studio Code
* [Kenning](https://github.com/antmicro/kenning) for training, optimizing and deploying models on hardware
* [Kenning Zephyr Runtime](https://github.com/antmicro/kenning-zephyr-runtime) for running created models on Zephyr RTOS on target platform.
  It is needed for model evaluation, either in simulation or on hardware.
* [Yarn](https://classic.yarnpkg.com/en/) for building the plugin
* (optional) [Renode](https://renode.io) for simulating the target platform
* (optional) [Maxim Microcontrollers SDK (MSDK)](https://github.com/analogdevicesinc/msdk) for flashing Analog Devices platforms, such as MAX32690 or MAX78002
* (optional) Prepared [ai8x-training](https://github.com/analogdevicesinc/ai8x-training) and [ai8x-synthesis](https://github.com/analogdevicesinc/ai8x-synthesis) projects to use the MAX78002 CNN accelerator

### Setting up a Development Container

The easiest way to set up the environment for application and AutoML development is to develop inside a container using [Visual Studio Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers).

Sample Docker image definition can be found in [Example project using Kenning Zephyr Runtime](https://github.com/antmicro/kenning-zephyr-runtime-example-app), under [environments/Dockerfile](https://github.com/antmicro/kenning-zephyr-runtime-example-app/blob/main/environments/Dockerfile).

The Dev Container definition can be found in [.devcontainer/automl/devcontainer.json](https://github.com/antmicro/kenning-zephyr-runtime-example-app/blob/main/.devcontainer/automl/devcontainer.json) (VSCode Dev Container configuration).

To start the Dev Container, click the `Reopen in Container` button from the pop-up or run the `DevContainers: Reopen in Container` action.

![Reopen in container](./images/reopen_container.png)

This will automatically build the image defined by Dockerfile and reopen the working directory inside the container, including all necessary software for the plugin.

### Setting up a local environment

For local development, the following tools are needed:

* [Kenning Zephyr Runtime dependencies](https://github.com/antmicro/kenning-zephyr-runtime/) - follow instructions in the README ([Building the project](https://github.com/antmicro/kenning-zephyr-runtime/?tab=readme-ov-file#building-the-project)) to install all dependencies.
* [Kenning](https://github.com/antmicro/kenning) - the minimal Kenning setup needed for the plugin can be installed using e.g. `pipx` (this method requires separate [dts2repl](https://github.com/antmicro/dts2repl) installation as executable):
  ```bash
  pipx install --force "kenning[tvm,torch,anomaly_detection,auto_pytorch,tensorflow,tflite,reports,renode,uart] @ git+https://github.com/antmicro/kenning.git"
  pipx install "dts2repl @ git+https://github.com/antmicro/dts2repl@main#egg=dts2repl"
  ```
  Another way is to set up a virtual environment with Kenning and Kenning Zephyr Runtime that will be accessible to VSCode.
* [Renode](https://renode.readthedocs.io/en/latest/introduction/installing.html) - follow instructions.
  Later, configure one of the listed environment variables in [pyrenode3 tool](https://github.com/antmicro/pyrenode3) to point to Renode installation path (build directory, package or Renode binary).

**NOTE:** Kenning supports Python 3.10 or 3.11.
In case of different Python versions available in the system, use e.g. [pyenv](https://github.com/pyenv/pyenv) to create an environment with Python 3.11 or use additional options with `pipx` installation: `--python 3.11 --fetch-missing-python`.

#### Prepare ai8x repositories

**NOTE:** The steps below are required only for deploying models on MAX78002 using the AI8X runtime running on the CNN accelerator.

In order to generate sources running models on the CNN accelerator for the MAX78002 platform, [ai8x-training](https://github.com/analogdevicesinc/ai8x-training) and [ai8x-synthesis](https://github.com/analogdevicesinc/ai8x-synthesis) repositories with their dependencies (in the `.venv` virtual environments) need to be downloaded.
Moreover, paths to the repositories have to be assigned to the `AI8X_TRAINING_PATH` and `AI8X_SYNTHESIS_PATH` environment variables.
Alternatively, paths to both repositories can be passed in the VSCode plugin settings.

For [ai8x-training](https://github.com/analogdevicesinc/ai8x-training), the repository can be prepared in the following way:

```bash
git clone --recurse-submodules https://github.com/analogdevicesinc/ai8x-training.git
cd ai8x-training
python3 -m venv .venv
source .venv/bin/activate
pip3 install --upgrade pip
pip3 install -r requirements.txt
export AI8X_TRAINING_PATH=$(pwd)
```

Similar steps need to be applied for [ai8x-synthesis](https://github.com/analogdevicesinc/ai8x-synthesis):

```bash
git clone https://github.com/analogdevicesinc/ai8x-synthesis.git
cd ai8x-synthesis
python3 -m venv .venv
source .venv/bin/activate
pip3 install --upgrade pip
pip3 install -r requirements.txt
export AI8X_SYNTHESIS_PATH=$(pwd)
```

## Using the plugin - example Zephyr project

The plugin is originally meant for Zephyr applications.
The easiest way to integrate generated models is to use Kenning Zephyr Runtime.

A sample application working with this plugin can be found in the [kenning-zephyr-runtime-example-app repository](https://github.com/antmicro/kenning-zephyr-runtime-example-app).

### Project and environment preparations

First, clone the repository:

```bash
mkdir workspace && cd workspace
git clone https://github.com/antmicro/kenning-zephyr-runtime-example-app.git
cd kenning-zephyr-runtime-example-app/
```

Then, open the project in VSCode:

```
code .
```

Assuming the Dev Container Extension is installed in VSCode, the previously mentioned popup with the `Reopen in Container` button should appear. Accept and wait for the Dev Container to configure.

Once the Dev Container is ready, install the VSCode Extension in the Dev Container.

After plugin installation, open Terminal in VSCode (it will use the environment from the Dev Container) and run the following commands in the root project directory:

```
west init -l app
west update
west zephyr-export
```

It will fetch Zephyr, Kenning Zephyr Runtime and other dependencies for the application.
The fetched Kenning Zephyr Runtime repository will be used by the plugin to build an evaluation app for testing models before deployment on hardware.

### Setting up the plugin

The plugin introduces a few configuration options that can be found in Settings (`File->Preferences->Settings`) under the `Extensions->Kenning Edge AutoML` section:
* **Kenning Zephyr Runtime Path** - has to point to a valid directory with Kenning Zephyr Runtime (e.g. `/workspaces/kenning-zephyr-runtime-example-app/kenning-zephyr-runtime/` assuming `kenning-zephyr-runtime-example-app` is opened as a working directory in a Dev Container)
* **Number Of Output Models** - maximal number of model candidates to include in the final evaluation
* **Kenning Scenario Path** (optional) - path to a base [Kenning scenario](https://antmicro.github.io/kenning/json-scenarios.html), the default one is defined as `DEFAULT_BASE_SCENARIO` in [AutoML scenario template](src/kenning/autoMLScenarioTemplate.ts).
* **Zephyr SDK Path** (optional) - path to the [Zephyr SDK](https://docs.zephyrproject.org/latest/develop/toolchains/zephyr_sdk.html) directory, can also be passed with the `$ZEPHYR_SDK_PATH` environmental variable.
* **Use CUDA** - indicates whether the GPU will be used to train models.
* **PyRenode Path** (optional) - path to the Renode package or binary, can also be configured with the `PYRENODE_PKG` or `PYRENODE_BIN` environmental variables.
  Check [pyrenode3 project](https://github.com/antmicro/pyrenode3) for available variables and options.
  Renode packages are available at [builds.renode.io](https://builds.renode.io).
* **UART Path** (optional) - path to the board's UART used for communication between Kenning and Kenning Zephyr Runtime.
* **OpenOCD Path** (optional) - path to the OpenOCD binary from [MaximMicrosSDK](https://github.com/analogdevicesinc/msdk), required for evaluation on Analog Devices hardware, can also be provided via `$PATH`.
* **ai8x-training** (optional) - location of the [ai8x-training](https://github.com/analogdevicesinc/ai8x-training) repository, required for the `ai8x` runtime on the MAX78002 board.
* **ai8x-synthesis** (optional) - location of the [ai8x-synthesis](https://github.com/analogdevicesinc/ai8x-synthesis) repository, required for the `ai8x` runtime on the MAX78002 board.

![Plugin settings](./images/plugin_settings.png)

### Running AutoML tasks

Running an AutoML flow can be summarized in a few simple steps:

* Click on the AutoML icon (K in the leftmost sidebar)

  ![Run AutoML panel](./images/run_automl.png)

* Choose the AutoML task configuration:
  * In `Dataset path`, set path or link to a dataset - e.g. `https://dl.antmicro.com/kenning/datasets/anomaly_detection/cats_nano.csv`
  * Select `Platform` from the dropdown list - e.g. `MAX32690 Evaluation Kit`
  * Select `Runtime` from the dropdown list - e.g. `TFLite`
  * In `Time limit`, set a time limit for the AutoML part of the run (in minutes)
  * Define `Application size` - e.g. 80 KB
  * Choose `Evaluate models in simulation` to run evaluation on the board simulated with Renode, instead of the real one
  * (Optional) In `Selected model path` set target path where the selected model should be saved (e.g. `/workspaces/kenning-zephyr-runtime-example-app/model.tflite` in Dev Container environment)

* To run AutoML, click `Run AutoML Optimization`
* A successful execution finishes with `Kenning process exited with code 0`

  ![Finished AutoML flow](./images/plugin_automl_logs.png)

Once the AutoML process finishes successfully, a new report should appear in `REPORTS`:

![Plugin reports view](./images/plugin_reports.png)

The view with reports follows the structure:
* ![session-icon](./images/session-icon.png) `run_` represents a single AutoML session
  * The scale button ![scale-icon](./images/scale-icon.png) opens a summary report for a given run
  * Under the `run_` entry, the ![model-icon](./images/model-icon.png) `automl_conf_` entities represent individual models
    * The floppy disk button ![save-icon](./images/save-icon.png) saves the model in the path specified in `Selected model path` or asks to provide a new one, if the input field is empty
    * The file button ![file-code-icon](./images/file-code-icon.png) opens configuration for a given model
    * Each model contains a summary of its metrics calculated on a training set

### Building the application with selected model

Once the preferred model is picked, it can be used in the final application.
With Kenning Zephyr Runtime, the path to the model can be provided using the `-DCONFIG_KENNING_MODEL_PATH` parameter when running `west build`, e.g.:

```bash
west build \
  -p always \
  -b max32690evkit/max32690/m4 app -- \
  -DEXTRA_CONF_FILE="tflite.conf" \
  -DCONFIG_KENNING_MODEL_PATH=\"/workspaces/kenning-zephyr-runtime-example-app/model.tflite\"
```

Where `/workspaces/kenning-zephyr-runtime-example-app/model.tflite` is a path to the model selected in the AutoML plugin.

In the example project used here, in [.vscode/tasks.json](.vscode/tasks.json) there are the following tasks:

* `Build Zephyr app` - builds the application implemented in the project with the selected model,
* `Simulate app in Renode` - simulates the built application.

To flash the actual board, follow the flashing instructions for the specific board.

## Adjusting AutoML scenarios

To provide a custom scenario with an altered configuration, the plugin provides the **Kenning Scenario Path** setting.
It accept JSON or YAML files with a Kenning scenario describing the AutoML flow.

Examples of AutoML scenarios:

* [AutoML flow for the MAX32690 Evaluation Kit for anomaly detection (VAE model)](https://github.com/antmicro/kenning/blob/main/scripts/configs/automl-scenario.yml)
* [AutoML flow for the MAX78002 Evaluation Kit for anomaly detection/classification (CNN model)](https://github.com/antmicro/kenning/blob/main/scripts/configs/automl-cnn-scenario.yml)

For more details on creating Kenning scenarios and investigating available classes, follow:

* [Anomaly detection model training and deployment on the MAX32690 Evaluation Kit](https://antmicro.github.io/kenning/gallery/anomaly-detection-on-mcu.html)
* [Generating anomaly detection models for the MAX32690 Evaluation Kit with AutoML](https://antmicro.github.io/kenning/gallery/anomaly-detection-automl.html)
* [Defining optimization pipelines in Kenning](https://antmicro.github.io/kenning/json-scenarios.html)

## Preparing the dataset for the plugin

The expected columns and structure of the CSV file passed as anomaly detection dataset can be found in [Kenning documentation on deploying anomaly detection models](https://antmicro.github.io/kenning/gallery/anomaly-detection-on-mcu.html#specification-of-the-kenning-datasets-anomaly-detection-dataset-module).
To add support for different datasets, follow [Kenning block development guidelines](https://antmicro.github.io/kenning/kenning-development.html) and [Dataset API](https://antmicro.github.io/kenning/kenning-api.html#dataset-api).

## Defining models and search space for AutoML flows

AutoML model definitions used by this plugin are:

* [PyTorchAnomalyDetectionVAE](https://github.com/antmicro/kenning/blob/main/kenning/modelwrappers/anomaly_detection/vae.py) - used for TensorFlow Lite and microTVM runtimes
* [Ai8xAnomalyDetectionCNN](https://github.com/antmicro/kenning/blob/main/kenning/modelwrappers/anomaly_detection/ai8x_cnn.py) - used for convolutional neural networks that can be deployed on MAX78002's CNN Accelerator

To create custom models that can be configured and modified by the AutoML flow, follow the [Adjusting ModelWrapper for AutoML flow](https://antmicro.github.io/kenning/kenning-development.html#adjusting-modelwrapper-for-automl-flow) chapter in [Kenning documentation](https://antmicro.github.io/kenning/index.html).

## Building the plugin

To build a VSIX package containing the plugin, first you need to install `yarn` - follow [Yarn installation](https://classic.yarnpkg.com/lang/en/docs/install) instructions for your system.
Once `yarn` is installed, run the following commands:

```bash
# Install dependencies
yarn install
# Prepare package with plugin
yarn vsix-package
```

The plugin should be available under `automl-embedded-0.0.1.vsix`.
In order to install it, go to Extensions, click `Install from VSIX...` and choose the newly built package.

![Install plugin from VSIX package](./images/install_vsix.png)

