---
description: AutoML user guide
author: Analog Devices
date: 2025-07-08
---
# Native Linux installation

## Prerequisites

Required System Packages:

```bash
# Ubuntu/Debian 
sudo apt update 
sudo apt install -y \ 
    python3.11 python3.11-venv python3.11-dev \ 
    build-essential cmake ninja-build \ 
    git curl wget unzip \ 
    libssl-dev libffi-dev \ 
    pkg-config libhdf5-dev \ 
    pipx 
 
# Set Python 3.11 as default (if multiple versions installed) 
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 
```  

## Component installation

1. Install Kenning Framework:

    ```bash
    # Install via pipx (recommended) 
    pipx install --force "kenning[tvm,torch,anomaly_detection,auto_pytorch,tensorflow,tflite,reports,renode,uart] @ git+https://github.com/antmicro/kenning.git" 
   
    # Install dts2repl separately 
    pipx install "dts2repl @ git+https://github.com/antmicro/dts2repl@main#egg=dts2repl" 
   
    # Verify installation 
    kenning --help 
    ```

2. Install Zephyr SDK and Toolchain:

    ```bash
    # Download and install Zephyr SDK 
    cd ~ 
    wget https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v0.16.4/zephyr-sdk-0.16.4_linux-x86_64.tar.xz 
    tar xvf zephyr-sdk-0.16.4_linux-x86_64.tar.xz 
    cd zephyr-sdk-0.16.4 
    ./setup.sh 
 
    # Set environment variables 
    export ZEPHYR_SDK_INSTALL_DIR=~/zephyr-sdk-0.16.4 
    export ZEPHYR_SDK_PATH=~/zephyr-sdk-0.16.4 
    echo 'export ZEPHYR_SDK_INSTALL_DIR=~/zephyr-sdk-0.16.4' >> ~/.bashrc 
    echo 'export ZEPHYR_SDK_PATH=~/zephyr-sdk-0.16.4' >> ~/.bashrc 
    ```  

3. Install Kenning Zephyr Runtime:

    ```bash
    # Install West (Zephyr build tool) 
    pip3 install --user west 
   
    # Clone and set up Kenning Zephyr Runtime 
    mkdir ~/kenning-workspace && cd ~/kenning-workspace 
    git clone https://github.com/antmicro/kenning-zephyr-runtime.git 
    cd kenning-zephyr-runtime 
   
    # Install Python requirements 
    pip3 install -r requirements.txt 
   
    # Run setup scripts 
    ./scripts/prepare_zephyr_env.sh 
    ./scripts/prepare_modules.sh 
    ```  

4. Install AI8X Repositories (for MAX78002 support):

    ```bash
    cd ~/kenning-workspace 
   
    # Install ai8x-training 
    git clone --recurse-submodules https://github.com/analogdevicesinc/ai8x-training.git 
    cd ai8x-training 
    python3 -m venv .venv 
    source .venv/bin/activate 
    pip install --upgrade pip 
    pip install -r requirements.txt 
    deactivate 
    cd .. 
   
    # Install ai8x-synthesis 
    git clone https://github.com/analogdevicesinc/ai8x-synthesis.git 
    cd ai8x-synthesis 
    python3 -m venv .venv 
    source .venv/bin/activate 
    pip install --upgrade pip 
    pip install -r requirements.txt 
    deactivate 
    cd .. 
   
    # Set environment variables 
    export AI8X_TRAINING_PATH=~/kenning-workspace/ai8x-training 
    export AI8X_SYNTHESIS_PATH=~/kenning-workspace/ai8x-synthesis 
    echo 'export AI8X_TRAINING_PATH=~/kenning-workspace/ai8x-training' >> ~/.bashrc 
    echo 'export AI8X_SYNTHESIS_PATH=~/kenning-workspace/ai8x-synthesis' >> ~/.bashrc 
    ```  

5. Install Maxim SDK:

    ```bash
    # Download Maxim SDK 
    cd /tmp 
    wget https://github.com/analogdevicesinc/msdk/releases/download/v2024_10/MaximMicrosSDK_linux.run 
    chmod +x MaximMicrosSDK_linux.run 
   
    # Install (interactive - requires license acceptance) 
    ./MaximMicrosSDK_linux.run 
   
    # Set environment variables (adjust path as needed) 
    export MAXIM_SDK=~/MaximSDK 
    export PATH="$PATH:~/MaximSDK/Tools/OpenOCD/" 
    echo 'export MAXIM_SDK=~/MaximSDK' >> ~/.bashrc 
    echo 'export PATH="$PATH:~/MaximSDK/Tools/OpenOCD/"' >> ~/.bashrc 
    ```  

6. Install Renode Simulation Framework:

    ```bash
    # Add Renode repository 
    wget -O - https://antmicro.com/projects/renode/renode_1.15.0_amd64.deb > /tmp/renode.deb 
    sudo dpkg -i /tmp/renode.deb 
    sudo apt-get install -f  # Fix dependencies if needed 
 
    # Or install via PyPI 
    pip3 install --user pyrenode3 
 
    # Set environment variable 
    export PYRENODE_PKG=/opt/renode 
    echo 'export PYRENODE_PKG=/opt/renode' >> ~/.bashrc 
    ```  

## Environment variable configuration

Create ~/kenning-workspace/setup_env.sh:

```bash
#!/bin/bash 
# Kenning environment setup script 
 
export ZEPHYR_SDK_INSTALL_DIR=~/zephyr-sdk-0.16.4 
export ZEPHYR_SDK_PATH=~/zephyr-sdk-0.16.4 
export AI8X_TRAINING_PATH=~/kenning-workspace/ai8x-training 
export AI8X_SYNTHESIS_PATH=~/kenning-workspace/ai8x-synthesis 
export MAXIM_SDK=~/MaximSDK 
export PATH="$PATH:~/MaximSDK/Tools/OpenOCD/" 
export PYRENODE_PKG=/opt/renode 
```

echo "Kenning development environment configured"

Make it executable and source it:

```bash
chmod +x ~/kenning-workspace/setup_env.sh
echo 'source ~/kenning-workspace/setup_env.sh' >> ~/.bashrc
source ~/.bashrc 
```

## Verification

Test each component:

```bash
# Test Kenning 
kenning list 
 
# Test Zephyr 
west --version 
 
# Test AI8X paths 
ls $AI8X_TRAINING_PATH 
ls $AI8X_SYNTHESIS_PATH 
 
# Test Maxim SDK 
ls $MAXIM_SDK 

# Test Renode 
renode --version  # or python3 -c "import pyrenode3" 
```  
