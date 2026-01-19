import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            include: ['src/**/*.{js,jsx}'],
            exclude: [
                'src/**/*.test.{js,jsx}',
                'src/**/__tests__/**',
                'src/index.js',
                'src/reportWebVitals.js',
                'src/setupTests.js',
                'src/serviceWorkerRegistration.js'
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80
            }
        }
    },
});
