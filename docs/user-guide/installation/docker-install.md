---
description: Docker-based installation of AutoML
author: Analog Devices
date: 2025-07-08
---

# Docker-based installation (recommended)

!!! warning
    **ARM Processor Compatibility Warning:** The Docker image is designed for x86 architecture only. Apple Silicon (M1/M2/M3) processors will encounter critical issues due to lack of vector extension emulation support. TensorFlow and PyTorch training will fail on ARM-based Macs. For ARM processors, use the [Native Linux Installation](linux-install.md) method.

## Prerequisites

System Requirements:

- x86-64 Linux system
- Docker installed and running
- At least 8GB RAM
- 20GB free disk space
- USB ports for hardware connections (optional for hardware evaluation)

## Install Docker

```bash
# Ubuntu/Debian 
sudo apt update 
sudo apt install docker.io docker-compose 
sudo usermod -aG docker $USER 
# Log out and back in for group changes to take effect
```

## Setup Docker environment

### Create the Docker image

Create a Dockerfile with all dependencies:

FROM `ghcr.io/antmicro/kenning-zephyr-runtime:latest`

```bash
# Install Zephyr SDK 
RUN wget -O /tmp/prepare_zephyr_env.sh https://raw.githubusercontent.com/antmicro/kenning-zephyr-runtime/refs/heads/stable/scripts/prepare_zephyr_env.sh && \ 
    chmod +x /tmp/prepare_zephyr_env.sh && \ 
    ZEPHYR_SDK_ONLY=1 ZEPHYR_SDK_PATH=/opt/zephyr-sdk /tmp/prepare_zephyr_env.sh && \ 
    rm /tmp/prepare_zephyr_env.sh 
```

```bash
# Install Zephyr requirements 
RUN wget -O /tmp/requirements.txt https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/refs/heads/main/scripts/requirements-base.txt && \ 
    $PIPINST -r /tmp/requirements.txt && \ 
    wget -O /tmp/requirements.txt https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/refs/heads/main/scripts/requirements-build-test.txt && \ 
    $PIPINST -r /tmp/requirements.txt && \ 
    wget -O /tmp/requirements.txt https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/refs/heads/main/scripts/requirements-run-test.txt && \ 
    $PIPINST -r /tmp/requirements.txt && \ 
    rm /tmp/requirements.txt
```

```bash
# Set Zephyr SDK environment variables 
ENV ZEPHYR_SDK_INSTALL_DIR /opt/zephyr-sdk 
ENV ZEPHYR_SDK_PATH /opt/zephyr-sdk 
```

```bash
# Install Kenning with all required extensions 
RUN $PIPINST "kenning[anomaly_detection,iree,tvm,tensorflow,tflite,torch,reports,renode,uart,auto_pytorch] @ git+https://github.com/antmicro/kenning.git" 
```

```bash
# Install ai8x-training repository 
RUN git clone --recurse-submodules https://github.com/analogdevicesinc/ai8x-training.git && \ 
    python3 -m venv ai8x-training/.venv && \ 
    cd ai8x-training && \ 
    .venv/bin/pip install --no-cache --upgrade pip && \ 
    .venv/bin/pip install --no-cache -r requirements.txt && \ 
    cd - 
```

```bash
# Install ai8x-synthesis repository   
RUN git clone https://github.com/analogdevicesinc/ai8x-synthesis.git && \ 
    python3 -m venv ai8x-synthesis/.venv && \ 
    ai8x-synthesis/.venv/bin/pip install --no-cache --upgrade pip && \ 
    ai8x-synthesis/.venv/bin/pip install --no-cache -r ai8x-synthesis/requirements.txt 
```

```bash
# Set AI8X environment variables 
ENV AI8X_TRAINING_PATH=/ai8x-training 
ENV AI8X_SYNTHESIS_PATH=/ai8x-synthesis 
```

```bash
# Install Maxim SDK (accepts all licenses - not suitable for public distribution) 
RUN wget -O /tmp/MaximMicrosSDK_linux.run https://github.com/analogdevicesinc/msdk/releases/download/v2024_10/MaximMicrosSDK_linux.run && \ 
    chmod +x /tmp/MaximMicrosSDK_linux.run && \ 
    /tmp/MaximMicrosSDK_linux.run install --accept-messages --accept-licenses --confirm-command && \ 
    rm /tmp/MaximMicrosSDK_linux.run 
```

```bash
# Set Maxim SDK environment variables 
ENV PATH "$PATH:/root/MaximSDK/Tools/OpenOCD/" 
ENV MAXIM_SDK /root/MaximSDK 
```  

### Build the Docker image

docker build -t kenning-automl-dev .
  
### Setup VS Code dev container

Create .devcontainer/devcontainer.json:

```bash
{ 
    "name": "AutoML Development", 
    "image": "kenning-automl-dev", 
    "customizations": { 
        "vscode": { 
            "extensions": [ 
                "ms-vscode.vscode-typescript-next", 
                "ms-python.python" 
            ] 
        } 
    }, 
    "runArgs": [ 
        "--privileged", 
        "--device=/dev/ttyACM0", 
        "--device=/dev/ttyUSB0" 
    ], 
    "mounts": [ 
        "source=${localWorkspaceFolder},target=/workspace,type=bind" 
    ], 
    "workspaceFolder": "/workspace" 
} 
```
  
### Configure container for hardware access

For hardware evaluation, run the container with device access:

```bash
docker run --rm -it --privileged \ 
    --device /dev/ttyACM0 \ 
    --device /dev/ttyUSB0 \ 
    -v $(pwd):$(pwd) \ 
    -w $(pwd) \ 
    kenning-automl-dev 
```
