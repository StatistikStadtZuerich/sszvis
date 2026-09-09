// @ts-check
const { defineConfig, devices } = require("@playwright/test");

// Kept in sync with test/snapshot/snapshot.spec.js.
const SNAPSHOT_BASE_URL = process.env.SNAPSHOT_BASE_URL || "http://localhost:8000";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: "./test/snapshot",
  snapshotPathTemplate: "./test/snapshot/__snapshot__/{arg}.png",
  outputDir: "./test/snapshot/__results__",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? "null" : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: "http://127.0.0.1:8000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
  },

  /*
   * Writing a baseline must be deliberate. Playwright's default ("missing")
   * silently creates one for any page or button state that has none, so adding
   * a docs example would mint an unreviewed baseline on someone's laptop.
   */
  updateSnapshots: "none",

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    ...(process.env.CI
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },

          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /*
   * Serve the built docs ourselves, so `pnpm run test:snapshot` is one command.
   * Without this the suite needs a docs server in another shell and otherwise
   * fails all 54 pages with ERR_CONNECTION_REFUSED.
   */
  webServer: {
    command: "pnpm --filter @sszvis/docs run serve",
    url: SNAPSHOT_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
