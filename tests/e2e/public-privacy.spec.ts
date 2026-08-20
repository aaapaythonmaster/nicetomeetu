import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-e2e-public-fixture": "1" } });

test("keeps private contact and hidden content out of the public site", async ({ page }) => {
  await page.goto("/projects?entry=1");
  await expect(page.getByText("13800000000")).toHaveCount(0);
  await expect(page.getByText("不公开内容")).toHaveCount(0);
});

