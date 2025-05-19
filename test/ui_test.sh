#!/bin/bash

# Copyright (c) 2025 Analog Devices, Inc.
# Copyright (c) 2025 Antmicro <www.antmicro.com>
#
# SPDX-License-Identifier: Apache-2.0


set -e

pip install ./test/mock_kenning

source ./test/prepare_mock_kzr.sh

yarn run compile && yarn run compile-tests

UI_TEST_RETRIES=3

_PYTHONPATH=$PYTHONPATH
if [[ -n "$VIRTUAL_ENV" ]]; then
    _PYTHONPATH="$VIRTUAL_ENV/lib/python3.11/site-packages:$PYTHONPATH"
fi

for ((i = 0 ; i <= UI_TEST_RETRIES ; i++ )); do
    if [[ $i -eq $UI_TEST_RETRIES ]]; then
        echo "Failed ${UI_TEST_RETIRES} times. Exiting..."
        exit 1
    fi

    set +e
    PYTHONPATH=$_PYTHONPATH xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' yarn run ui-test
    [[ $? -eq 0 ]] && break
    set -e

    echo "Retrying..."
    sleep 3
done
