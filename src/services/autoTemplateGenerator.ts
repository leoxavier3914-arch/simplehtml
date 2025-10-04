import type { TemplateFile } from "@/core/template";
import type { SchemaField, SchemaGroup, TemplateSchema } from "@/types/schema";
import { setValue } from "@/utils/objectPaths";

interface AutoTemplateResult {
  schema: TemplateSchema;
  config: Record<string, unknown>;
  files: TemplateFile[];
}

const TEXT_LABELS: Record<string, string> = {
  h1: "Título",
  h2: "Subtítulo",
  h3: "Título de seção",
  h4: "Título",
  h5: "Título",
  h6: "Título",
  p: "Parágrafo",
  span: "Texto",
  strong: "Texto em destaque",
  em: "Texto em destaque",
  button: "Texto do botão",
  a: "Texto do link",
  li: "Item de lista",
  label: "Rótulo",
};

const SKIP_TEXT_PARENTS = new Set(["script", "style", "noscript", "template"]);

const URL_SKIP_PREFIXES = ["javascript:"];

export function autoGenerateTemplate(
  templateLabel: string,
  originalFiles: TemplateFile[],
): AutoTemplateResult {
  if (typeof DOMParser === "undefined") {
    return fallbackGeneration(templateLabel, originalFiles);
  }

  const defaults: Record<string, unknown> = {};
  const groups: SchemaGroup[] = [];
  const processedFiles: TemplateFile[] = [];
  let hasFields = false;

  originalFiles.forEach((file) => {
    if (!isHtmlFile(file.path)) {
      processedFiles.push({ ...file });
      return;
    }

    const baseKey = `auto.${sanitizeKey(file.path)}`;
    const result = transformHtmlFile(file.contents, baseKey, defaults);

    processedFiles.push({ path: file.path, contents: result.contents });

    if (result.fields.length > 0) {
      hasFields = true;
      groups.push({
        id: `auto-${sanitizeKey(file.path)}`,
        label: displayLabelForFile(file.path),
        description: "Campos identificados automaticamente a partir do HTML.",
        fields: result.fields,
      });
    }
  });

  if (!hasFields) {
    return fallbackGeneration(templateLabel, originalFiles);
  }

  const schema: TemplateSchema = {
    version: 1,
    templateName: deriveTemplateName(templateLabel),
    tabs: [
      {
        id: "auto-content",
        label: "Conteúdo",
        groups,
      },
    ],
  };

  return { schema, config: defaults, files: processedFiles };
}

function transformHtmlFile(
  contents: string,
  baseKey: string,
  defaults: Record<string, unknown>,
): { contents: string; fields: SchemaField[] } {
  const parser = new DOMParser();
  const trimmed = contents.trim();
  const isFragment = !/<html[\s>]/i.test(trimmed);
  const htmlToParse = isFragment ? `<body>${contents}</body>` : contents;
  const doc = parser.parseFromString(htmlToParse, "text/html");

  if (!doc || doc.querySelector("parsererror")) {
    return { contents, fields: [] };
  }

  const root: Element | null = isFragment ? doc.body : doc.documentElement;
  if (!root) {
    return { contents, fields: [] };
  }

  const fields: SchemaField[] = [];

  // Meta tags first (SEO)
  const metaElements = Array.from(doc.querySelectorAll("meta[name][content]"));
  metaElements.forEach((meta) => {
    const name = meta.getAttribute("name");
    const content = meta.getAttribute("content");
    if (!name || !content) return;
    const value = content.trim();
    if (!value || value.includes("{{")) return;

    const key = `${baseKey}.meta.${sanitizeKey(name)}`;
    const field: SchemaField = {
      key,
      label: `Meta: ${formatLabel(name)}`,
      type: value.length > 120 ? "textarea" : "text",
      defaultValue: value,
      helperText: "Conteúdo da tag <meta>",
    };

    fields.push(field);
    setValue(key, defaults, value);
    meta.setAttribute("content", `{{${key}}}`);
  });

  // Text nodes
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  let textIndex = 0;

  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    if (!parent) {
      current = walker.nextNode();
      continue;
    }

    const tagName = parent.tagName.toLowerCase();
    if (SKIP_TEXT_PARENTS.has(tagName)) {
      current = walker.nextNode();
      continue;
    }

    const rawText = node.textContent ?? "";
    const value = rawText.trim();
    if (!value) {
      current = walker.nextNode();
      continue;
    }

    if (value.includes("{{")) {
      current = walker.nextNode();
      continue;
    }

    textIndex += 1;
    const key = `${baseKey}.text${textIndex}`;
    const field: SchemaField = {
      key,
      label: labelForText(tagName, textIndex, value),
      type: chooseTextFieldType(tagName, value),
      defaultValue: value,
      helperText: `Elemento <${tagName}>`,
    };

    fields.push(field);
    setValue(key, defaults, value);

    const leading = rawText.match(/^\s*/)?.[0] ?? "";
    const trailing = rawText.match(/\s*$/)?.[0] ?? "";
    node.textContent = `${leading}{{${key}}}${trailing}`;

    current = walker.nextNode();
  }

  // Image sources
  const imageElements = Array.from(root.querySelectorAll("img[src]"));
  let imageIndex = 0;
  imageElements.forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;
    const value = src.trim();
    if (!value || value.includes("{{")) return;

    imageIndex += 1;
    const key = `${baseKey}.image${imageIndex}`;
    const alt = img.getAttribute("alt")?.trim();
    const field: SchemaField = {
      key,
      label: alt ? `Imagem (${truncateLabel(alt)})` : `Imagem ${imageIndex}`,
      type: "image",
      defaultValue: value,
      helperText: alt ? `Atributo alt: ${alt}` : "Atributo src da imagem",
    };

    fields.push(field);
    setValue(key, defaults, value);
    img.setAttribute("src", `{{${key}}}`);
  });

  // Links
  const linkElements = Array.from(root.querySelectorAll("a[href]"));
  let linkIndex = 0;
  linkElements.forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href) return;
    const value = href.trim();
    if (!value || value.includes("{{")) return;
    if (URL_SKIP_PREFIXES.some((prefix) => value.toLowerCase().startsWith(prefix))) return;

    linkIndex += 1;
    const key = `${baseKey}.link${linkIndex}`;
    const field: SchemaField = {
      key,
      label: `Link ${linkIndex}`,
      type: "url",
      defaultValue: value,
      helperText: anchor.textContent?.trim() ? `Texto: ${truncateLabel(anchor.textContent.trim())}` : undefined,
    };

    fields.push(field);
    setValue(key, defaults, value);
    anchor.setAttribute("href", `{{${key}}}`);
  });

  let serialized: string;
  if (isFragment) {
    serialized = root.innerHTML;
  } else {
    const doctype = formatDoctype(doc.doctype);
    const html = doc.documentElement?.outerHTML ?? contents;
    serialized = doctype ? `${doctype}\n${html}` : html;
  }

  return { contents: serialized, fields };
}

function fallbackGeneration(templateLabel: string, originalFiles: TemplateFile[]): AutoTemplateResult {
  const defaults: Record<string, unknown> = {};
  const groups: SchemaGroup[] = [];
  const processedFiles: TemplateFile[] = originalFiles.map((file) => {
    if (!isHtmlFile(file.path)) {
      return { ...file };
    }

    const baseKey = `auto.${sanitizeKey(file.path)}.raw`;
    setValue(baseKey, defaults, file.contents);

    groups.push({
      id: `auto-${sanitizeKey(file.path)}-raw`,
      label: displayLabelForFile(file.path),
      description: "Edição direta do conteúdo HTML (fallback)",
      fields: [
        {
          key: baseKey,
          label: `HTML (${file.path})`,
          type: "textarea",
          defaultValue: file.contents,
        },
      ],
    });

    return { path: file.path, contents: `{{${baseKey}}}` };
  });

  const schema: TemplateSchema = {
    version: 1,
    templateName: deriveTemplateName(templateLabel),
    tabs: [
      {
        id: "auto-content",
        label: "Conteúdo",
        groups,
      },
    ],
  };

  return { schema, config: defaults, files: processedFiles };
}

function labelForText(tag: string, index: number, value: string): string {
  const base = TEXT_LABELS[tag] ?? "Texto";
  const suffix = truncateLabel(value);
  if (!suffix) {
    return `${base} ${index}`;
  }
  return `${base} ${index} (${suffix})`;
}

function chooseTextFieldType(tag: string, value: string): SchemaField["type"] {
  if (tag === "textarea" || tag === "pre") {
    return "textarea";
  }

  if (value.length > 120 || value.includes("\n")) {
    return "textarea";
  }

  return "text";
}

function truncateLabel(value: string, maxLength = 40): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function deriveTemplateName(label: string): string {
  const base = label.split(/[\\/]/).filter(Boolean).pop() ?? "Landing Page";
  const clean = base.replace(/\.[^/.]+$/, "");
  const words = clean
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return words.length > 0 ? words.join(" ") : "Landing Page";
}

function displayLabelForFile(path: string): string {
  return `Arquivo: ${path}`;
}

function sanitizeKey(value: string): string {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "arquivo";
}

function isHtmlFile(path: string): boolean {
  return /\.(html?|xhtml)$/i.test(path);
}

function formatDoctype(doctype: DocumentType | null): string {
  if (!doctype) {
    return "";
  }
  const publicId = doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "";
  const systemId = doctype.systemId ? (doctype.publicId ? ` "${doctype.systemId}"` : ` SYSTEM "${doctype.systemId}"`) : "";
  return `<!DOCTYPE ${doctype.name}${publicId}${systemId}>`;
}

function formatLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
