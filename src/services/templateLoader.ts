import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import type { TemplateFile } from "@/core/template";
import type { TemplateSchema } from "@/types/schema";

const RESERVED_FILES = new Set(["schema.json", "config.json", "config.sample.json"]);

type DirectoryHandle = FileSystemDirectoryHandle;
type FileHandle = FileSystemFileHandle;
type GenericHandle = FileSystemHandle & { name?: string };

async function readFileFromHandle(handle: FileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

async function* iterateDirectory(
  directory: DirectoryHandle,
): AsyncGenerator<[string, FileSystemHandle]> {
  const iterator = directory as unknown as {
    entries?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
    values?: () => AsyncIterableIterator<FileSystemHandle>;
    [Symbol.asyncIterator]?: () => AsyncIterableIterator<FileSystemHandle>;
  };

  if (iterator.entries) {
    for await (const entry of iterator.entries()) {
      yield entry;
    }
    return;
  }

  if (iterator.values) {
    for await (const entry of iterator.values()) {
      const handle = entry as GenericHandle;
      yield [handle.name ?? "", entry];
    }
    return;
  }

  const asyncIterator = iterator[Symbol.asyncIterator];
  if (asyncIterator) {
    let index = 0;
    for await (const entry of asyncIterator.call(iterator)) {
      const handle = entry as GenericHandle;
      const name = handle.name ?? `entry-${index++}`;
      yield [name, entry];
    }
  }
}

async function findFileHandle(directory: DirectoryHandle, fileName: string): Promise<FileHandle | undefined> {
  if ("getFileHandle" in directory) {
    try {
      return await directory.getFileHandle(fileName);
    } catch (error) {
      if ((error as DOMException).name !== "NotFoundError") {
        throw error;
      }
    }
  }

  for await (const [name, entry] of iterateDirectory(directory)) {
    if (entry.kind === "file" && name === fileName) {
      return entry as FileHandle;
    }
  }

  return undefined;
}

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

export async function loadTemplateFilesFromHandle(handle: DirectoryHandle): Promise<TemplateFile[]> {
  const files: TemplateFile[] = [];

  async function walk(directory: DirectoryHandle, prefix: string) {
    for await (const [name, entry] of iterateDirectory(directory)) {
      if (entry.kind === "directory") {
        await walk(entry as DirectoryHandle, `${prefix}${name}/`);
        continue;
      }

      if (entry.kind === "file") {
        const fileHandle = entry as FileHandle;
        if (RESERVED_FILES.has(name)) {
          continue;
        }

        const contents = await readFileFromHandle(fileHandle);
        files.push({ path: `${prefix}${name}`, contents });
      }
    }
  }

  await walk(handle, "");

  return files;
}

export async function loadSchemaFromHandle(handle: DirectoryHandle): Promise<TemplateSchema> {
  const fileHandle = await findFileHandle(handle, "schema.json");
  if (!fileHandle) {
    throw new Error("schema.json não encontrado no diretório selecionado");
  }

  const contents = await readFileFromHandle(fileHandle);
  return JSON.parse(contents) as TemplateSchema;
}

export async function loadDefaultConfigFromHandle(
  handle: DirectoryHandle,
): Promise<Record<string, unknown> | undefined> {
  const fileHandle = await findFileHandle(handle, "config.json");
  if (!fileHandle) {
    return undefined;
  }

  const contents = await readFileFromHandle(fileHandle);
  return JSON.parse(contents) as Record<string, unknown>;
}
