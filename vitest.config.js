import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.js: unit tests cover plain modules and don't
// need the React plugin. Pinning TZ makes date helpers behave like production.
process.env.TZ = 'Europe/Stockholm';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
  },
});
