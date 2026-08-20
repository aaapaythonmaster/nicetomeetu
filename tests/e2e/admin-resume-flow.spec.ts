import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-e2e-admin-bypass": "1" } });

test("previews a draft with the same public resume components", async ({ page }) => {
  await page.goto("/admin/preview/product-manager");
  await expect(page.getByText("草稿预览 · 不会影响公开主页")).toBeVisible();
  await expect(page.getByRole("heading", { name: "实习经历" })).toBeVisible();
  await expect(page.getByRole("listbox", { name: "简历经历分类" })).toBeVisible();
  await expect(page.getByText("13800000000")).toHaveCount(0);
  await page.getByRole("link", { name: "查看实习经历详情" }).click();
  await expect(page).toHaveURL(/\/admin\/preview\/product-manager\/internships$/);
  await expect(page.getByText("草稿详情预览 · 不会影响公开主页")).toBeVisible();
  await expect(page.getByRole("link", { name: "← 返回草稿预览" })).toBeVisible();
});
