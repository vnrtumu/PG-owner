import { defineConfig } from "@playwright/test";
process.loadEnvFile(".env");
if (process.env.DEMO_MODE !== "true") throw new Error("E2E tests require the isolated demo database.");
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  reporter: "list",
});
