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

  it("creates separate tabs for generic section labels across different files", () => {
    const buildHtml = (text: string) => `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Landing</title>
  </head>
  <body>
    <section>
      <p>${text}</p>
    </section>
  </body>
</html>`;

    const files: TemplateFile[] = [
      { path: "primeiro.html", contents: buildHtml("Primeiro arquivo") },
      { path: "segundo.html", contents: buildHtml("Segundo arquivo") },
    ];

    const result = autoGenerateTemplate("Landing", files);

    const tabIds = result.schema.tabs.map((tab) => tab.id);
    expect(tabIds).toContain("auto-se_o_1-primeiro");
    expect(tabIds).toContain("auto-se_o_1-segundo");

    const genericTabs = result.schema.tabs.filter((tab) =>
      tab.id.startsWith("auto-se_o_1-"),
    );
    expect(genericTabs).toHaveLength(2);
    expect(genericTabs.map((tab) => tab.label)).toEqual(
      expect.arrayContaining([
        "Seção 1 · Primeiro",
        "Seção 1 · Segundo",
      ]),
    );
  });
});

describe("autoTemplateGenerator color extraction", () => {
  it("replaces fixed colors in CSS and inline styles with placeholders", () => {
    const css = `.button {
  color: #ff0000;
  background: linear-gradient(90deg, #ffffff, #000000);
  border-color: rgba(0, 0, 0, 0.5);
  background-image: url("/assets/hero-bg.png");
}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Landing</title>
  </head>
  <body>
    <div id="hero" class="banner" style="color: #123456; background: linear-gradient(45deg, #abcdef, #fedcba); background-image: url('hero-inline.png');">
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

    const cssAssetField = styleFields.find(
      (field) => field.type === "image" && field.defaultValue === "/assets/hero-bg.png",
    );
    expect(cssAssetField).toBeDefined();
    expect(result.config[cssAssetField!.key]).toBe("/assets/hero-bg.png");
    expect(cssFile?.contents).toContain(`url("{{${cssAssetField!.key}}}")`);

    const inlineAssetField = styleFields.find(
      (field) => field.type === "image" && field.defaultValue === "hero-inline.png",
    );
    expect(inlineAssetField).toBeDefined();
    expect(result.config[inlineAssetField!.key]).toBe("hero-inline.png");
    expect(htmlContents).toContain(`background-image: url('{{${inlineAssetField!.key}}}')`);

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

describe("autoTemplateGenerator assets and forms", () => {
  it("detects image variants and background attributes", () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Landing</title>
  </head>
  <body>
    <section class="hero" data-background="hero-bg.jpg">
      <img src="hero.jpg" alt="Imagem principal" srcset="hero@2x.jpg 2x" data-src="hero-lazy.jpg" />
    </section>
  </body>
</html>`;

    const files: TemplateFile[] = [{ path: "index.html", contents: html }];
    const result = autoGenerateTemplate("Landing", files);

    const allFields = result.schema.tabs.flatMap((tab) =>
      tab.groups.flatMap((group) => group.fields),
    );

    const mainImageField = allFields.find(
      (field) => field.type === "image" && field.defaultValue === "hero.jpg",
    );
    expect(mainImageField).toBeDefined();
    expect(result.config[mainImageField!.key]).toBe("hero.jpg");

    const altField = allFields.find(
      (field) => field.helperText?.includes("Texto alternativo") && field.defaultValue === "Imagem principal",
    );
    expect(altField).toBeDefined();
    expect(result.config[altField!.key]).toBe("Imagem principal");

    const srcsetField = allFields.find(
      (field) => field.helperText?.includes("Atributo srcset"),
    );
    expect(srcsetField).toBeDefined();
    expect(result.config[srcsetField!.key]).toBe("hero@2x.jpg 2x");

    const dataSrcField = allFields.find(
      (field) => field.helperText?.includes("Atributo data-src"),
    );
    expect(dataSrcField).toBeDefined();
    expect(result.config[dataSrcField!.key]).toBe("hero-lazy.jpg");

    const backgroundField = allFields.find(
      (field) => field.helperText?.includes("Atributo data-background"),
    );
    expect(backgroundField).toBeDefined();
    expect(result.config[backgroundField!.key]).toBe("hero-bg.jpg");

    const htmlFile = result.files.find((file) => file.path === "index.html");
    const htmlContents = htmlFile?.contents ?? "";
    expect(htmlContents).toContain(`src="{{${mainImageField!.key}}}`);
    expect(htmlContents).toContain(`alt="{{${altField!.key}}}`);
    expect(htmlContents).toContain(`srcset="{{${srcsetField!.key}}}`);
    expect(htmlContents).toContain(`data-src="{{${dataSrcField!.key}}}`);
    expect(htmlContents).toContain(`data-background="{{${backgroundField!.key}}}`);
  });

  it("extracts form placeholders and button texts", () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Landing</title>
  </head>
  <body>
    <form>
      <label for="email">E-mail</label>
      <input id="email" name="email" type="email" placeholder="Seu e-mail" value="usuario@exemplo.com" />
      <input type="submit" value="Quero receber" />
    </form>
  </body>
</html>`;

    const files: TemplateFile[] = [{ path: "index.html", contents: html }];
    const result = autoGenerateTemplate("Landing", files);

    const allFields = result.schema.tabs.flatMap((tab) =>
      tab.groups.flatMap((group) => group.fields),
    );

    const placeholderField = allFields.find(
      (field) => field.helperText?.includes("Placeholder") && field.defaultValue === "Seu e-mail",
    );
    expect(placeholderField).toBeDefined();
    expect(result.config[placeholderField!.key]).toBe("Seu e-mail");

    const buttonField = allFields.find(
      (field) => field.helperText?.includes("Texto do botão"),
    );
    expect(buttonField).toBeDefined();
    expect(result.config[buttonField!.key]).toBe("Quero receber");

    const valueField = allFields.find(
      (field) => field.helperText?.includes("Valor padrão") && field.defaultValue === "usuario@exemplo.com",
    );
    expect(valueField).toBeDefined();
    expect(result.config[valueField!.key]).toBe("usuario@exemplo.com");

    const htmlFile = result.files.find((file) => file.path === "index.html");
    const htmlContents = htmlFile?.contents ?? "";
    expect(htmlContents).toContain(`placeholder="{{${placeholderField!.key}}}`);
    expect(htmlContents).toContain(`value="{{${buttonField!.key}}}`);
    expect(htmlContents).toContain(`value="{{${valueField!.key}}}`);
  });
});
