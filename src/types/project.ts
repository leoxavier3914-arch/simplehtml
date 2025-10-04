import type { TemplateSchema } from "@/types/schema";

export interface ProjectFileReference {
  templatePath: string;
  schemaPath: string;
  defaultConfigPath?: string;
}

export interface ProjectState {
  name: string;
  templatePath: string;
  schema?: TemplateSchema;
  config: Record<string, unknown>;
  lastSavedAt?: string;
  publisherUrl?: string;
}

export interface LogEntry {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
}
