import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import type { TemplateFile } from "@/core/template";
import type { TemplateSchema } from "@/types/schema";

const RESERVED_FILES = new Set(["schema.json", "config.json", "config.sample.json"]);

type FsEntry = {
  name: string;
  path: string;
  isDirectory?: boolean;
};

function joinPath(base: string, file: string) {
  const normalized = base.replace(/\\/g, "/");
  if (normalized.endsWith("/")) {
    return `${normalized}${file}`;
  }
  return `${normalized}/${file}`;
}

export async function loadTemplateFiles(templatePath: string): Promise<TemplateFile[]> {
  const normalizedBase = templatePath.replace(/\\/g, "/");
  const files: TemplateFile[] = [];

  async function walk(path: string) {
    const entries = (await readDir(path)) as unknown as FsEntry[];

    for (const entry of entries) {
      const entryPath = entry.path.replace(/\\/g, "/");
      if (entry.isDirectory) {
        await walk(entryPath);
        continue;
      }

      if (RESERVED_FILES.has(entry.name)) {
        continue;
      }

      const contents = await readTextFile(entryPath);
      const relativePath = entryPath.replace(`${normalizedBase}/`, "");
      files.push({ path: relativePath, contents });
    }
  }

  await walk(templatePath);

  return files;
}

export async function loadSchema(templatePath: string): Promise<TemplateSchema> {
  const schemaRaw = await readTextFile(joinPath(templatePath, "schema.json"));
  return JSON.parse(schemaRaw) as TemplateSchema;
}

export async function loadDefaultConfig(templatePath: string): Promise<Record<string, unknown> | undefined> {
  try {
    const contents = await readTextFile(joinPath(templatePath, "config.json"));
    return JSON.parse(contents) as Record<string, unknown>;
  } catch (error) {
    console.warn("Nenhum config.json encontrado, iniciando vazio", error);
    return undefined;
  }
}
