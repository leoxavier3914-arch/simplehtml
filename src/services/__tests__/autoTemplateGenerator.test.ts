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

describe("autoTemplateGenerator color extraction", () => {
  it("replaces fixed colors in CSS and inline styles with placeholders", () => {
    const css = `.button {
  color: #ff0000;
  background: linear-gradient(90deg, #ffffff, #000000);
  border-color: rgba(0, 0, 0, 0.5);
}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Landing</title>
  </head>
  <body>
    <div id="hero" class="banner" style="color: #123456; background: linear-gradient(45deg, #abcdef, #fedcba);">
      <h1>Bem-vindo</h1>
    </div>
  </body>
</html>`;

    const files: TemplateFile[] = [
      { path: "styles.css", contents: css },
      { path: "index.html", contents: html },
    ];

    const result = autoGenerateTemplate("Landing", files);

    const stylesTab = result.schema.tabs.find((tab) => tab.id === "auto-styles");
    expect(stylesTab).toBeDefined();

    const styleFields = stylesTab?.groups.flatMap((group) => group.fields) ?? [];
    const expectedKeys = [
      "auto.styles.colors.button_color",
      "auto.styles.colors.button_background",
      "auto.styles.colors.button_border_color",
      "auto.index.colors.div_id_hero_class_banner_color",
      "auto.index.colors.div_id_hero_class_banner_background",
    ];

    expectedKeys.forEach((key) => {
      expect(styleFields.map((field) => field.key)).toContain(key);
      expect(result.config[key]).toBeDefined();
    });

    const gradientField = styleFields.find(
      (field) => field.key === "auto.styles.colors.button_background",
    );
    expect(gradientField?.type).toBe("text");

    const inlineGradientField = styleFields.find(
      (field) => field.key === "auto.index.colors.div_id_hero_class_banner_background",
    );
    expect(inlineGradientField?.type).toBe("text");

    const cssFile = result.files.find((file) => file.path === "styles.css");
    expect(cssFile?.contents).toContain("color: {{auto.styles.colors.button_color}}");
    expect(cssFile?.contents).toContain("background: {{auto.styles.colors.button_background}}");
    expect(cssFile?.contents).toContain("border-color: {{auto.styles.colors.button_border_color}}");

    const htmlFile = result.files.find((file) => file.path === "index.html");
    const htmlContents = htmlFile?.contents ?? "";
    expect(htmlContents).toContain("color: {{auto.index.colors.div_id_hero_class_banner_color}}");
    expect(htmlContents).toContain(
      "background: {{auto.index.colors.div_id_hero_class_banner_background}}",
    );

    expect(result.config["auto.styles.colors.button_color"]).toBe("#ff0000");
    expect(result.config["auto.styles.colors.button_background"]).toBe(
      "linear-gradient(90deg, #ffffff, #000000)",
    );
    expect(result.config["auto.styles.colors.button_border_color"]).toBe(
      "rgba(0, 0, 0, 0.5)",
    );
    expect(result.config["auto.index.colors.div_id_hero_class_banner_color"]).toBe("#123456");
    expect(result.config["auto.index.colors.div_id_hero_class_banner_background"]).toBe(
      "linear-gradient(45deg, #abcdef, #fedcba)",
    );
  });
});
