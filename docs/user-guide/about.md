---
description: General introduction and concepts for AutoML
author: Analog Devices
date: 2025-07-08
---

# General introduction

AutoML for embedded development is a Visual Studio Code (VS Code) extension designed to make machine learning (ML) model development for embedded devices fast, accessible, and hardware-optimized. With a focus on ADI platforms such as the MAX78002 and MAX32690, this extension automates the complex process of selecting, training, and deploying ML models so you can focus on your application, not the intricacies of ML.

## Key value

 AutoML (Automated Machine Learning) automatically explores a wide range of model architectures and training parameters, finding the best solution for your dataset and your device’s constraints. This is especially important for embedded systems where memory, compute, and power are limited, and where leveraging hardware accelerators (like the CNN accelerator on MAX78002) can make a huge difference in performance and efficiency.

## What is AutoML?

AutoML is a technology that automates the end-to-end process of applying machine learning to real-world problems. Instead of requiring deep ML expertise, AutoML lets you:

- Automatically search for the best model architectures and hyperparameters for your data and hardware.
- Optimize models to fit within strict memory and compute budgets typical of embedded devices.
- Deploy models that are ready to run efficiently on your target hardware, including specialized accelerators when available.

With AutoML, embedded and firmware engineers can build high-quality, hardware-optimized ML solutions without needing to become machine learning experts.

## Hardware acceleration with ADI platforms

The AutoML extension is designed to fully exploit the unique hardware features of ADI’s embedded platforms:

- MAX78002: Features a dedicated Convolutional Neural Network (CNN) accelerator. AutoML can generate and optimize models that are compatible with this accelerator, using the AI8X toolchain for maximum inference speed and efficiency.
- MAX32690: Based on an Arm Cortex-M4 with FPU, the MAX32690 does not have a dedicated DSP or ML accelerator. AutoML ensures that generated models fit within the device’s memory and compute constraints and are optimized for efficient execution on the Cortex-M4 core.

By targeting these hardware features, AutoML delivers models that are accurate, fast, and energy-efficient.

## How does the AutoML for embedded extension work?

The AutoML extension provides a graphical interface in VS Code where you can:

1. Select your dataset (example: a CSV file for anomaly detection or classification).
2. Choose your target platform (such as MAX78002 or MAX32690).
3. Set constraints (like maximum application size or inference time).
4. Run AutoML: The extension automatically searches for the best model and training configuration, optimizes it for your hardware, and prepares it for deployment.
5. Review results: Get detailed reports on model performance, size, and speed. Select the best model for your needs.
6. Deploy: Integrate the selected model into your embedded application, ready to run on real hardware or in simulation.

## Under the hood: the Kenning framework

While the AutoML extension provides a user-friendly experience, it is powered by the open-source Kenning framework. Kenning handles:

- Model training and optimization
- Hardware-aware deployment flows
- Integration with popular ML libraries (TensorFlow, PyTorch, etc.)
- Support for simulation (example: Renode) and real hardware evaluation

Kenning’s modular architecture ensures that AutoML can adapt to new hardware, new ML tasks, and evolving deployment needs.

## Typical workflow example

1. Prepare your dataset (example: time-series data for anomaly detection).
2. Configure an AutoML task in the VS Code extension: select your platform, runtime, and constraints.
3. Run AutoML: The extension searches for the best model, trains and evaluates candidates, and ensures compatibility with your hardware.
4. Review and select a model based on accuracy, size, and speed.
5. Deploy the model to your device, leveraging hardware accelerators (such as the CNN accelerator on MAX78002) for optimal performance.
