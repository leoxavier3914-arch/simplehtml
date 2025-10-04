export type TemplateConfig = Record<string, unknown>;

export interface TemplateFile {
  path: string;
  contents: string;
}

export interface RenderedTemplate {
  files: TemplateFile[];
}

export interface TemplateEngine {
  name: string;
  render(files: TemplateFile[], config: TemplateConfig): Promise<RenderedTemplate>;
}

export interface TemplateLoader {
  loadTemplate(templatePath: string): Promise<TemplateFile[]>;
}
