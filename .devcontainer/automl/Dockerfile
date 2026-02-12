FROM ghcr.io/antmicro/kenning-zephyr-runtime@sha256:dc7a23a99b5b0fd51196c74b95984965761cef30b6e4469b0153ee3522cc3030

ARG KENNING_ZEPHYR_RUNTIME_VERSION=082c4c5d77dd770ca99433d93355210ddc220b39

# Ensure ZEPHYR_VERSION matches the one specified in the west.yml file.
ARG ZEPHYR_VERSION=b9bfff29f4bf99ecb19dd2078bd06447e279cfcf

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
