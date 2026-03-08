import globals from "globals";
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [".vscode-test/**", "node_modules/**", "out/**"]
    },
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts"],
    languageOptions: {
        globals: {
            ...globals.commonjs,
            ...globals.node,
            ...globals.mocha,
            ...globals.browser,
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "off"
    },
    });