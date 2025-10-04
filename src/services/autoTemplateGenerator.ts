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
  hasFields: boolean;
}

interface CssTransformResult {
  contents: string;
  colorGroups: SchemaGroup[];
  hasFields: boolean;
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
  button: "Texto do botão",
  a: "Texto do link",
  li: "Item de lista",
  label: "Rótulo",
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

type SectionLabelHint = { pattern: RegExp; label: string; predicate?: (element: Element) => boolean };

const SECTION_LABEL_HINTS: SectionLabelHint[] = [
  { pattern: /(hero|masthead|banner)/i, label: "Hero" },
  {
    pattern: /(header|topbar|navbar|nav\b|menu)/i,
    label: "Navegação",
    predicate: (element) => isNavigationElement(element),
  },
  {
    pattern: /(cardap|combo|prato|gastronom|menu)/i,
    label: "Cardápio",
    predicate: (element) => !isNavigationElement(element),
  },
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
  button: "button",
  a: "linkText",
  li: "item",
  label: "label",
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
  const colorGroups: SchemaGroup[] = [];
  const processedFiles: TemplateFile[] = [];
  let hasFields = false;

  originalFiles.forEach((file) => {
    if (isCssFile(file.path)) {
      const baseKey = `auto.${sanitizeKey(file.path)}`;
      const result = transformCssFile(file, baseKey, defaults);

      processedFiles.push({ path: file.path, contents: result.contents });

      if (result.hasFields) {
        hasFields = true;
        colorGroups.push(...result.colorGroups);
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

  if (colorGroups.length > 0) {
    tabs.push({
      id: "auto-styles",
      label: "Cores",
      groups: colorGroups,
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
  const colorKeySet = new Set<string>();
  const variableKeyMap = new Map<string, string>();
  const colorFields: SchemaField[] = [];
  const pattern = /(--[a-zA-Z0-9_-]+)(\s*:\s*)(#[0-9a-fA-F]{3,6})\b/g;

  let contents = file.contents.replace(pattern, (match, varName: string, separator: string, colorValue: string) => {
    let fieldKey = variableKeyMap.get(varName);

    if (!fieldKey) {
      const cleanedVar = sanitizeKey(varName.replace(/^--/, ""));
      const uniqueVar = ensureUniqueKey(cleanedVar || "cor", colorKeySet, "cor");
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

      colorFields.push(field);
      setValue(fieldKey, defaults, colorValue);
    }

    return `${varName}${separator}{{${fieldKey}}}`;
  });

  if (!colorFields.length) {
    return { contents: file.contents, colorGroups: [], hasFields: false };
  }

  const groupId = `${schemaIdPrefix(`${baseKey}.colors`)}-palette`;
  const colorGroup: SchemaGroup = {
    id: groupId,
    label: `${displayLabelForFile(file.path)} · Cores`,
    description: "Cores detectadas automaticamente no CSS.",
    fields: colorFields,
  };

  return { contents, colorGroups: [colorGroup], hasFields: true };
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
    return { contents, contentTabs: [], seoGroups: [], hasFields: false };
  }

  const root: Element | null = isFragment ? doc.body : doc.documentElement;
  if (!root) {
    return { contents, contentTabs: [], seoGroups: [], hasFields: false };
  }

  const seoFields: SchemaField[] = [];
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
    const alt = img.getAttribute("alt")?.trim();
    const { key, index } = buildFieldKey(owner, "image");
    const helperText = buildHelperText(img, section, card);
    const field: SchemaField = {
      key,
      label: buildFieldLabel({
        section,
        card,
        baseLabel: alt ? `Imagem (${truncateLabel(alt)})` : `Imagem ${index}`,
      }),
      type: "image",
      defaultValue: value,
      helperText: alt ? `${helperText ? `${helperText} · ` : ""}Alt: ${alt}` : helperText,
    };

    owner.fields.push(field);
    setValue(key, defaults, value);
    img.setAttribute("src", `{{${key}}}`);
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

  return {
    contents: serialized,
    contentTabs,
    seoGroups,
    hasFields:
      contentTabs.some((tab) => tab.groups.some((group) => group.fields.length > 0)) ||
      seoGroups.length > 0,
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

  const textContent = Array.from(element.querySelectorAll("a, button, span, li"))
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim().toLowerCase())
    .filter((value): value is string => Boolean(value) && value.length <= 160);

  const hrefs = Array.from(element.querySelectorAll("a[href]"))
    .map((anchor) => anchor.getAttribute("href")?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));

  if (textContent.length < 2 && hrefs.length < 2) {
    return null;
  }

  const textSignature = Array.from(new Set(textContent)).sort().join("|");
  const hrefSignature = Array.from(new Set(hrefs)).sort().join("|");
  const classes = Array.from(element.classList)
    .map((cls) => cls.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(".");
  const role = element.getAttribute("role")?.toLowerCase() ?? "";
  const tag = element.tagName.toLowerCase();

  return `nav|${tag}|${role}|${classes}|${textSignature}|href:${hrefSignature}`;
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

  const classes = Array.from(element.classList)
    .map((cls) => cls.trim().toLowerCase())
    .filter(Boolean);

  if (classes.some((cls) => cls.includes("nav"))) {
    return true;
  }

  const hasMenuKeyword = classes.some((cls) => cls.includes("menu"));
  if (!hasMenuKeyword) {
    return false;
  }

  const navLikeTags = new Set(["nav", "header", "aside", "menu"]);
  return role === "navigation" || navLikeTags.has(tag);
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
  const hint = SECTION_LABEL_HINTS.find(
    ({ pattern, predicate }) => pattern.test(descriptor) && (!predicate || predicate(element)),
  );
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
