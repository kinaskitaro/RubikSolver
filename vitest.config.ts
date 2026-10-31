import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom', // headless DOM for React tests
    setupFiles: './src/setupTests.ts',
    // The solver's one-time initSolver() table build (~1.3s) plus v8 coverage
    // instrumentation can push the first solveCube call past the default 5s, so
    // give real-computation tests room to breathe. Fast tests stay well under it.
    testTimeout: 30000,
  },
})
