# Copyright (c) 2025 Analog Devices, Inc.
# Copyright (c) 2025 Antmicro <www.antmicro.com>
#
# SPDX-License-Identifier: Apache-2.0


rm -rf /tmp/vscode-mock-kenning-zephyr-runtime-example-app/
mkdir -p /tmp/vscode-mock-kenning-zephyr-runtime-example-app/{kenning-zephyr-runtime,zephyr,.west}

export PYRENODE_RUNTIME=mono
export PYRENODE_PKG=/dev/null
export ZEPHYR_SDK_PATH=/dev/null
