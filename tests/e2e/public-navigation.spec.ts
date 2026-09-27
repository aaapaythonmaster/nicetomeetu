import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-e2e-public-fixture": "1" } });

test("keeps the homepage columns visually open without a center divider", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main section").first()).toHaveCSS("border-right-width", "0px");
});

test("navigates from homepage summaries to shareable detail selections", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");

  await expect(page.getByRole("option", { name: "实习经历" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "实习经历" })).toBeVisible();

  await page.getByRole("option", { name: "项目经历" }).click();
  await expect(page.getByRole("heading", { name: "项目经历" })).toBeVisible();
  await page.getByRole("link", { name: /查看项目经历/ }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.getByRole("option", { name: "流程重构" }).click();
  await expect(page).toHaveURL(/\/projects\?entry=1$/);
  await expect(page.getByRole("heading", { name: "流程重构项目" })).toBeVisible();
  await expect(page.getByText("不公开内容")).toHaveCount(0);
  await expect(page.getByText("13800000000")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("keeps all four fixed categories and their detail routes available", async ({ page }) => {
  await page.goto("/");
  const categories = [
    ["实习经历", "/internships"],
    ["项目经历", "/projects"],
    ["校园经历", "/campus"],
    ["技能", "/skills"],
  ] as const;

  for (const [label, route] of categories) {
    await page.getByRole("option", { name: label }).click();
    await expect(page.getByRole("heading", { name: label })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(`查看${label}`) })).toHaveAttribute("href", route);
  }

  for (const [, route] of categories) {
    await page.goto(route);
    await expect(page.getByRole("link", { name: "← 返回首页" })).toBeVisible();
  }

  await page.goto("/projects?entry=1");
  await expect(page.getByRole("heading", { name: "流程重构项目" })).toBeVisible();
});
