import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 15000,
        teardownTimeout: 3000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            exclude: ['node_modules', 'tests'],
        },
    },
});
