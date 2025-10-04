import type { FormProvider, FormProviderResult } from "@/core/formProvider";

export class NetlifyFormsProvider implements FormProvider {
  readonly metadata = {
    id: "netlifyForms",
    label: "Netlify Forms",
    description: "Habilita captura automática de formulários no Netlify.",
  } as const;

  async prepare(currentConfig: Record<string, unknown>): Promise<FormProviderResult> {
    const formConfig = (currentConfig["form"] as Record<string, unknown> | undefined) ?? {};
    return {
      configPatch: {
        form: {
          ...formConfig,
          provider: this.metadata.id,
          netlify: {
            ...(formConfig["netlify"] as Record<string, unknown> | undefined),
            dataNetlify: true,
          },
        },
      },
      helpText: "Certifique-se de que o formulário possua o atributo data-netlify=\"true\".",
    };
  }
}
