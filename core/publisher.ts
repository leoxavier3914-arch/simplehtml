import type { RenderedTemplate } from "@/core/template";

export interface PublishResult {
  url: string;
  logs: string[];
}

export interface PublisherContext {
  accessToken?: string;
  templateName?: string;
}

export interface Publisher {
  id: string;
  label: string;
  authenticate(): Promise<string>;
  publish(rendered: RenderedTemplate, context: PublisherContext): Promise<PublishResult>;
}
