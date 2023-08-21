import { devices } from '@playwright/test'

export default {
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'line',
  use: {
    baseURL: 'https://dapplets-e2e.netlify.app',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], newHeadless: process.env.CI ? true : false },
    },
  ],
  webServer: [
    {
      command: 'npm run modules',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run modules:server-interaction',
      port: 8081,
      reuseExistingServer: !process.env.CI,
    },
  ],
}
