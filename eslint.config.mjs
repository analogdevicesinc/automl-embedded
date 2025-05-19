import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import stylisticPlugin from '@stylistic/eslint-plugin-js'
import jsonPlugin from "@eslint/json";
import jsoncPlugin from "eslint-plugin-jsonc";

import tsParser from "@typescript-eslint/parser";

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        extends: [
            tseslint.configs.recommendedTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "import": importPlugin,
            "unused-imports": unusedImportsPlugin,
            "stylistic": stylisticPlugin,
        },
        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
            curly: "error",
            eqeqeq: "error",
            "no-throw-literal": "error",
            semi: "error",
            "stylistic/indent": ["error", 4, { "outerIIFEBody": 0 }],
            "no-trailing-spaces": "error",
            "comma-dangle": ["error", "always-multiline"],
            "import/order": "error",
            "import/no-duplicates": "error",
            "unused-imports/no-unused-imports": "error",
            '@typescript-eslint/no-unused-vars': 'off',
            "unused-imports/no-unused-vars": ["error", {
                "vars": "all",
                "varsIgnorePattern": "^_",
                "args": "after-used",
                "argsIgnorePattern": "^_",
            }],
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            'stylistic/multiline-comment-style': ["error", "starred-block"]
        }
    },
    {
        files: ["**/*.json"],
        plugins: {
            "jsonc": jsoncPlugin,
            "json": jsonPlugin,
        },
        language: "json/json",
        rules: {
            "jsonc/indent": ["error", 4],
            "jsonc/comma-dangle": ["error", "never"],
            "jsonc/object-curly-spacing": ["error", "never"],
        },
    },
)
