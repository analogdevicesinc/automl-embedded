#!/bin/bash

# Copyright (c) 2025 Analog Devices, Inc.
# Copyright (c) 2025 Antmicro <www.antmicro.com>
#
# SPDX-License-Identifier: Apache-2.0


yarn install
yarn eslint --max-warnings 0 src ./vite.config.ts ./eslint.config.mjs resources
