import { expect, test } from "@playwright/test";

test("renders the unpublished state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "个人主页尚未发布" })).toBeVisible();
});
