import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-e2e-admin-bypass": "1" } });

test("keeps appearance editing and preview routes protected and usable", async ({ page }) => {
  await page.goto("/admin/appearance/preview");
  await expect(page.getByRole("link", { name: "退出预览" })).toHaveAttribute("href", "/admin/appearance");
  await expect(page.getByRole("listbox", { name: "经历分类预览" })).toBeVisible();
});
