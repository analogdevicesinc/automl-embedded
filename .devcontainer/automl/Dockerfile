FROM ghcr.io/antmicro/kenning-zephyr-runtime@sha256:6a1966f02dc9e76ab984062c7fb50792ae89bcee6b79fe8f9569bb5b45514f28

ARG KENNING_ZEPHYR_RUNTIME_VERSION=69a0a51022b9e299085d28f123a8a60c78f0ec10

# Ensure ZEPHYR_VERSION matches the one specified in the west.yml file.
ARG ZEPHYR_VERSION=732a3a5c66553969ea01bacec19e2820b9d6b2e2

# Ensure ZEPHYR_SDK_VERSION is compatible with the ZEPHYR_VERSION.
# For more information, see https://github.com/zephyrproject-rtos/sdk-ng/wiki/Zephyr-Version-Compatibility#zephyr-sdk-version-compatibility-matrix
ARG ZEPHYR_SDK_VERSION=0.17.0
ARG ZEPHYR_SDK_ARCHIVE=zephyr-sdk-${ZEPHYR_SDK_VERSION}_linux-x86_64_minimal.tar.xz
ARG ZEPHYR_SDK_PATH=/opt/zephyr-sdk

#Install Zephyr SDK
RUN mkdir -p $(dirname ${ZEPHYR_SDK_PATH}) && \
    wget -O /tmp/${ZEPHYR_SDK_ARCHIVE} "https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v${ZEPHYR_SDK_VERSION}/${ZEPHYR_SDK_ARCHIVE}" && \
    tar xvf /tmp/${ZEPHYR_SDK_ARCHIVE} && \
    mv ./zephyr-sdk-${ZEPHYR_SDK_VERSION} ${ZEPHYR_SDK_PATH} && \
    ${ZEPHYR_SDK_PATH}/setup.sh -t x86_64-zephyr-elf && \
    ${ZEPHYR_SDK_PATH}/setup.sh -t arm-zephyr-eabi && \
    ${ZEPHYR_SDK_PATH}/setup.sh -t riscv64-zephyr-elf && \
    ${ZEPHYR_SDK_PATH}/setup.sh -h && \
    ${ZEPHYR_SDK_PATH}/setup.sh -c && \
    rm /tmp/${ZEPHYR_SDK_ARCHIVE}

# Install Python dependencies for Zephyr and Kenning Zephyr Runtime
RUN wget -O /tmp/requirements.txt https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/${ZEPHYR_VERSION}/scripts/requirements-base.txt && \
    $PIPINST -r /tmp/requirements.txt && \
    wget -O /tmp/requirements.txt https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/${ZEPHYR_VERSION}/scripts/requirements-build-test.txt && \
    $PIPINST -r /tmp/requirements.txt && \
    wget -O /tmp/requirements.txt https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/${ZEPHYR_VERSION}/scripts/requirements-run-test.txt && \
    $PIPINST -r /tmp/requirements.txt && \
    wget -O /tmp/requirements.txt https://raw.githubusercontent.com/antmicro/kenning-zephyr-runtime/${KENNING_ZEPHYR_RUNTIME_VERSION}/requirements.txt && \
    $PIPINST -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

ENV ZEPHYR_SDK_INSTALL_DIR=$ZEPHYR_SDK_PATH
ENV ZEPHYR_SDK_PATH=$ZEPHYR_SDK_PATH
