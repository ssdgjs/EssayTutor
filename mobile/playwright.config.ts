import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        },
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        launchOptions: {
          executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        },
      },
    },
  ],
  webServer: {
    command: 'npx expo start --web --offline',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
