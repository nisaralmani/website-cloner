import { test, expect } from "@playwright/test";

const email = process.env.E2E_LOGIN_EMAIL ?? "contact@fashionpara.com";
const password =
  process.env.E2E_LOGIN_PASSWORD ?? process.env.SEED_USER_PASSWORD ?? "fashionsis-dev";

test.describe.configure({ mode: "serial" });

async function signIn(page) {
  await page.goto("/initiate/login");
  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await page.getByRole("button", { name: "Sign in to Dashboard" }).click();
  await expect(page).not.toHaveURL(/\/initiate\/login/, { timeout: 20_000 });
}

test("login page renders", async ({ page }) => {
  await page.goto("/initiate/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in to Dashboard" })).toBeVisible();
});

test("unauthenticated settings redirects to login", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/initiate\/login/);
});

test("login reaches authenticated app shell with seeded workspace", async ({ page }) => {
  await signIn(page);
  // On localhost, `/` rewrites to marketing — use an app route for the inbox shell.
  await page.goto("/agent");
  await expect(page.getByRole("button", { name: /FashionSis/i })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: "AI Agent", exact: true })).toBeVisible();
});

test("settings overview loads after authentication", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings");
  await expect(page.getByText("Settings", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Invite your team")).toBeVisible();
  await expect(page.getByRole("button", { name: /FashionSis/i })).toBeVisible();
});
