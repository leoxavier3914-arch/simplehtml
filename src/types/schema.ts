export type SchemaFieldType =
  | "text"
  | "textarea"
  | "color"
  | "image"
  | "select"
  | "url"
  | "number"
  | "boolean"
  | "richtext";

export interface SchemaOption {
  label: string;
  value: string;
}

export interface SchemaField {
  key: string;
  label: string;
  type: SchemaFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  options?: SchemaOption[];
}

export interface SchemaGroup {
  id: string;
  label: string;
  description?: string;
  fields: SchemaField[];
}

export interface SchemaTab {
  id: string;
  label: string;
  groups: SchemaGroup[];
}

export interface TemplateSchema {
  version: number;
  templateName: string;
  tabs: SchemaTab[];
}
