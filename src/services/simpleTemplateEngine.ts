import type { RenderedTemplate, TemplateEngine, TemplateFile, TemplateConfig } from "@/core/template";
import { defaultTransformer, flattenConfig, type PlaceholderTransformer } from "@/utils/placeholders";

export interface SimpleTemplateEngineOptions {
  transformer?: PlaceholderTransformer;
}

export class SimpleTemplateEngine implements TemplateEngine {
  public readonly name = "Simple placeholders";
  private readonly transformer: PlaceholderTransformer;

  constructor(options?: SimpleTemplateEngineOptions) {
    this.transformer = options?.transformer ?? defaultTransformer;
  }

  async render(files: TemplateFile[], config: TemplateConfig): Promise<RenderedTemplate> {
    const flattened = flattenConfig(config);
    const fullConfigJson = JSON.stringify(config, null, 2)
      .replace(/</g, "\\u003C")
      .replace(/>/g, "\\u003E")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

    const placeholders = {
      ...flattened,
      __CONFIG__: fullConfigJson,
    };

    const renderedFiles = files.map((file) => ({
      ...file,
      contents: this.transformer(file.contents, placeholders),
    }));

    return { files: renderedFiles };
  }
}
