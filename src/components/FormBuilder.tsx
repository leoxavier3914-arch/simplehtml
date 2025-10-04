import { useState } from "react";
import { z } from "zod";
import type { SchemaField, SchemaTab } from "@/types/schema";
import { useProject } from "@/state/ProjectContext";
import { getValue } from "@/utils/objectPaths";
import { open } from "@tauri-apps/plugin-dialog";

interface FormBuilderProps {
  tab: SchemaTab;
}

type FieldErrors = Record<string, string | undefined>;

function schemaForField(field: SchemaField) {
  let base: z.ZodTypeAny;

  switch (field.type) {
    case "textarea":
    case "text":
    case "richtext":
      base = z.string();
      if (!field.required) {
        base = base.optional().or(z.literal(""));
      }
      break;
    case "color":
      base = z
        .string()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor inválida (use formato hexadecimal)");
      if (!field.required) {
        base = base.optional().or(z.literal(""));
      }
      break;
    case "url":
      base = z.string().url("URL inválida");
      if (!field.required) {
        base = base.optional().or(z.literal(""));
      }
      break;
    case "number":
      base = z.coerce.number().refine((value) => !Number.isNaN(value), { message: "Informe um número" });
      if (!field.required) {
        base = base.optional();
      }
      break;
    case "boolean":
      base = z.coerce.boolean();
      if (!field.required) {
        base = base.optional();
      }
      break;
    case "image":
      base = z.string();
      if (!field.required) {
        base = base.optional().or(z.literal(""));
      }
      break;
    case "select":
      base = z.string();
      if (!field.required) {
        base = base.optional().or(z.literal(""));
      }
      break;
    default:
      base = z.any();
  }

  return base;
}

export function FormBuilder({ tab }: FormBuilderProps) {
  const { project, updateConfigValue } = useProject();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = async (field: SchemaField, rawValue: unknown) => {
    const schema = schemaForField(field);
    const result = schema.safeParse(rawValue);

    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field.key]: result.error.issues[0]?.message ?? "Valor inválido" }));
      return;
    }

    setErrors((prev) => ({ ...prev, [field.key]: undefined }));
    await updateConfigValue(field, result.data ?? "");
  };

  const handleImageClick = async (field: SchemaField) => {
    const selection = await open({ multiple: false, title: `Selecione imagem para ${field.label}`, directory: false });
    if (typeof selection === "string") {
      await handleChange(field, selection);
    }
  };

  return (
    <div className="form-builder">
      {tab.groups.map((group) => (
        <section key={group.id} className="form-group">
          <header>
            <h3>{group.label}</h3>
            {group.description && <p className="description">{group.description}</p>}
          </header>
          <div className="group-fields">
            {group.fields.map((field) => {
              const value = (project && (getValue(field.key, project.config) as unknown)) ?? "";
              const error = errors[field.key];

              return (
                <div key={field.key} className={`field field-${field.type}`}>
                  <label>
                    <span>{field.label}</span>
                    {renderInput(field, value, (next) => handleChange(field, next), () => handleImageClick(field))}
                  </label>
                  {field.helperText && <small className="helper">{field.helperText}</small>}
                  {error && <small className="error">{error}</small>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function renderInput(
  field: SchemaField,
  value: unknown,
  onChange: (value: unknown) => void,
  onPickImage: () => void,
) {
  const commonProps = {
    placeholder: field.placeholder,
    "aria-label": field.label,
  } as const;

  switch (field.type) {
    case "textarea":
    case "richtext":
      return <textarea {...commonProps} value={(value as string) ?? ""} onChange={(event) => onChange(event.target.value)} rows={4} />;
    case "color":
      return <input {...commonProps} type="color" value={(value as string) ?? "#000000"} onChange={(event) => onChange(event.target.value)} />;
    case "url":
    case "text":
      return <input {...commonProps} type="text" value={(value as string) ?? ""} onChange={(event) => onChange(event.target.value)} />;
    case "number":
      return <input {...commonProps} type="number" value={value as number | string} onChange={(event) => onChange(event.target.value)} />;
    case "boolean":
      return <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />;
    case "select":
      return (
        <select value={(value as string) ?? ""} onChange={(event) => onChange(event.target.value)}>
          <option value="">Selecione...</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "image":
      return (
        <div className="file-picker">
          <input
            {...commonProps}
            type="text"
            value={(value as string) ?? ""}
            onChange={(event) => onChange(event.target.value)}
          />
          <button type="button" onClick={onPickImage}>
            Selecionar arquivo
          </button>
        </div>
      );
    default:
      return <input {...commonProps} type="text" value={(value as string) ?? ""} onChange={(event) => onChange(event.target.value)} />;
  }
}
