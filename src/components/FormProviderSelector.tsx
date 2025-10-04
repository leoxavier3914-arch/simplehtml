import { useMemo } from "react";
import type { SchemaField } from "@/types/schema";
import { useProject } from "@/state/ProjectContext";
import { FormspreeProvider } from "@/services/formProviders/formspreeProvider";
import { NetlifyFormsProvider } from "@/services/formProviders/netlifyFormsProvider";
import { getValue } from "@/utils/objectPaths";

const rawProviders = [
  { id: "none", label: "Nenhum" },
  new FormspreeProvider(),
  new NetlifyFormsProvider(),
] as const;

type ProviderOption = {
  id: string;
  label: string;
  description?: string;
};

export function FormProviderSelector() {
  const { project, applyConfigPatch, recordLog } = useProject();
  const currentProvider = (project && (getValue("form.provider", project.config) as string)) ?? "none";

  const options = useMemo<ProviderOption[]>(
    () =>
      rawProviders.map((provider) => {
        if ("metadata" in provider) {
          return {
            id: provider.metadata.id,
            label: provider.metadata.label,
            description: provider.metadata.description,
          } satisfies ProviderOption;
        }

        return { id: provider.id, label: provider.label } satisfies ProviderOption;
      }),
    [],
  );

  const handleProviderChange = async (providerId: string) => {
    if (providerId === "none") {
      await applyConfigPatch({ form: { provider: null, endpoint: "", netlify: { dataNetlify: false } } });
      recordLog({ type: "info", message: "Formulário desabilitado" });
      return;
    }

    const provider = rawProviders.find((candidate) => "metadata" in candidate && candidate.metadata.id === providerId);
    if (provider && "prepare" in provider) {
      const result = await provider.prepare(project?.config ?? {});
      await applyConfigPatch(result.configPatch);
      if (result.helpText) {
        recordLog({ type: "info", message: result.helpText });
      }
    }
  };

  const field: SchemaField = {
    key: "form.provider",
    label: "Fornecedor de formulário",
    type: "select",
  };

  return (
    <div className="form-provider-selector">
      <label htmlFor="form-provider">{field.label}</label>
      <select id="form-provider" value={currentProvider ?? "none"} onChange={(event) => handleProviderChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {(() => {
        const selected = options.find((option) => option.id === currentProvider);
        if (!selected?.description) {
          return null;
        }
        return (
          <p key={selected.id} className="helper">
            {selected.description}
          </p>
        );
      })()}
    </div>
  );
}
