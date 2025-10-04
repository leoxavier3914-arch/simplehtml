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

describe("autoTemplateGenerator business info detection", () => {
  it("reuses phone and email fields across multiple links and exposes them in the business tab", () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <title>Contato</title>
  </head>
  <body>
    <section>
      <a href="tel:+5511999999999">(+55) 11 99999-9999</a>
      <a href="tel:+5511999999999">(+55) 11 99999-9999</a>
      <a href="mailto:contato@example.com">contato@example.com</a>
      <a href="mailto:contato@example.com?subject=Duvida">contato@example.com</a>
    </section>
  </body>
</html>`;

    const files: TemplateFile[] = [{ path: "index.html", contents: html }];
    const result = autoGenerateTemplate("Contato", files);

    const processedHtml = result.files.find((file) => file.path === "index.html")?.contents ?? "";
    const telMatches = processedHtml.match(/tel:\{\{business\.phone\}\}/g) ?? [];
    const mailMatches = processedHtml.match(/mailto:\{\{business\.email\}\}/g) ?? [];

    expect(telMatches).toHaveLength(2);
    expect(mailMatches).toHaveLength(2);
    expect(processedHtml).toContain("{{business.phone}}");
    expect(processedHtml).toContain("{{business.email}}");

    const businessConfig = (result.config.business ?? {}) as Record<string, unknown>;
    expect(businessConfig.phone).toBe("(+55) 11 99999-9999");
    expect(businessConfig.email).toBe("contato@example.com");

    const businessTab = result.schema.tabs.find((tab) => tab.id === "auto-business");
    expect(businessTab).toBeDefined();
    const businessKeys = businessTab?.groups.flatMap((group) => group.fields.map((field) => field.key)) ?? [];
    expect(businessKeys).toContain("business.phone");
    expect(businessKeys).toContain("business.email");
  });
});
