import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-e2e-admin-bypass": "1" } });

test("renders the desktop appearance editor and full-screen preview", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/admin/appearance");
  await expect(page.getByRole("heading", { name: "调整两层动效和经历滚轮" })).toBeVisible();
  await expect(page.getByText("Live preview")).toBeVisible();

  await page.goto("/admin/appearance/preview");
  await expect(page.getByRole("heading", { name: /把复杂流程/ })).toBeVisible();
  await expect(page.getByRole("listbox", { name: "经历分类预览" })).toBeVisible();
  await expect(page.getByRole("option", { name: "实习经历" })).toHaveAttribute("aria-selected", "true");
  expect(errors).toEqual([]);
});
