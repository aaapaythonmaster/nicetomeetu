import { expect, test } from "@playwright/test";

test("renders the public portfolio when no database revision is published", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "张昕蕊" })).toBeVisible();
  await expect(page.getByRole("region", { name: "实习经历轮播" })).toBeVisible();
});
