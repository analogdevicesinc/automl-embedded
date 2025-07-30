---
description: Install and configure the AutoML Plugin for VS Code
author: Analog Devices
date: 2025-07-08
---
# VS Code Plugin installation and configuration

## Plugin installation

1. Install from Marketplace:

   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "AutoML Plugin for Embedded Platforms"
   - Click Install

2. Required VS Code Extensions: Install these complementary extensions:

- Python
- C/C++
- Dev Containers (if using Docker approach)

## Plugin configuration

1. Open VS Code Settings:

   - File → Preferences → Settings
   - Navigate to Extensions → Kenning Edge AutoML

2. Configure Plugin Settings:

| Setting                   | Value                                 | Description                |
|---------------------------|---------------------------------------|----------------------------|
| Kenning Zephyr Runtime Path | /path/to/kenning-zephyr-runtime/      | Path to KZR directory      |
| Number Of Output Models     | 5                                     | Max models to evaluate     |
| Zephyr SDK Path             | ~/zephyr-sdk-0.16.4                   | Zephyr SDK location        |
| Use CUDA                    | true/false                            | Enable GPU training        |
| PyRenode Path               | /opt/renode                           | Renode installation path   |
| ai8x-training               | ~/kenning-workspace/ai8x-training     | AI8X training repo         |
| ai8x-synthesis              | ~/kenning-workspace/ai8x-synthesis    | AI8X synthesis repo        |
| OpenOCD Path                | ~/MaximSDK/Tools/OpenOCD/             | OpenOCD for flashing       |

## Initial project setup

1. Create or Open Zephyr Project:

    ```bash
    # Example: Clone sample project 
    git clone https://github.com/antmicro/kenning-zephyr-runtime-example-app.git 
    cd kenning-zephyr-runtime-example-app 
    code . 
    ```  

2. Initialize Zephyr Dependencies:

    ```bash
    # In VS Code terminal 
    west init -l app 
    west update 
    west zephyr-export 
    ```  

3. Test Plugin Functionality:

    - Click the AutoML icon (K) in the left sidebar
    - Configure a simple AutoML task:  
        - [Dataset](https://dl.antmicro.com/kenning/datasets/anomaly_detection/cats_nano.csv)
        - Platform: MAX32690 Evaluation Kit
        - Runtime: TFLite
        - Time limit: 3 minutes
        - Application size: 80 KB
    - Click **Run AutoML Optimization**
