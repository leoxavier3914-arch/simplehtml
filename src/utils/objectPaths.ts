export function getValue(path: string, source: Record<string, unknown>): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function setValue(path: string, target: Record<string, unknown>, value: unknown): Record<string, unknown> {
  const segments = path.split(".");
  let cursor: Record<string, unknown> = target;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }

    if (!cursor[segment] || typeof cursor[segment] !== "object") {
      cursor[segment] = {};
    }

    cursor = cursor[segment] as Record<string, unknown>;
  });

  return target;
}

export function deleteValue(path: string, target: Record<string, unknown>) {
  const segments = path.split(".");
  let cursor: Record<string, unknown> = target;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      delete cursor[segment];
      return;
    }

    if (!cursor[segment] || typeof cursor[segment] !== "object") {
      cursor = {};
      return;
    }

    cursor = cursor[segment] as Record<string, unknown>;
  });
}
