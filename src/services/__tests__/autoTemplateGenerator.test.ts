import { describe, expect, it } from "vitest";
import type { TemplateFile } from "@/core/template";
import { autoGenerateTemplate } from "@/services/autoTemplateGenerator";

describe("autoTemplateGenerator navigation deduplication", () => {
  it("merges navigation sections that only differ by classes", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sample</title>
  </head>
  <body>
    <nav class="primary-nav theme-light">
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
      </ul>
    </nav>
    <nav class="primary-nav theme-dark">
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
      </ul>
    </nav>
  </body>
</html>`;

    const files: TemplateFile[] = [{ path: "index.html", contents: html }];
    const result = autoGenerateTemplate("Sample", files);

    const navigationTab = result.schema.tabs.find((tab) => tab.id === "auto-navigation");
    expect(navigationTab).toBeDefined();

    const navigationGroups = navigationTab?.groups ?? [];
    expect(navigationGroups).toHaveLength(1);
    expect(navigationGroups[0]?.fields.length).toBeGreaterThan(0);
  });
});
