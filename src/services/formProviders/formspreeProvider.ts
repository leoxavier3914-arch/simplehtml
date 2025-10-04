import type { FormProvider, FormProviderResult } from "@/core/formProvider";

export class FormspreeProvider implements FormProvider {
  readonly metadata = {
    id: "formspree",
    label: "Formspree",
    description: "Envia formulários para um endpoint Formspree",
  } as const;

  async prepare(currentConfig: Record<string, unknown>): Promise<FormProviderResult> {
    const endpoint = (currentConfig["form"] as Record<string, unknown> | undefined)?.["endpoint"] ?? "";
    return {
      configPatch: {
        form: {
          provider: this.metadata.id,
          endpoint,
        },
      },
      helpText: "Informe o endpoint Formspree no painel de formulário.",
    };
  }
}
