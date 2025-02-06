FROM node:20

ENV INST 'apt-get install -y --no-install-recommends'
ENV PIPINST 'python3 -m pip install --no-cache-dir --upgrade'

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && $INST \
    ccache \
    cmake \
    curl \
    device-tree-compiler \
    dfu-util \
    file \
    fonts-lato \
    gcc \
    gcc-multilib \
    git \
    g++-multilib \
    jq \
    libdbus-1-3 \
    libfontconfig \
    libgl1 \
    libgssapi-krb5-2 \
    libhidapi-hidraw0 \
    libhidapi-libusb0 \
    libmagic1 \
    libsdl2-dev \
    libusb-0.1-4 \
    libxcb1 \
    libxcb-glx0 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-randr0 \
    libxcb-render0 \
    libxcb-render-util0 \
    libxcb-shape0 \
    libxcb-shm0 \
    libxcb-sync1 \
    libxcb-util1 \
    libxcb-xfixes0 \
    libxcb-xinerama0 \
    libxcb-xkb1 \
    libxkbcommon0 \
    libxkbcommon-x11-0 \
    make \
    mono-complete \
    ninja-build \
    patch \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-tk \
    python3-venv \
    python3-wheel \
    wget \
    xxd \
    xz-utils \
    && apt-get autoremove && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN rm /usr/lib/python3.11/EXTERNALLY-MANAGED

RUN $PIPINST \
    pip \
    setuptools

RUN $PIPINST \
    "kenning[anomaly_detection,iree,tvm,tensorflow,tflite,torch,reports,renode,uart,auto_pytorch] @ git+https://github.com/antmicro/kenning.git"

RUN mkdir -p /opt/renode && \
    wget -O /opt/renode/renode-latest.pkg.tar.gz https://builds.renode.io/renode-latest.pkg.tar.xz

ENV PYRENODE_PKG /opt/renode/renode-latest.pkg.tar.gz

RUN wget -O /tmp/prepare_zephyr_env.sh https://raw.githubusercontent.com/antmicro/kenning-zephyr-runtime/refs/heads/stable/scripts/prepare_zephyr_env.sh && \
    chmod +x /tmp/prepare_zephyr_env.sh && \
    ZEPHYR_SDK_ONLY=1 ZEPHYR_SDK_PATH=/opt/zephyr-sdk /tmp/prepare_zephyr_env.sh && \
    rm /tmp/prepare_zephyr_env.sh

ENV ZEPHYR_SDK_INSTALL_DIR /opt/zephyr-sdk
ENV ZEPHYR_SDK_PATH /opt/zephyr-sdk
