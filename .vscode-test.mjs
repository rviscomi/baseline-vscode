import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    version: '1.100.0',
    files: 'out/test/**/*.test.js',
    mocha: {
        ui: 'tdd',
        color: true
    }
});
