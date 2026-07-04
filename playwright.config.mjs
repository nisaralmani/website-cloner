import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3099";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
  },
  reporter: process.env.CI ? [["list"]] : [["list"]],
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npx next start -p 3099",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ...process.env,
          DATABASE_PATH: process.env.DATABASE_PATH ?? "./data/bybelt.db",
          SESSION_SECRET: process.env.SESSION_SECRET ?? "ci-smoke-secret",
          SMOKE_BYPASS_AUTH: "0",
        },
      },
});
