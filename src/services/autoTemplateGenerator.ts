import type { TemplateFile } from "@/core/template";
import type { SchemaField, SchemaGroup, SchemaTab, TemplateSchema } from "@/types/schema";
import { setValue } from "@/utils/objectPaths";

interface AutoTemplateResult {
  schema: TemplateSchema;
  config: Record<string, unknown>;
  files: TemplateFile[];
}

interface GeneratedTab {
  id: string;
  label: string;
  groups: SchemaGroup[];
  order: number;
}

interface TransformResult {
  contents: string;
  contentTabs: GeneratedTab[];
  seoGroups: SchemaGroup[];
  styleGroups: SchemaGroup[];
  hasFields: boolean;
}

interface CssTransformResult {
  contents: string;
  styleGroups: SchemaGroup[];
  hasFields: boolean;
}

interface TextReplacement {
  start: number;
  end: number;
  replacement: string;
}

interface ColorDetection {
  defaultValue: string;
  type: SchemaField["type"];
  important?: string;
}

interface FieldOwnerContext {
  id: string;
  label: string;
  keyPrefix: string;
  element: Element | null;
  fields: SchemaField[];
  counters: Record<string, number>;
  order: number;
  description?: string;
}

interface SectionContext extends FieldOwnerContext {
  cards: CardContext[];
}

interface CardContext extends FieldOwnerContext {
  parentSectionId: string;
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
  small: "Texto complementar",
  figcaption: "Legenda",
  blockquote: "Citação",
  cite: "Fonte",
  button: "Texto do botão",
  a: "Texto do link",
  li: "Item de lista",
  label: "Rótulo",
  title: "Título da página",
  caption: "Legenda da tabela",
  th: "Cabeçalho da tabela",
  td: "Célula da tabela",
};

const SKIP_TEXT_PARENTS = new Set(["script", "style", "noscript", "template"]);

const URL_SKIP_PREFIXES = ["javascript:"];

const SECTION_SELECTORS = [
  "section",
  "header",
  "footer",
  "main",
  "nav",
  "article",
  "[data-section]",
  "[data-block]",
  "[class*='section']",
  "[class*='hero']",
  "[class*='header']",
  "[class*='footer']",
  "[class*='banner']",
  "[class*='content']",
];

const CARD_KEYWORDS = [
  "card",
  "item",
  "feature",
  "service",
  "box",
  "column",
  "col-",
  "step",
  "benefit",
  "plan",
  "pricing",
  "testimonial",
  "review",
  "faq",
  "team",
  "member",
  "gallery",
  "photo",
  "produto",
  "product",
  "servico",
];

const SECTION_LABEL_HINTS: { pattern: RegExp; label: string }[] = [
  { pattern: /(hero|masthead|banner)/i, label: "Hero" },
  { pattern: /(header|topbar|navbar|menu|nav)/i, label: "Navegação" },
  { pattern: /(footer|rodape|credits)/i, label: "Rodapé" },
  { pattern: /(contact|contato|form)/i, label: "Contato" },
  { pattern: /(about|sobre|historia|company)/i, label: "Sobre" },
  { pattern: /(service|servico|feature|benefit|solucao)/i, label: "Serviços" },
  { pattern: /(product|produto|catalog)/i, label: "Produtos" },
  { pattern: /(faq|pergunta|duvida)/i, label: "FAQ" },
  { pattern: /(testimonial|depoimento|review)/i, label: "Depoimentos" },
  { pattern: /(pricing|plan|preco|assinatura)/i, label: "Planos" },
  { pattern: /(cta|call-to-action)/i, label: "Chamadas" },
  { pattern: /(stats|numero|metric|resultado)/i, label: "Resultados" },
  { pattern: /(gallery|portfolio|galeria)/i, label: "Galeria" },
  { pattern: /(team|equipe|staff)/i, label: "Equipe" },
  { pattern: /(blog|noticia|artigo)/i, label: "Blog" },
];

const SECTION_TAB_HINTS: { pattern: RegExp; key: string; label: string }[] = [
  { pattern: /(cardap|prato|gastronom|restaurante)/i, key: "cardapio", label: "Cardápio" },
  { pattern: /(hero|masthead|banner|destaque)/i, key: "hero", label: "Hero" },
  { pattern: /(header|topbar|navbar|navega|cabec|nav\b)/i, key: "navigation", label: "Navegação" },
  { pattern: /(footer|rodape)/i, key: "footer", label: "Rodapé" },
  { pattern: /(contact|contato|form)/i, key: "contato", label: "Contato" },
  { pattern: /(about|sobre|historia|company)/i, key: "sobre", label: "Sobre" },
  { pattern: /(service|servic|feature|benefit|solucao)/i, key: "servicos", label: "Serviços" },
  { pattern: /(product|produto|catalog)/i, key: "produtos", label: "Produtos" },
  { pattern: /(faq|pergunta|duvida)/i, key: "faq", label: "FAQ" },
  { pattern: /(testimonial|depoimento|review)/i, key: "depoimentos", label: "Depoimentos" },
  { pattern: /(pricing|plan|preco|assinatura)/i, key: "planos", label: "Planos" },
];

const CARD_LABEL_HINTS: { pattern: RegExp; label: string }[] = [
  { pattern: /(card|item|box|bloco)/i, label: "Card" },
  { pattern: /(feature|benefit|solucao)/i, label: "Diferencial" },
  { pattern: /(service|servico)/i, label: "Serviço" },
  { pattern: /(plan|preco|pricing|assinatura)/i, label: "Plano" },
  { pattern: /(testimonial|depoimento|review)/i, label: "Depoimento" },
  { pattern: /(faq|pergunta|duvida)/i, label: "Pergunta" },
  { pattern: /(step|etapa|process)/i, label: "Etapa" },
  { pattern: /(team|member|equipe|colaborador)/i, label: "Integrante" },
  { pattern: /(gallery|photo|imagem|portfolio)/i, label: "Item da galeria" },
  { pattern: /(produto|product)/i, label: "Produto" },
];

const TAG_KEY_PREFIX: Record<string, string> = {
  h1: "title",
  h2: "subtitle",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  p: "paragraph",
  span: "text",
  strong: "highlight",
  em: "highlight",
  small: "text",
  figcaption: "caption",
  blockquote: "blockquote",
  cite: "citation",
  button: "button",
  a: "linkText",
  li: "item",
  label: "label",
  title: "titleTag",
  caption: "tableCaption",
  th: "tableHeader",
  td: "tableCell",
};

export function autoGenerateTemplate(
  templateLabel: string,
  originalFiles: TemplateFile[],
): AutoTemplateResult {
  if (typeof DOMParser === "undefined") {
    return fallbackGeneration(templateLabel, originalFiles);
  }

  const defaults: Record<string, unknown> = {};
  const contentTabMap = new Map<string, GeneratedTab>();
  const seoGroups: SchemaGroup[] = [];
  const styleGroups: SchemaGroup[] = [];
  const processedFiles: TemplateFile[] = [];
  let hasFields = false;

  originalFiles.forEach((file) => {
    if (isCssFile(file.path)) {
      const baseKey = `auto.${sanitizeKey(file.path)}`;
      const result = transformCssFile(file, baseKey, defaults);

      processedFiles.push({ path: file.path, contents: result.contents });

      if (result.hasFields) {
        hasFields = true;
        styleGroups.push(...result.styleGroups);
      }

      return;
    }

    if (!isHtmlFile(file.path)) {
      processedFiles.push({ ...file });
      return;
    }

    const baseKey = `auto.${sanitizeKey(file.path)}`;
    const result = transformHtmlFile(file, baseKey, defaults);

    processedFiles.push({ path: file.path, contents: result.contents });

    if (result.hasFields) {
      hasFields = true;
      result.contentTabs.forEach((tab) => {
        const existing = contentTabMap.get(tab.id);
        if (existing) {
          existing.groups.push(...tab.groups);
          existing.order = Math.min(existing.order, tab.order);
        } else {
          contentTabMap.set(tab.id, { ...tab, groups: [...tab.groups] });
        }
      });
      seoGroups.push(...result.seoGroups);
      styleGroups.push(...result.styleGroups);
    }
  });

  if (!hasFields) {
    return fallbackGeneration(templateLabel, originalFiles);
  }

  const contentTabs = Array.from(contentTabMap.values())
    .map((tab) => ({ ...tab, groups: tab.groups.filter((group) => group.fields.length > 0) }))
    .filter((tab) => tab.groups.length > 0)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "pt-BR"));

  const tabs: SchemaTab[] = [
    ...contentTabs.map((tab) => ({ id: tab.id, label: tab.label, groups: tab.groups })),
  ];

  if (styleGroups.length > 0) {
    tabs.push({
      id: "auto-styles",
      label: "Estilos visuais",
      groups: styleGroups,
    });
  }

  tabs.push(...buildSeoTabs(seoGroups));
  tabs.push(buildIntegrationsTab());

  const schema: TemplateSchema = {
    version: 1,
    templateName: deriveTemplateName(templateLabel),
    tabs,
  };

  return { schema, config: defaults, files: processedFiles };
}

function transformCssFile(
  file: TemplateFile,
  baseKey: string,
  defaults: Record<string, unknown>,
): CssTransformResult {
  const styleKeySet = new Set<string>();
  const variableKeyMap = new Map<string, string>();
  const styleFields: SchemaField[] = [];
  const variablePattern = /(--[a-zA-Z0-9_-]+)(\s*:\s*)(#[0-9a-fA-F]{3,8})\b/g;

  let contents = file.contents.replace(
    variablePattern,
    (match, varName: string, separator: string, colorValue: string) => {
      let fieldKey = variableKeyMap.get(varName);

      if (!fieldKey) {
        const cleanedVar = sanitizeKey(varName.replace(/^--/, ""));
        const uniqueVar = ensureUniqueKey(cleanedVar || "cor", styleKeySet, "cor");
        fieldKey = `${baseKey}.colors.${uniqueVar}`;
        variableKeyMap.set(varName, fieldKey);

        const fieldLabelBase = formatLabel(varName.replace(/^--/, "")) || uniqueVar;
        const field: SchemaField = {
          key: fieldKey,
          label: `Cor ${fieldLabelBase}`,
          type: "color",
          defaultValue: colorValue,
          helperText: `Variável CSS ${varName}`,
        };

        styleFields.push(field);
        setValue(fieldKey, defaults, colorValue);
      }

      return `${varName}${separator}{{${fieldKey}}}`;
    },
  );

  const cssReplacements: TextReplacement[] = [];
  const scanSource = contents;
  const propertyPattern = /([\w-]+)(\s*:\s*)([^;{}]+)(;?)/g;
  let match: RegExpExecArray | null;

  while ((match = propertyPattern.exec(scanSource))) {
    const propertyName = match[1].trim().toLowerCase();
    const rawValueSegment = match[3];
    const valueStart = match.index + match[1].length + match[2].length;
    const valueEnd = valueStart + rawValueSegment.length;

    let handled = false;

    if (isColorProperty(propertyName)) {
      const detection = detectColorValue(propertyName, rawValueSegment);
      if (detection) {
        const selector = extractSelectorForIndex(scanSource, match.index);
        if (!selector) {
          continue;
        }

        const selectorForLabel = selector.split(",")[0]?.trim() ?? selector;
        const keyBase = buildCssColorKeyBase(selectorForLabel, propertyName);
        const uniqueKey = ensureUniqueKey(
          keyBase,
          styleKeySet,
          propertyName.replace(/-+/g, "_") || "cor",
        );
        const fieldKey = `${baseKey}.colors.${uniqueKey}`;

        const field: SchemaField = {
          key: fieldKey,
          label: buildCssColorLabel(selectorForLabel, propertyName, detection.type),
          type: detection.type,
          defaultValue: detection.defaultValue,
          helperText: `Propriedade ${propertyName} no seletor ${selectorForLabel}`,
        };

        styleFields.push(field);
        setValue(fieldKey, defaults, detection.defaultValue);

        const leading = rawValueSegment.match(/^\s*/)?.[0] ?? "";
        const trailing = rawValueSegment.match(/\s*$/)?.[0] ?? "";
        const importantSuffix = detection.important ? ` ${detection.important}` : "";
        const replacement = `${leading}{{${fieldKey}}}${importantSuffix}${trailing}`;

        cssReplacements.push({ start: valueStart, end: valueEnd, replacement });
        handled = true;
      }
    }

    if (handled) {
      continue;
    }

    if (!/url\(/i.test(rawValueSegment)) {
      continue;
    }

    const selector = extractSelectorForIndex(scanSource, match.index);
    if (!selector) {
      continue;
    }

    const selectorForLabel = selector.split(",")[0]?.trim() ?? selector;
    const leading = rawValueSegment.match(/^\s*/)?.[0] ?? "";
    const trailing = rawValueSegment.match(/\s*$/)?.[0] ?? "";
    const coreValue = rawValueSegment.slice(
      leading.length,
      rawValueSegment.length - trailing.length,
    );
    const trimmedCore = coreValue.trim();
    if (!trimmedCore || trimmedCore.includes("{{")) {
      continue;
    }

    const { value: assetValue, important } = splitImportant(trimmedCore);
    const assetPattern = /url\((['"]?)([^)"']+)\1\)/gi;
    let assetMatch: RegExpExecArray | null;
    let lastIndex = 0;
    let rebuilt = "";
    let assetOccurrence = 0;
    let createdField = false;

    while ((assetMatch = assetPattern.exec(assetValue))) {
      const fullMatch = assetMatch[0];
      if (!fullMatch || fullMatch.includes("{{")) {
        continue;
      }

      const quote = assetMatch[1] ?? "";
      const urlValue = assetMatch[2]?.trim() ?? "";
      if (!urlValue || urlValue.startsWith("data:")) {
        continue;
      }

      assetOccurrence += 1;
      const matchStart = assetMatch.index;
      rebuilt += assetValue.slice(lastIndex, matchStart);

      const keyBase = buildCssAssetKeyBase(
        selectorForLabel,
        propertyName,
        assetOccurrence,
        urlValue,
      );
      const uniqueKey = ensureUniqueKey(keyBase, styleKeySet, "imagem");
      const fieldKey = `${baseKey}.assets.${uniqueKey}`;

      const field: SchemaField = {
        key: fieldKey,
        label: buildCssAssetLabel(selectorForLabel, propertyName, assetOccurrence),
        type: "image",
        defaultValue: urlValue,
        helperText: `Imagem referenciada na propriedade ${propertyName} do seletor ${selectorForLabel}`,
      };

      styleFields.push(field);
      setValue(fieldKey, defaults, urlValue);

      const placeholder = `url(${quote}{{${fieldKey}}}${quote})`;
      rebuilt += placeholder;
      lastIndex = matchStart + fullMatch.length;
      createdField = true;
    }

    if (!createdField) {
      continue;
    }

    rebuilt += assetValue.slice(lastIndex);
    const importantSuffix = important ? ` ${important}` : "";
    const replacement = `${leading}${rebuilt}${importantSuffix}${trailing}`;
    cssReplacements.push({ start: valueStart, end: valueEnd, replacement });
  }

  if (cssReplacements.length > 0) {
    contents = applyTextReplacements(scanSource, cssReplacements);
  }

  if (!styleFields.length) {
    return { contents: file.contents, styleGroups: [], hasFields: false };
  }

  styleFields.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  const groupId = `${schemaIdPrefix(`${baseKey}.styles`)}-palette`;
  const styleGroup: SchemaGroup = {
    id: groupId,
    label: `${displayLabelForFile(file.path)} · Estilos`,
    description: "Cores, gradientes e imagens detectadas automaticamente no CSS.",
    fields: styleFields,
  };

  return { contents, styleGroups: [styleGroup], hasFields: true };
}

function transformHtmlFile(
  file: TemplateFile,
  baseKey: string,
  defaults: Record<string, unknown>,
): TransformResult {
  const parser = new DOMParser();
  const contents = file.contents;
  const trimmed = contents.trim();
  const isFragment = !/<html[\s>]/i.test(trimmed);
  const htmlToParse = isFragment ? `<body>${contents}</body>` : contents;
  const doc = parser.parseFromString(htmlToParse, "text/html");

  if (!doc || doc.querySelector("parsererror")) {
    return { contents, contentTabs: [], seoGroups: [], styleGroups: [], hasFields: false };
  }

  const root: Element | null = isFragment ? doc.body : doc.documentElement;
  if (!root) {
    return { contents, contentTabs: [], seoGroups: [], styleGroups: [], hasFields: false };
  }

  const seoFields: SchemaField[] = [];
  const inlineStyleFields: SchemaField[] = [];
  const inlineStyleKeySet = new Set<string>();
  const sectionContexts: SectionContext[] = [];
  const sectionMap = new Map<Element, SectionContext>();
  const sectionSignatureMap = new Map<string, SectionContext>();
  const sectionKeySet = new Set<string>();
  const cardKeySet = new Set<string>();
  const cardMap = new Map<Element, CardContext>();

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

    seoFields.push(field);
    setValue(key, defaults, value);
    meta.setAttribute("content", `{{${key}}}`);
  });

  // Text nodes
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

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

    const section = getSectionContext(parent, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(parent, section, {
      cardKeySet,
      cardMap,
    });

    const owner = card ?? section;
    const { key, index } = buildFieldKey(owner, prefixForTag(tagName));
    const label = buildFieldLabel({
      section,
      card,
      baseLabel: labelForText(tagName, index, value),
    });
    const helperText = buildHelperText(parent, section, card);

    const field: SchemaField = {
      key,
      label,
      type: chooseTextFieldType(tagName, value),
      defaultValue: value,
      helperText,
    };

    owner.fields.push(field);
    setValue(key, defaults, value);

    const leading = rawText.match(/^\s*/)?.[0] ?? "";
    const trailing = rawText.match(/\s*$/)?.[0] ?? "";
    node.textContent = `${leading}{{${key}}}${trailing}`;

    current = walker.nextNode();
  }

  // Image sources
  const imageElements = Array.from(root.querySelectorAll("img[src]"));
  imageElements.forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;
    const value = src.trim();
    if (!value || value.includes("{{")) return;

    const section = getSectionContext(img, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(img, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const helperText = buildHelperText(img, section, card);
    const altRaw = img.getAttribute("alt");
    const hasAltAttribute = img.hasAttribute("alt");
    const altValue = altRaw ?? "";
    const altTrimmed = altRaw?.trim();

    const { key, index } = buildFieldKey(owner, "image");
    const field: SchemaField = {
      key,
      label: buildFieldLabel({
        section,
        card,
        baseLabel: altTrimmed ? `Imagem (${truncateLabel(altTrimmed)})` : `Imagem ${index}`,
      }),
      type: "image",
      defaultValue: value,
      helperText,
    };

    owner.fields.push(field);
    setValue(key, defaults, value);
    img.setAttribute("src", `{{${key}}}`);

    if (hasAltAttribute) {
      const { key: altKey, index: altIndex } = buildFieldKey(owner, "imageAlt");
      const altBaseLabel = altTrimmed
        ? `Texto alternativo (${truncateLabel(altTrimmed)})`
        : `Texto alternativo ${altIndex}`;
      const altField: SchemaField = {
        key: altKey,
        label: buildFieldLabel({ section, card, baseLabel: altBaseLabel }),
        type: "text",
        defaultValue: altValue,
        helperText: helperText
          ? `${helperText} · Texto alternativo (atributo alt)`
          : "Texto alternativo (atributo alt)",
      };

      owner.fields.push(altField);
      setValue(altKey, defaults, altValue);
      img.setAttribute("alt", `{{${altKey}}}`);
    }

    const attributeVariants: { name: string; type: SchemaField["type"] }[] = [
      { name: "srcset", type: "text" },
      { name: "data-src", type: "image" },
      { name: "data-srcset", type: "text" },
      { name: "data-background", type: "image" },
      { name: "data-bg", type: "image" },
      { name: "data-image", type: "image" },
      { name: "data-lazy", type: "image" },
    ];

    attributeVariants.forEach(({ name, type }) => {
      const rawAttr = img.getAttribute(name);
      if (!rawAttr) {
        return;
      }
      const attrValue = rawAttr.trim();
      if (!attrValue || attrValue.includes("{{")) {
        return;
      }

      const prefix = `image_${sanitizeKey(name) || "atributo"}`;
      const { key: attrKey, index: attrIndex } = buildFieldKey(owner, prefix);
      const attributeLabel = formatAttributeName(name);
      const labelSuffix = attributeLabel.length
        ? `${attributeLabel}${attrIndex > 1 ? ` ${attrIndex}` : ""}`
        : `variação ${attrIndex}`;
      const baseLabel = `Variante da imagem (${labelSuffix})`;

      const attrField: SchemaField = {
        key: attrKey,
        label: buildFieldLabel({ section, card, baseLabel }),
        type,
        defaultValue: attrValue,
        helperText: helperText ? `${helperText} · Atributo ${name}` : `Atributo ${name}`,
      };

      owner.fields.push(attrField);
      setValue(attrKey, defaults, attrValue);
      img.setAttribute(name, `{{${attrKey}}}`);
    });
  });

  const pictureSourceElements = Array.from(
    root.querySelectorAll("picture source[srcset], picture source[data-srcset]"),
  );
  pictureSourceElements.forEach((source) => {
    const section = getSectionContext(source, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(source, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const helperText = buildHelperText(source, section, card);

    const attributeVariants: { name: string; type: SchemaField["type"] }[] = [
      { name: "srcset", type: "text" },
      { name: "data-srcset", type: "text" },
    ];

    attributeVariants.forEach(({ name, type }) => {
      const rawAttr = source.getAttribute(name);
      if (!rawAttr) {
        return;
      }
      const attrValue = rawAttr.trim();
      if (!attrValue || attrValue.includes("{{")) {
        return;
      }

      const prefix = `source_${sanitizeKey(name) || "variante"}`;
      const { key, index } = buildFieldKey(owner, prefix);
      const attributeLabel = formatAttributeName(name);
      const labelSuffix = attributeLabel.length
        ? `${attributeLabel}${index > 1 ? ` ${index}` : ""}`
        : `variação ${index}`;
      const baseLabel = `Fonte responsiva (${labelSuffix})`;

      const field: SchemaField = {
        key,
        label: buildFieldLabel({ section, card, baseLabel }),
        type,
        defaultValue: attrValue,
        helperText: helperText ? `${helperText} · Atributo ${name}` : `Atributo ${name}`,
      };

      owner.fields.push(field);
      setValue(key, defaults, attrValue);
      source.setAttribute(name, `{{${key}}}`);
    });
  });

  // Links
  const linkElements = Array.from(root.querySelectorAll("a[href]"));
  linkElements.forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href) return;
    const value = href.trim();
    if (!value || value.includes("{{")) return;
    if (URL_SKIP_PREFIXES.some((prefix) => value.toLowerCase().startsWith(prefix))) return;

    const section = getSectionContext(anchor, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(anchor, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const { key, index } = buildFieldKey(owner, "link");
    const helperText = buildHelperText(anchor, section, card);
    const field: SchemaField = {
      key,
      label: buildFieldLabel({
        section,
        card,
        baseLabel: anchor.textContent?.trim()
          ? `Link (${truncateLabel(anchor.textContent.trim())})`
          : `Link ${index}`,
      }),
      type: "url",
      defaultValue: value,
      helperText,
    };

    owner.fields.push(field);
    setValue(key, defaults, value);
    anchor.setAttribute("href", `{{${key}}}`);
  });

  const styledElements = Array.from(root.querySelectorAll("[style]"));
  styledElements.forEach((element) => {
    const styleValue = element.getAttribute("style");
    if (!styleValue) {
      return;
    }

    const replacements: TextReplacement[] = [];
    const pattern = /([\w-]+)(\s*:\s*)([^;]+)(;?)/g;
    let styleMatch: RegExpExecArray | null;

    while ((styleMatch = pattern.exec(styleValue))) {
      const propertyName = styleMatch[1].trim().toLowerCase();
      const rawSegment = styleMatch[3];
      const valueStart = styleMatch.index + styleMatch[1].length + styleMatch[2].length;
      const valueEnd = valueStart + rawSegment.length;

      let handled = false;

      if (isColorProperty(propertyName)) {
        const detection = detectColorValue(propertyName, rawSegment);
        if (detection) {
          const keyBase = buildInlineColorKeyBase(element, propertyName);
          const uniqueKey = ensureUniqueKey(
            keyBase,
            inlineStyleKeySet,
            propertyName.replace(/-+/g, "_") || "cor",
          );
          const fieldKey = `${baseKey}.colors.${uniqueKey}`;

          const field: SchemaField = {
            key: fieldKey,
            label: buildInlineColorLabel(element, propertyName, detection.type),
            type: detection.type,
            defaultValue: detection.defaultValue,
            helperText: `Estilo inline ${propertyName} em ${formatElementDescriptor(element)}`,
          };

          inlineStyleFields.push(field);
          setValue(fieldKey, defaults, detection.defaultValue);

          const leading = rawSegment.match(/^\s*/)?.[0] ?? "";
          const trailing = rawSegment.match(/\s*$/)?.[0] ?? "";
          const importantSuffix = detection.important ? ` ${detection.important}` : "";
          const replacement = `${leading}{{${fieldKey}}}${importantSuffix}${trailing}`;

          replacements.push({ start: valueStart, end: valueEnd, replacement });
          handled = true;
        }
      }

      if (handled) {
        continue;
      }

      if (!/url\(/i.test(rawSegment)) {
        continue;
      }

      const leading = rawSegment.match(/^\s*/)?.[0] ?? "";
      const trailing = rawSegment.match(/\s*$/)?.[0] ?? "";
      const coreValue = rawSegment.slice(leading.length, rawSegment.length - trailing.length);
      const trimmedCore = coreValue.trim();
      if (!trimmedCore || trimmedCore.includes("{{")) {
        continue;
      }

      const { value: assetValue, important } = splitImportant(trimmedCore);
      const assetPattern = /url\((['"]?)([^)"']+)\1\)/gi;
      let assetMatch: RegExpExecArray | null;
      let rebuilt = "";
      let lastIndex = 0;
      let createdField = false;
      let assetOccurrence = 0;

      while ((assetMatch = assetPattern.exec(assetValue))) {
        const fullMatch = assetMatch[0];
        if (!fullMatch || fullMatch.includes("{{")) {
          continue;
        }

        const quote = assetMatch[1] ?? "";
        const urlValue = assetMatch[2]?.trim() ?? "";
        if (!urlValue || urlValue.startsWith("data:")) {
          continue;
        }

        assetOccurrence += 1;
        const matchStart = assetMatch.index;
        rebuilt += assetValue.slice(lastIndex, matchStart);

        const keyBase = buildInlineAssetKeyBase(element, propertyName, assetOccurrence, urlValue);
        const uniqueKey = ensureUniqueKey(keyBase, inlineStyleKeySet, "imagem");
        const fieldKey = `${baseKey}.assets.${uniqueKey}`;

        const field: SchemaField = {
          key: fieldKey,
          label: buildInlineAssetLabel(element, propertyName, assetOccurrence),
          type: "image",
          defaultValue: urlValue,
          helperText: `Imagem referenciada na propriedade ${propertyName} em ${formatElementDescriptor(element)}`,
        };

        inlineStyleFields.push(field);
        setValue(fieldKey, defaults, urlValue);

        const placeholder = `url(${quote}{{${fieldKey}}}${quote})`;
        rebuilt += placeholder;
        lastIndex = matchStart + fullMatch.length;
        createdField = true;
      }

      if (!createdField) {
        continue;
      }

      rebuilt += assetValue.slice(lastIndex);
      const importantSuffix = important ? ` ${important}` : "";
      const replacement = `${leading}${rebuilt}${importantSuffix}${trailing}`;

      replacements.push({ start: valueStart, end: valueEnd, replacement });
    }

    if (replacements.length > 0) {
      const updated = applyTextReplacements(styleValue, replacements);
      element.setAttribute("style", updated);
    }
  });

  const videoElements = Array.from(root.querySelectorAll("video[poster]"));
  videoElements.forEach((video) => {
    const posterRaw = video.getAttribute("poster");
    if (posterRaw === null || posterRaw.includes("{{")) {
      return;
    }

    const section = getSectionContext(video, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(video, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const helperText = buildHelperText(video, section, card);
    const { key, index } = buildFieldKey(owner, "videoPoster");
    const baseLabel = index > 1 ? `Poster do vídeo ${index}` : "Poster do vídeo";

    const field: SchemaField = {
      key,
      label: buildFieldLabel({ section, card, baseLabel }),
      type: "image",
      defaultValue: posterRaw,
      helperText: helperText
        ? `${helperText} · Poster do vídeo`
        : "Poster do vídeo (atributo poster)",
    };

    owner.fields.push(field);
    setValue(key, defaults, posterRaw);
    video.setAttribute("poster", `{{${key}}}`);
  });

  const iframeElements = Array.from(root.querySelectorAll("iframe[src]"));
  iframeElements.forEach((iframe) => {
    const src = iframe.getAttribute("src");
    if (!src) return;
    const value = src.trim();
    if (!value || value.includes("{{")) return;

    const section = getSectionContext(iframe, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(iframe, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const helperText = buildHelperText(iframe, section, card);
    const { key, index } = buildFieldKey(owner, "iframe");
    const baseLabel = index > 1 ? `Iframe ${index}` : "Iframe";

    const field: SchemaField = {
      key,
      label: buildFieldLabel({ section, card, baseLabel }),
      type: "url",
      defaultValue: value,
      helperText: helperText ? `${helperText} · Fonte do iframe` : "URL do iframe (atributo src)",
    };

    owner.fields.push(field);
    setValue(key, defaults, value);
    iframe.setAttribute("src", `{{${key}}}`);
  });

  const backgroundAttributeElements = Array.from(
    root.querySelectorAll("[data-background], [data-bg], [data-image]"),
  ).filter((element) => element.tagName.toLowerCase() !== "img");
  backgroundAttributeElements.forEach((element) => {
    const section = getSectionContext(element, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(element, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const helperText = buildHelperText(element, section, card);

    ["data-background", "data-bg", "data-image"].forEach((attribute) => {
      const rawAttr = element.getAttribute(attribute);
      if (!rawAttr) {
        return;
      }
      const attrValue = rawAttr.trim();
      if (!attrValue || attrValue.includes("{{")) {
        return;
      }

      const prefix = `background_${sanitizeKey(attribute) || "imagem"}`;
      const { key, index } = buildFieldKey(owner, prefix);
      const attributeLabel = formatAttributeName(attribute);
      const labelSuffix = attributeLabel.length
        ? `${attributeLabel}${index > 1 ? ` ${index}` : ""}`
        : `variação ${index}`;
      const baseLabel = `Imagem de fundo (${labelSuffix})`;

      const field: SchemaField = {
        key,
        label: buildFieldLabel({ section, card, baseLabel }),
        type: "image",
        defaultValue: attrValue,
        helperText: helperText ? `${helperText} · Atributo ${attribute}` : `Atributo ${attribute}`,
      };

      owner.fields.push(field);
      setValue(key, defaults, attrValue);
      element.setAttribute(attribute, `{{${key}}}`);
    });
  });

  const formFieldElements = Array.from(root.querySelectorAll("input, textarea"));
  formFieldElements.forEach((element) => {
    const tag = element.tagName.toLowerCase();
    const section = getSectionContext(element, {
      sectionMap,
      sectionKeySet,
      sectionContexts,
      baseKey,
      file,
      sectionSignatureMap,
    });
    const card = getCardContext(element, section, {
      cardKeySet,
      cardMap,
    });
    const owner = card ?? section;
    const helperText = buildHelperText(element, section, card);
    const descriptor = describeFormField(element);

    if (tag === "input") {
      const typeAttr = (element.getAttribute("type") ?? "text").toLowerCase();

      const placeholderRaw = element.getAttribute("placeholder");
      if (placeholderRaw !== null && !placeholderRaw.includes("{{")) {
        const { key, index } = buildFieldKey(owner, "placeholder");
        const placeholderTrimmed = placeholderRaw.trim();
        const placeholderLabelSource = descriptor ?? (placeholderTrimmed || undefined);
        const baseLabel = placeholderLabelSource
          ? `Placeholder (${truncateLabel(placeholderLabelSource)})`
          : `Placeholder ${index}`;

        const field: SchemaField = {
          key,
          label: buildFieldLabel({ section, card, baseLabel }),
          type: "text",
          defaultValue: placeholderRaw,
          helperText: helperText ? `${helperText} · Placeholder` : "Placeholder do campo",
        };

        owner.fields.push(field);
        setValue(key, defaults, placeholderRaw);
        element.setAttribute("placeholder", `{{${key}}}`);
      }

      const valueRaw = element.getAttribute("value");
      const skipValueTypes = new Set(["hidden", "file", "checkbox", "radio"]);
      if (
        valueRaw !== null &&
        !valueRaw.includes("{{") &&
        !skipValueTypes.has(typeAttr)
      ) {
        const trimmedValue = valueRaw.trim();
        const isButtonType = ["submit", "button", "reset"].includes(typeAttr);
        const shouldCreateValueField = trimmedValue.length > 0 || isButtonType;

        if (shouldCreateValueField) {
          const prefix = isButtonType ? "buttonValue" : "inputValue";
          const { key, index } = buildFieldKey(owner, prefix);
          const descriptorLabel = descriptor ?? (trimmedValue || undefined);
          const baseLabel = descriptorLabel
            ? isButtonType
              ? `Texto do botão (${truncateLabel(descriptorLabel)})`
              : `Valor padrão (${truncateLabel(descriptorLabel)})`
            : isButtonType
              ? `Texto do botão ${index}`
              : `Valor padrão ${index}`;

          const field: SchemaField = {
            key,
            label: buildFieldLabel({ section, card, baseLabel }),
            type: "text",
            defaultValue: valueRaw,
            helperText: helperText
              ? `${helperText} · ${isButtonType ? "Texto do botão" : "Valor padrão"}`
              : isButtonType
                ? "Texto exibido no botão (atributo value)"
                : "Valor padrão (atributo value)",
          };

          owner.fields.push(field);
          setValue(key, defaults, valueRaw);
          element.setAttribute("value", `{{${key}}}`);
        }
      }
    }

    if (tag === "textarea") {
      const placeholderRaw = element.getAttribute("placeholder");
      if (placeholderRaw !== null && !placeholderRaw.includes("{{")) {
        const { key, index } = buildFieldKey(owner, "placeholder");
        const placeholderTrimmed = placeholderRaw.trim();
        const placeholderLabelSource = descriptor ?? (placeholderTrimmed || undefined);
        const baseLabel = placeholderLabelSource
          ? `Placeholder (${truncateLabel(placeholderLabelSource)})`
          : `Placeholder ${index}`;

        const field: SchemaField = {
          key,
          label: buildFieldLabel({ section, card, baseLabel }),
          type: "text",
          defaultValue: placeholderRaw,
          helperText: helperText ? `${helperText} · Placeholder` : "Placeholder do campo",
        };

        owner.fields.push(field);
        setValue(key, defaults, placeholderRaw);
        element.setAttribute("placeholder", `{{${key}}}`);
      }
    }
  });

  let serialized: string;
  if (isFragment) {
    serialized = root.innerHTML;
  } else {
    const doctype = formatDoctype(doc.doctype);
    const html = doc.documentElement?.outerHTML ?? contents;
    serialized = doctype ? `${doctype}\n${html}` : html;
  }

  const contentTabs = buildSectionTabs(sectionContexts, baseKey);
  const seoGroups = seoFields.length
    ? [
        {
          id: `${baseKey}-seo`,
          label: `${displayLabelForFile(file.path)} · SEO`,
          description: "Metadados extraídos automaticamente.",
          fields: seoFields,
        },
      ]
    : [];
  inlineStyleFields.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  const styleGroups = inlineStyleFields.length
    ? [
        {
          id: `${schemaIdPrefix(`${baseKey}.inline-styles`)}-palette`,
          label: `${displayLabelForFile(file.path)} · Estilos`,
          description: "Cores, gradientes e imagens detectadas automaticamente no HTML.",
          fields: inlineStyleFields,
        },
      ]
    : [];

  return {
    contents: serialized,
    contentTabs,
    seoGroups,
    styleGroups,
    hasFields:
      contentTabs.some((tab) => tab.groups.some((group) => group.fields.length > 0)) ||
      seoGroups.length > 0 ||
      styleGroups.length > 0,
  };
}

interface SectionContextOptions {
  sectionMap: Map<Element, SectionContext>;
  sectionKeySet: Set<string>;
  sectionContexts: SectionContext[];
  baseKey: string;
  file: TemplateFile;
  sectionSignatureMap: Map<string, SectionContext>;
}

interface CardContextOptions {
  cardKeySet: Set<string>;
  cardMap: Map<Element, CardContext>;
}

interface SectionMetadata {
  label: string;
  description?: string;
  idBase: string;
}

interface CardMetadata {
  label: string;
  description?: string;
  idBase: string;
}

function getSectionContext(element: Element, options: SectionContextOptions): SectionContext {
  const { sectionMap, sectionKeySet, sectionContexts, baseKey, file, sectionSignatureMap } = options;
  const sectionElement = findSectionElement(element);
  let signature: string | null = null;
  if (sectionElement) {
    const existing = sectionMap.get(sectionElement);
    if (existing) {
      return existing;
    }

    signature = buildSectionSignature(sectionElement);
    if (signature) {
      const duplicate = sectionSignatureMap.get(signature);
      if (duplicate) {
        sectionMap.set(sectionElement, duplicate);
        return duplicate;
      }
    }
  }

  const index = sectionContexts.length + 1;
  const metadata = deriveSectionMetadata(sectionElement, index, file);
  const id = ensureUniqueKey(metadata.idBase, sectionKeySet, `section_${index}`);

  const context: SectionContext = {
    id,
    label: metadata.label,
    description: metadata.description,
    keyPrefix: `${baseKey}.${id}`,
    element: sectionElement,
    fields: [],
    counters: {},
    cards: [],
    order: sectionContexts.length,
  };

  sectionContexts.push(context);
  if (sectionElement) {
    sectionMap.set(sectionElement, context);
    if (signature && !sectionSignatureMap.has(signature)) {
      sectionSignatureMap.set(signature, context);
    }
  }

  return context;
}

function getCardContext(element: Element, section: SectionContext, options: CardContextOptions): CardContext | null {
  const { cardKeySet, cardMap } = options;
  const sectionElement = section.element;
  if (!sectionElement) {
    return null;
  }

  let current: Element | null = element;
  while (current && current !== sectionElement && current !== sectionElement.parentElement) {
    const mapped = cardMap.get(current);
    if (mapped) {
      return mapped;
    }

    if (isCardCandidate(current, sectionElement)) {
      const index = section.cards.length + 1;
      const metadata = deriveCardMetadata(current, index);
      const id = ensureUniqueKey(`${section.id}_${metadata.idBase}`, cardKeySet, `${section.id}_card_${index}`);

      const context: CardContext = {
        id,
        label: metadata.label,
        description: metadata.description,
        keyPrefix: `${section.keyPrefix}.${id}`,
        element: current,
        fields: [],
        counters: {},
        order: section.cards.length,
        parentSectionId: section.id,
      };

      section.cards.push(context);
      cardMap.set(current, context);
      return context;
    }

    current = current.parentElement;
  }

  return null;
}

const COLOR_PROPERTY_EXACT = new Set([
  "background",
  "background-image",
  "background-color",
  "fill",
  "stroke",
]);

const COLOR_KEYWORDS = new Set(
  [
    "white",
    "black",
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "gray",
    "grey",
    "silver",
    "gold",
    "beige",
    "brown",
    "cyan",
    "magenta",
    "lime",
    "teal",
    "navy",
    "maroon",
    "olive",
    "aqua",
    "fuchsia",
    "indigo",
    "violet",
    "transparent",
  ].map((keyword) => keyword.toLowerCase()),
);

const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3,8})$/i;
const RGB_COLOR_REGEX = /^rgba?\([^)]*\)$/i;
const HSL_COLOR_REGEX = /^hsla?\([^)]*\)$/i;

function applyTextReplacements(source: string, replacements: TextReplacement[]): string {
  if (!replacements.length) {
    return source;
  }

  const ordered = [...replacements].sort((a, b) => a.start - b.start);
  let result = "";
  let lastIndex = 0;

  ordered.forEach(({ start, end, replacement }) => {
    result += source.slice(lastIndex, start);
    result += replacement;
    lastIndex = end;
  });

  result += source.slice(lastIndex);
  return result;
}

function isColorProperty(property: string): boolean {
  if (!property || property.startsWith("--")) {
    return false;
  }

  return COLOR_PROPERTY_EXACT.has(property) || property.endsWith("color");
}

function detectColorValue(_property: string, rawValue: string): ColorDetection | null {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.includes("{{")) {
    return null;
  }

  const { value, important } = splitImportant(trimmed);
  if (!value) {
    return null;
  }

  if (/var\(/i.test(value) || /(url\s*\()/i.test(value)) {
    return null;
  }

  if (/gradient\s*\(/i.test(value)) {
    return { defaultValue: trimmed, type: "text", important };
  }

  if (isSimpleColorValue(value)) {
    return { defaultValue: trimmed, type: "color", important };
  }

  return null;
}

function extractSelectorForIndex(css: string, propertyIndex: number): string | null {
  const before = css.slice(0, propertyIndex);
  const openIndex = before.lastIndexOf("{");
  if (openIndex === -1) {
    return null;
  }

  const beforeOpen = before.slice(0, openIndex);
  const closeIndex = beforeOpen.lastIndexOf("}");
  const rawSelector = before.slice(closeIndex + 1, openIndex).trim();
  if (!rawSelector) {
    return null;
  }

  const selector = rawSelector.split("{").pop() ?? rawSelector;
  return selector.replace(/\s+/g, " ").trim();
}

function buildCssColorKeyBase(selector: string, property: string): string {
  const normalizedSelector = selector.replace(/[#.]+/g, " ").replace(/\s+/g, " ").trim();
  const combined = [normalizedSelector, property].filter(Boolean).join("_");
  return sanitizeKey(combined);
}

function buildCssColorLabel(
  selector: string,
  property: string,
  type: SchemaField["type"],
): string {
  const labelPrefix = type === "text" ? "Gradiente" : "Cor";
  const propertyLabel = property === "color" ? "" : ` ${formatLabel(property)}`;
  const selectorLabel = selector || "Regra";
  return `${labelPrefix}${propertyLabel} (${selectorLabel})`;
}

function buildInlineColorKeyBase(element: Element, property: string): string {
  const parts: string[] = [element.tagName.toLowerCase()];
  if (element.id) {
    parts.push(`id_${element.id}`);
  }
  const firstClass = element.classList.item(0);
  if (firstClass) {
    parts.push(`class_${firstClass}`);
  }
  parts.push(property.replace(/-+/g, "_"));
  return sanitizeKey(parts.join("_"));
}

function buildInlineColorLabel(
  element: Element,
  property: string,
  type: SchemaField["type"],
): string {
  const labelPrefix = type === "text" ? "Gradiente" : "Cor";
  const propertyLabel = property === "color" ? "" : ` ${formatLabel(property)}`;
  const descriptor = describeElementForColorLabel(element);
  return `${labelPrefix}${propertyLabel} (${descriptor})`;
}

function buildCssAssetKeyBase(
  selector: string,
  property: string,
  occurrence: number,
  urlValue: string,
): string {
  const base = `${selector} ${property} asset_${occurrence} ${urlValue}`;
  const sanitized = sanitizeKey(base);
  return sanitized && sanitized !== "arquivo" ? sanitized : `asset_${occurrence}`;
}

function buildCssAssetLabel(
  selector: string,
  property: string,
  occurrence: number,
): string {
  const selectorLabel = selector || "Regra";
  const isBackground = /background|image/i.test(property);
  const labelPrefix = isBackground ? "Imagem de fundo" : "Recurso do CSS";
  const occurrenceSuffix = occurrence > 1 ? ` · ${occurrence}` : "";
  return `${labelPrefix} (${selectorLabel}${occurrenceSuffix})`;
}

function buildInlineAssetKeyBase(
  element: Element,
  property: string,
  occurrence: number,
  urlValue: string,
): string {
  const parts: string[] = [element.tagName.toLowerCase()];
  if (element.id) {
    parts.push(`id_${element.id}`);
  }
  const firstClass = element.classList.item(0);
  if (firstClass) {
    parts.push(`class_${firstClass}`);
  }
  parts.push(property.replace(/-+/g, "_"));
  parts.push(`asset_${occurrence}`);
  const combined = `${parts.join("_")} ${urlValue}`;
  const sanitized = sanitizeKey(combined);
  return sanitized && sanitized !== "arquivo" ? sanitized : `asset_${occurrence}`;
}

function buildInlineAssetLabel(
  element: Element,
  property: string,
  occurrence: number,
): string {
  const descriptor = describeElementForColorLabel(element);
  const isBackground = /background|image/i.test(property);
  const labelPrefix = isBackground ? "Imagem de fundo" : "Recurso";
  const occurrenceSuffix = occurrence > 1 ? ` · ${occurrence}` : "";
  return `${labelPrefix} (${descriptor}${occurrenceSuffix})`;
}

function describeElementForColorLabel(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  const firstClass = element.classList.item(0);
  if (firstClass) {
    return `.${firstClass}`;
  }
  return element.tagName.toLowerCase();
}

function formatAttributeName(attribute: string): string {
  const normalized = attribute.replace(/^data[-_]/, "data ");
  return formatLabel(normalized);
}

function splitImportant(value: string): { value: string; important?: string } {
  const match = value.match(/^(.*?)(!important)$/i);
  if (match) {
    return { value: match[1].trim(), important: "!important" };
  }
  return { value, important: undefined };
}

function isSimpleColorValue(value: string): boolean {
  if (HEX_COLOR_REGEX.test(value)) {
    return true;
  }
  if (RGB_COLOR_REGEX.test(value)) {
    return true;
  }
  if (HSL_COLOR_REGEX.test(value)) {
    return true;
  }
  if (COLOR_KEYWORDS.has(value.toLowerCase())) {
    return true;
  }
  return false;
}

function buildFieldKey(owner: FieldOwnerContext, prefix: string): { key: string; index: number } {
  const cleanPrefix = prefix || "text";
  const current = (owner.counters[cleanPrefix] ?? 0) + 1;
  owner.counters[cleanPrefix] = current;
  const key = `${owner.keyPrefix}.${cleanPrefix}${current}`;
  return { key, index: current };
}

function buildFieldLabel({
  section,
  card,
  baseLabel,
}: {
  section: SectionContext;
  card: CardContext | null;
  baseLabel: string;
}): string {
  const parts = [section.label];
  if (card) {
    parts.push(card.label);
  }
  parts.push(baseLabel);
  return parts.filter(Boolean).join(" · ");
}

function buildHelperText(element: Element, section: SectionContext, card: CardContext | null): string | undefined {
  const descriptor = formatElementDescriptor(element);
  const parts: string[] = [];
  parts.push(`Elemento ${descriptor}`);
  if (card) {
    parts.push(`Card: ${card.label}`);
  }
  parts.push(`Seção: ${section.label}`);
  return parts.join(" · ");
}

function buildSectionTabs(sections: SectionContext[], keyPrefix: string): GeneratedTab[] {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const groupPrefix = schemaIdPrefix(keyPrefix);
  const tabMap = new Map<string, GeneratedTab>();
  const labelUsage = new Map<string, number>();

  sortedSections.forEach((section) => {
    const { tabId, tabLabel } = categorizeSectionTab(section.label);
    const existingTab = tabMap.get(tabId);
    const tab: GeneratedTab = existingTab
      ? { ...existingTab, order: Math.min(existingTab.order, section.order) }
      : { id: tabId, label: tabLabel, groups: [], order: section.order };

    const usageKey = `${tabId}::${section.label}`;
    const usageCount = (labelUsage.get(usageKey) ?? 0) + 1;
    labelUsage.set(usageKey, usageCount);
    const groupLabel = usageCount > 1 ? `${section.label} ${usageCount}` : section.label;

    if (section.fields.length > 0) {
      tab.groups.push({
        id: `${groupPrefix}-${section.id}`,
        label: groupLabel,
        description: section.description,
        fields: section.fields,
      });
    }

    const sortedCards = [...section.cards].sort((a, b) => a.order - b.order);
    sortedCards.forEach((card) => {
      if (card.fields.length > 0) {
        tab.groups.push({
          id: `${groupPrefix}-${section.id}-${card.id}`,
          label: `${groupLabel} · ${card.label}`,
          description: card.description,
          fields: card.fields,
        });
      }
    });

    tabMap.set(tabId, tab);
  });

  return Array.from(tabMap.values()).sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label, "pt-BR"),
  );
}

function categorizeSectionTab(label: string): { tabId: string; tabLabel: string } {
  const normalized = label.toLowerCase();
  const hint = SECTION_TAB_HINTS.find(({ pattern }) => pattern.test(normalized));
  const tabKey = hint?.key ?? sanitizeKey(label) ?? "conteudo";
  const tabLabel = hint?.label ?? (label || "Seção");
  return { tabId: `auto-${tabKey}`, tabLabel };
}

function buildSeoTabs(seoGroups: SchemaGroup[]): SchemaTab[] {
  if (!seoGroups.length) {
    return [];
  }

  return [
    {
      id: "auto-seo",
      label: "SEO e metadados",
      groups: seoGroups,
    },
  ];
}

function buildIntegrationsTab(): SchemaTab {
  return {
    id: "auto-integrations",
    label: "Integrações e publicação",
    groups: [
      {
        id: "auto-integrations-whatsapp",
        label: "WhatsApp e atendimento",
        description: "Configure o contato principal utilizado em botões e formulários.",
        fields: [
          {
            key: "integrations.whatsapp.number",
            label: "Número do WhatsApp",
            type: "text",
            helperText: "Inclua apenas dígitos (código do país + DDD + número).",
          },
          {
            key: "integrations.whatsapp.message",
            label: "Mensagem padrão",
            type: "textarea",
            helperText: "Texto enviado automaticamente quando o cliente clicar no botão.",
          },
          {
            key: "integrations.whatsapp.ctaLabel",
            label: "Texto do botão",
            type: "text",
          },
        ],
      },
      {
        id: "auto-integrations-publishing",
        label: "Hospedagem e domínio",
        description: "Informações para conectar serviços de publicação (Netlify, Vercel, etc.).",
        fields: [
          {
            key: "integrations.publish.netlifySiteName",
            label: "Nome do site (Netlify)",
            type: "text",
          },
          {
            key: "integrations.publish.customDomain",
            label: "Domínio personalizado",
            type: "text",
          },
          {
            key: "integrations.publish.contactEmail",
            label: "Email de contato",
            type: "text",
          },
        ],
      },
      {
        id: "auto-integrations-analytics",
        label: "Métricas e pixels",
        fields: [
          {
            key: "integrations.analytics.ga4",
            label: "ID do Google Analytics 4",
            type: "text",
          },
          {
            key: "integrations.analytics.facebook",
            label: "Meta Pixel",
            type: "text",
          },
          {
            key: "integrations.analytics.tiktok",
            label: "TikTok Pixel",
            type: "text",
          },
        ],
      },
    ],
  };
}

function findSectionElement(element: Element): Element | null {
  const selector = SECTION_SELECTORS.join(",");
  const closest = element.closest(selector);
  if (closest) {
    return closest;
  }

  const body = element.ownerDocument?.body ?? null;
  if (body && body.contains(element)) {
    return body;
  }

  return element;
}

function buildSectionSignature(element: Element): string | null {
  if (!isNavigationElement(element)) {
    return null;
  }

  const links = Array.from(element.querySelectorAll("a"))
    .map((anchor) => {
      const text = normalizeNavigationText(anchor.textContent);
      const href = normalizeNavigationHref(anchor.getAttribute("href"));
      if (!text && !href) {
        return null;
      }
      return { text, href };
    })
    .filter((value): value is { text: string; href: string } => value !== null);

  const uniqueLinks: { text: string; href: string }[] = [];
  const seen = new Set<string>();

  links.forEach((link) => {
    const key = `${link.text}|${link.href}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    uniqueLinks.push(link);
  });

  if (uniqueLinks.length < 2) {
    return null;
  }

  const orderedSignature = uniqueLinks
    .map((link) => `${link.text || "<text>"}->${link.href || "<href>"}`)
    .join("||");

  const tag = element.tagName.toLowerCase();

  return `nav|${tag}|${orderedSignature}`;
}

function normalizeNavigationText(value: string | null | undefined): string {
  return value ? value.replace(/\s+/g, " ").trim().toLowerCase() : "";
}

function normalizeNavigationHref(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  return trimmed;
}

function isNavigationElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  if (tag === "nav") {
    return true;
  }

  const role = element.getAttribute("role")?.toLowerCase();
  if (role === "navigation") {
    return true;
  }

  return Array.from(element.classList).some((cls) => {
    const normalized = cls.trim().toLowerCase();
    return normalized.includes("nav") || normalized.includes("menu");
  });
}

function deriveSectionMetadata(element: Element | null, index: number, file: TemplateFile): SectionMetadata {
  const fallback: SectionMetadata = {
    label: `Seção ${index}`,
    idBase: `section_${index}`,
  };

  if (!element) {
    return fallback;
  }

  const descriptor = getElementDescriptor(element);
  const hint = SECTION_LABEL_HINTS.find(({ pattern }) => pattern.test(descriptor));
  if (hint) {
    const label = hint.label;
    return {
      label,
      idBase: sanitizeKey(label) || `section_${index}`,
    };
  }

  const attributeLabel = pickSectionAttributeLabel(element);
  if (attributeLabel) {
    const formatted = formatLabel(attributeLabel);
    return {
      label: formatted,
      description: formatted !== attributeLabel ? attributeLabel : undefined,
      idBase: sanitizeKey(formatted) || `section_${index}`,
    };
  }

  const tag = element.tagName.toLowerCase();
  const tagLabel = tagBasedSectionLabel(tag);
  if (tagLabel) {
    return {
      label: tagLabel,
      idBase: sanitizeKey(tagLabel) || `section_${index}`,
    };
  }

  if (element === element.ownerDocument?.body) {
    const fileLabel = formatLabel(file.path.replace(/\.[^/.]+$/, ""));
    return {
      label: fileLabel || fallback.label,
      idBase: sanitizeKey(fileLabel) || fallback.idBase,
    };
  }

  return fallback;
}

function pickSectionAttributeLabel(element: Element): string | null {
  const attributeCandidates = [
    element.getAttribute("data-section-title"),
    element.getAttribute("data-section"),
    element.getAttribute("data-title"),
    element.getAttribute("data-name"),
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.id,
  ];

  for (const candidate of attributeCandidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }

  const heading = element.querySelector("h1, h2, h3, h4, h5, h6");
  if (heading?.textContent?.trim()) {
    return heading.textContent.trim();
  }

  return null;
}

function tagBasedSectionLabel(tag: string): string | null {
  switch (tag) {
    case "header":
      return "Cabeçalho";
    case "nav":
      return "Navegação";
    case "main":
      return "Conteúdo principal";
    case "footer":
      return "Rodapé";
    case "aside":
      return "Barra lateral";
    default:
      return null;
  }
}

function deriveCardMetadata(element: Element, index: number): CardMetadata {
  const descriptor = getElementDescriptor(element);
  const hint = CARD_LABEL_HINTS.find(({ pattern }) => pattern.test(descriptor));
  const base = hint?.label ?? "Card";
  const heading = element.querySelector("h1, h2, h3, h4, h5, h6, strong");
  const description = heading?.textContent?.trim() ? truncateLabel(heading.textContent.trim(), 80) : undefined;

  return {
    label: `${base} ${index}`,
    description,
    idBase: sanitizeKey(`${base}_${index}`) || `card_${index}`,
  };
}

function ensureUniqueKey(base: string, keySet: Set<string>, fallback: string): string {
  const cleanBase = base || fallback;
  let candidate = cleanBase;
  let counter = 2;
  while (keySet.has(candidate)) {
    candidate = `${cleanBase}_${counter}`;
    counter += 1;
  }
  keySet.add(candidate);
  return candidate;
}

function schemaIdPrefix(baseKey: string): string {
  const cleaned = baseKey.replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "auto";
}

function formatElementDescriptor(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = element.classList.length
    ? `.${Array.from(element.classList)
        .slice(0, 3)
        .map((item) => item.replace(/\s+/g, ""))
        .join(".")}`
    : "";
  return `<${tag}${id}${classes}>`;
}

function describeFormField(element: Element): string | undefined {
  const labelText = findAssociatedLabelText(element);
  if (labelText) {
    return labelText;
  }

  const attributeCandidates = [
    element.getAttribute("aria-label"),
    element.getAttribute("data-label"),
    element.getAttribute("name"),
    element.getAttribute("id"),
    element.getAttribute("placeholder"),
  ];

  for (const candidate of attributeCandidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
}

function findAssociatedLabelText(element: Element): string | null {
  const doc = element.ownerDocument;
  if (!doc) {
    return null;
  }

  const id = element.getAttribute("id");
  if (id) {
    const labels = Array.from(doc.querySelectorAll("label[for]"));
    for (const label of labels) {
      if (label.getAttribute("for") === id) {
        const text = label.textContent?.trim();
        if (text) {
          return text;
        }
      }
    }
  }

  const parentLabel = element.closest("label");
  if (parentLabel?.textContent) {
    const text = parentLabel.textContent.trim();
    if (text) {
      return text;
    }
  }

  return null;
}

function getElementDescriptor(element: Element): string {
  const attributes = Array.from(element.attributes)
    .filter((attr) => attr.name.startsWith("data-") || attr.name === "id" || attr.name === "class")
    .map((attr) => attr.value)
    .join(" ");
  return `${element.tagName} ${attributes}`.toLowerCase();
}

function isCardCandidate(element: Element, sectionElement: Element): boolean {
  if (!element.parentElement) {
    return false;
  }

  const descriptor = getElementDescriptor(element);
  const hasKeyword = CARD_KEYWORDS.some((keyword) => descriptor.includes(keyword));
  if (!hasKeyword) {
    return false;
  }

  if (!hasSimilarSiblings(element)) {
    return false;
  }

  return sectionElement.contains(element);
}

function hasSimilarSiblings(element: Element): boolean {
  const parent = element.parentElement;
  if (!parent) {
    return false;
  }

  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  if (siblings.length < 2) {
    return false;
  }

  const signature = signatureForCard(element);
  const similar = siblings.filter((child) => signatureForCard(child) === signature);
  return similar.length >= 2;
}

function signatureForCard(element: Element): string {
  const classes = Array.from(element.classList)
    .map((cls) => cls.trim())
    .filter(Boolean)
    .sort()
    .join(" ");
  const dataName = element.getAttribute("data-name") ?? element.getAttribute("data-type") ?? "";
  return `${element.tagName.toLowerCase()}|${classes}|${dataName.toLowerCase()}`;
}

function prefixForTag(tag: string): string {
  return TAG_KEY_PREFIX[tag.toLowerCase()] ?? "text";
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

function isCssFile(path: string): boolean {
  return /\.css$/i.test(path);
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
