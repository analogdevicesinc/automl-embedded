#!/bin/bash

yarn install
yarn eslint --max-warnings 0 src ./vite.config.ts ./eslint.config.mjs resources
