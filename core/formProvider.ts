export interface FormProviderMetadata {
  id: string;
  label: string;
  description?: string;
}

export interface FormProviderResult {
  configPatch: Record<string, unknown>;
  helpText?: string;
}

export interface FormProvider {
  readonly metadata: FormProviderMetadata;
  prepare(currentConfig: Record<string, unknown>): Promise<FormProviderResult>;
}
