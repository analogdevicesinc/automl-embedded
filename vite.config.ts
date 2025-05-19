/**
 * Copyright (c) 2025 Analog Devices, Inc.
 * Copyright (c) 2025 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */


import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import browserify from "browserify";

const outDir = "out";
const webviewScript = path.join("configuration", "resources", "main");

const browserifyPlugin = {
    name: "browserify",
    apply: "build",
    writeBundle() {
        const srcPath = path.join(__dirname, outDir, `${webviewScript}.cjs`);
        const dstPath = path.join(__dirname, outDir, `${webviewScript}.js`);
        const b = browserify();
        b.add(srcPath);
        b.bundle().pipe(fs.createWriteStream(dstPath));
    },
};

const extensionConfig = {
    plugins: [
        tsconfigPaths({ projects: ["./tsconfig.json"] }),
        browserifyPlugin,
    ],
    build: {
        lib: {
            entry: "src",
            formats: ["cjs"],
            fileName: "automl-extension",
        },
        rollupOptions: {
            input: {
                extension: "src/extension.ts",
                [webviewScript]: `${path.join("src", webviewScript)}.ts`,
            },
            output: {
                dir: outDir,
                format: "cjs",
                preserveModules: true,
                preserveModulesRoot: "src",
                entryFileNames: "[name].cjs",
                chunkFileNames: "[name].cjs",
                assetFileNames: "[name].[ext]",
                exports: "named",
            },
            external: [
                "vscode",
                "fs",
                "path",
                "node:child_process",
                "glob",
                "js-yaml",
                "@vscode-elements/elements-lite",
                /node_modules/,
            ],
            watch: {
                exclude: ["node_modules/**"],
                include: ["src/**/*"],
                clearScreen: false,
                chokidar: {
                    usePolling: true,
                    interval: 1000,
                },
                skipWrite: false,
            },
        },
        sourcemap: true,
        emptyOutDir: true,
        minify: false,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", "..."],
    },
};


export default defineConfig(({ mode }) => {
    if (mode === "extension") {
        return extensionConfig;
    }

    return {};
});
