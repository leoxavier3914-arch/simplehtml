import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { TemplateEngine, TemplateFile } from "@/core/template";
import type { RenderedTemplate, TemplateConfig } from "@/core/template";
import type { TemplateSchema, SchemaField } from "@/types/schema";
import type { LogEntry, ProjectState } from "@/types/project";
import { SimpleTemplateEngine } from "@/services/simpleTemplateEngine";
import {
  loadDefaultConfig,
  loadDefaultConfigFromHandle,
  loadSchema,
  loadSchemaFromHandle,
  loadTemplateFiles,
  loadTemplateFilesFromHandle,
} from "@/services/templateLoader";
import { autoGenerateTemplate } from "@/services/autoTemplateGenerator";
import { setValue } from "@/utils/objectPaths";
import { v4 as uuid } from "uuid";

interface ProjectContextValue {
  project: ProjectState | null;
  rendered: RenderedTemplate | null;
  templateFiles: TemplateFile[];
  logs: LogEntry[];
  loading: boolean;
  selectTemplate: (templatePath: string) => Promise<void>;
  selectTemplateFromHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  updateConfigValue: (field: SchemaField, value: unknown) => Promise<void>;
  applyConfigPatch: (patch: Record<string, unknown>) => Promise<void>;
  saveConfigTo: (filePath: string) => Promise<void>;
  loadConfigFrom: (filePath: string) => Promise<void>;
  updatePublisherUrl: (url: string | undefined) => void;
  recordLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const templateEngine: TemplateEngine = new SimpleTemplateEngine();

function createLog(type: LogEntry["type"], message: string): LogEntry {
  return {
    id: uuid(),
    type,
    message,
    timestamp: new Date().toISOString(),
  };
}

function schemaDefaults(schema: TemplateSchema): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  schema.tabs.forEach((tab) => {
    tab.groups.forEach((group) => {
      group.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          setValue(field.key, config, field.defaultValue);
        }
      });
    });
  });

  return config;
}

function mergeDeep(target: Record<string, unknown>, patch: Record<string, unknown>) {
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      mergeDeep(target[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  });
}

function cloneConfig(config: Record<string, unknown>) {
  if (typeof structuredClone === "function") {
    return structuredClone(config);
  }
  return JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [rendered, setRendered] = useState<RenderedTemplate | null>(null);
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const recordLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => [createLog(entry.type, entry.message), ...prev].slice(0, 100));
  }, []);

  const reRender = useCallback(
    async (config: TemplateConfig, files = templateFiles) => {
      if (!project) return;
      const renderedTemplate = await templateEngine.render(files, config);
      setRendered(renderedTemplate);
    },
    [project, templateFiles],
  );

  const selectTemplate = useCallback(
    async (templatePath: string) => {
      setLoading(true);
      try {
        recordLog({ type: "info", message: `Carregando template em ${templatePath}` });
        const originalFiles = await loadTemplateFiles(templatePath);
        let files = originalFiles;
        let schema: TemplateSchema;
        let defaults: Record<string, unknown> | undefined;

        try {
          schema = await loadSchema(templatePath);
          defaults = await loadDefaultConfig(templatePath);
        } catch (schemaError) {
          console.warn("Falha ao carregar schema.json, iniciando geração automática", schemaError);
          recordLog({
            type: "warning",
            message: "schema.json ausente ou inválido. Gerando campos automaticamente.",
          });
          const generated = autoGenerateTemplate(templatePath, originalFiles);
          schema = generated.schema;
          defaults = generated.config;
          files = generated.files;
        }

        const baseConfig = schemaDefaults(schema);
        if (defaults) {
          mergeDeep(baseConfig, defaults);
        }

        const state: ProjectState = {
          name: schema.templateName,
          templatePath,
          schema,
          config: baseConfig,
          publisherUrl: undefined,
        };

        setProject(state);
        setTemplateFiles(files);
        await reRender(baseConfig, files);
        recordLog({ type: "success", message: "Template carregado com sucesso." });
      } catch (error) {
        console.error(error);
        recordLog({ type: "error", message: `Falha ao carregar template: ${(error as Error).message}` });
      } finally {
        setLoading(false);
      }
    },
    [recordLog, reRender],
  );

  const selectTemplateFromHandle = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setLoading(true);
      try {
        const templateLabel = handle.name ?? "template";
        recordLog({ type: "info", message: `Carregando template do navegador (${templateLabel})` });
        const originalFiles = await loadTemplateFilesFromHandle(handle);
        let files = originalFiles;
        let schema: TemplateSchema;
        let defaults: Record<string, unknown> | undefined;

        try {
          schema = await loadSchemaFromHandle(handle);
          defaults = await loadDefaultConfigFromHandle(handle);
        } catch (schemaError) {
          console.warn("Falha ao carregar schema.json do diretório selecionado, gerando automaticamente", schemaError);
          recordLog({
            type: "warning",
            message: "schema.json ausente ou inválido. Gerando campos automaticamente.",
          });
          const generated = autoGenerateTemplate(templateLabel, originalFiles);
          schema = generated.schema;
          defaults = generated.config;
          files = generated.files;
        }

        const baseConfig = schemaDefaults(schema);
        if (defaults) {
          mergeDeep(baseConfig, defaults);
        }

        const state: ProjectState = {
          name: schema.templateName,
          templatePath: `browser:${templateLabel}`,
          schema,
          config: baseConfig,
          publisherUrl: undefined,
        };

        setProject(state);
        setTemplateFiles(files);
        await reRender(baseConfig, files);
        recordLog({ type: "success", message: "Template carregado com sucesso." });
      } catch (error) {
        console.error(error);
        recordLog({ type: "error", message: `Falha ao carregar template: ${(error as Error).message}` });
      } finally {
        setLoading(false);
      }
    },
    [recordLog, reRender],
  );

  const updateConfigValue = useCallback(
    async (field: SchemaField, value: unknown) => {
      if (!project) return;
      const newConfig = cloneConfig(project.config);
      setValue(field.key, newConfig, value);

      const updatedState: ProjectState = {
        ...project,
        config: newConfig,
      };

      setProject(updatedState);
      await reRender(newConfig);
    },
    [project, reRender],
  );

  const applyConfigPatch = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!project) return;
      const newConfig = cloneConfig(project.config);
      mergeDeep(newConfig, patch);
      setProject({ ...project, config: newConfig });
      await reRender(newConfig);
    },
    [project, reRender],
  );

  const saveConfigTo = useCallback(
    async (filePath: string) => {
      if (!project) return;
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      await writeTextFile(filePath, JSON.stringify(project.config, null, 2));
      setProject({ ...project, lastSavedAt: new Date().toISOString() });
      recordLog({ type: "success", message: `Configuração salva em ${filePath}` });
    },
    [project, recordLog],
  );

  const loadConfigFrom = useCallback(
    async (filePath: string) => {
      if (!project) return;
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const contents = await readTextFile(filePath);
      const parsed = JSON.parse(contents) as Record<string, unknown>;
      setProject({ ...project, config: parsed });
      await reRender(parsed);
      recordLog({ type: "success", message: `Configuração carregada de ${filePath}` });
    },
    [project, reRender, recordLog],
  );

  const updatePublisherUrl = useCallback(
    (url: string | undefined) => {
      setProject((current) => (current ? { ...current, publisherUrl: url } : current));
    },
    [],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      rendered,
      templateFiles,
      logs,
      loading,
      selectTemplate,
      selectTemplateFromHandle,
      updateConfigValue,
      applyConfigPatch,
      saveConfigTo,
      loadConfigFrom,
      updatePublisherUrl,
      recordLog,
    }),
    [
      project,
      rendered,
      templateFiles,
      logs,
      loading,
      selectTemplate,
      selectTemplateFromHandle,
      updateConfigValue,
      applyConfigPatch,
      saveConfigTo,
      loadConfigFrom,
      updatePublisherUrl,
      recordLog,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject deve ser usado dentro de ProjectProvider");
  }
  return context;
}
