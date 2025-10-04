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
    const renderedFiles = files.map((file) => ({
      ...file,
      contents: this.transformer(file.contents, flattened),
    }));

    return { files: renderedFiles };
  }
}
