#!/bin/bash

set -e

pip install ./test/mock_kenning

source ./test/prepare_mock_kzr.sh

yarn run compile && yarn run compile-tests

UI_TEST_RETRIES=3

for ((i = 0 ; i <= UI_TEST_RETRIES ; i++ )); do
    if [[ $i -eq $UI_TEST_RETRIES ]]; then
	echo "Failed ${UI_TEST_RETIRES} times. Exiting..."
	exit 1
    fi

    set +e
    xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' yarn run ui-test
    [[ $? -eq 0 ]] && break
    set -e

    echo "Retrying..."
    sleep 3
done
