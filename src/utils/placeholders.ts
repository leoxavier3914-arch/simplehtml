export type PlaceholderTransformer = (input: string, values: Record<string, string>) => string;

export function flattenConfig(config: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(config).forEach(([key, value]) => {
    const dotted = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenConfig(value as Record<string, unknown>, dotted));
      return;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[dotted] = String(value);
    }
  });

  return result;
}

export const defaultTransformer: PlaceholderTransformer = (input, values) => {
  let output = input;
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g");
    output = output.replace(pattern, value);
  }
  return output;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
