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

  it("extracts form inputs into a dedicated forms tab", () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Form Sample</title>
  </head>
  <body>
    <form id="contact-form" action="/submit" method="post">
      <label for="name">Nome completo</label>
      <input id="name" name="full_name" type="text" placeholder="Seu nome" value="Maria" />

      <label for="email">E-mail</label>
      <input id="email" name="email" type="email" placeholder="email@exemplo.com" />

      <label for="phone">Telefone</label>
      <input id="phone" name="phone" type="tel" value="+55 11 9999-9999" />

      <label for="age">Idade</label>
      <input id="age" name="age" type="number" value="28" />

      <label for="service">Serviço</label>
      <select id="service" name="service">
        <option value="design" selected>Design</option>
        <option value="development">Desenvolvimento</option>
      </select>

      <label for="message">Mensagem</label>
      <textarea id="message" name="message" placeholder="Escreva aqui">Olá!</textarea>

      <label><input type="checkbox" name="newsletter" value="yes" checked /> Quero receber novidades</label>

      <fieldset>
        <legend>Preferência de contato</legend>
        <label><input type="radio" name="contact_pref" value="email" checked /> E-mail</label>
        <label><input type="radio" name="contact_pref" value="phone" /> Telefone</label>
      </fieldset>
    </form>
  </body>
</html>`;

    const files: TemplateFile[] = [{ path: "index.html", contents: html }];
    const result = autoGenerateTemplate("Sample", files);

    const formsTab = result.schema.tabs.find((tab) => tab.id === "auto-forms");
    expect(formsTab).toBeDefined();

    const formGroups = formsTab?.groups ?? [];
    expect(formGroups).toHaveLength(1);

    const fields = formGroups[0]?.fields ?? [];
    expect(fields).toHaveLength(8);

    const typeByKey = Object.fromEntries(fields.map((field) => [field.key, field.type]));

    expect(typeByKey["auto.index.forms.contact_form.full_name1"]).toBe("text");
    expect(typeByKey["auto.index.forms.contact_form.email1"]).toBe("email");
    expect(typeByKey["auto.index.forms.contact_form.phone1"]).toBe("tel");
    expect(typeByKey["auto.index.forms.contact_form.age1"]).toBe("number");
    expect(typeByKey["auto.index.forms.contact_form.service1"]).toBe("select");
    expect(typeByKey["auto.index.forms.contact_form.message1"]).toBe("textarea");
    expect(typeByKey["auto.index.forms.contact_form.newsletter1"]).toBe("checkbox");
    expect(typeByKey["auto.index.forms.contact_form.contact_pref1"]).toBe("radio");

    const selectField = fields.find((field) => field.key === "auto.index.forms.contact_form.service1");
    expect(selectField?.options?.map((option) => option.value)).toEqual(["design", "development"]);

    const radioField = fields.find((field) => field.key === "auto.index.forms.contact_form.contact_pref1");
    expect(radioField?.options?.map((option) => option.value)).toEqual(["email", "phone"]);
    expect(radioField?.defaultValue).toBe("email");

    const textField = fields.find((field) => field.key === "auto.index.forms.contact_form.full_name1");
    expect(textField?.placeholder).toBe("Seu nome");

    const processedHtml = result.files.find((file) => file.path === "index.html")?.contents ?? "";
    expect(processedHtml).toContain("action=\"{{auto.index.forms.contact_form.config.action}}\"");
    expect(processedHtml).toContain("method=\"{{auto.index.forms.contact_form.config.method}}\"");
    expect(processedHtml).toContain("value=\"{{auto.index.forms.contact_form.full_name1}}\"");
    expect(processedHtml).toContain("placeholder=\"{{auto.index.forms.contact_form.full_name1Placeholder}}\"");
    expect(processedHtml).toContain("value=\"{{auto.index.forms.contact_form.service1}}\"");
    expect(processedHtml).toContain("checked=\"{{auto.index.forms.contact_form.newsletter1}}\"");
  });
});
