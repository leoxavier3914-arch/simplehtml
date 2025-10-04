import { useMemo, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useProject } from "@/state/ProjectContext";
import { NetlifyPublisher } from "@/services/publishers/netlifyPublisher";
import { isTauriEnvironment } from "@/utils/platform";

interface WindowWithDirectoryPicker extends Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

export function TopBar() {
  const {
    project,
    rendered,
    selectTemplate,
    selectTemplateFromHandle,
    saveConfigTo,
    loadConfigFrom,
    recordLog,
    updatePublisherUrl,
  } = useProject();
  const [publishing, setPublishing] = useState(false);
  const publisher = useMemo(() => new NetlifyPublisher(), []);
  const tauriAvailable = isTauriEnvironment();

  const handleOpenTemplate = async () => {
    if (tauriAvailable) {
      const selection = await open({ directory: true, multiple: false, title: "Selecione a pasta do template" });
      if (typeof selection === "string") {
        await selectTemplate(selection);
      }
      return;
    }

    const withPicker = window as WindowWithDirectoryPicker;
    if (withPicker.showDirectoryPicker) {
      try {
        const handle = await withPicker.showDirectoryPicker();
        await selectTemplateFromHandle(handle);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          recordLog({ type: "error", message: `Falha ao abrir template: ${(error as Error).message}` });
        }
      }
    } else {
      recordLog({ type: "error", message: "Seleção de diretório não suportada neste navegador." });
    }
  };

  const handleSaveConfig = async () => {
    if (!project) return;
    if (!tauriAvailable) {
      recordLog({ type: "warning", message: "Salvar configuração está disponível apenas no aplicativo desktop." });
      return;
    }
    const filePath = await save({
      title: "Salvar config.json",
      defaultPath: project?.templatePath ? `${project.templatePath}/config.json` : "config.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (filePath) {
      await saveConfigTo(filePath);
    }
  };

  const handleExportZip = async () => {
    if (!rendered) {
      recordLog({ type: "warning", message: "Nenhuma renderização disponível" });
      return;
    }

    if (!tauriAvailable) {
      recordLog({ type: "warning", message: "Exportar ZIP está disponível apenas no aplicativo desktop." });
      return;
    }

    const outputPath = await save({
      title: "Exportar landing page",
      defaultPath: `${project?.name ?? "landing"}.zip`,
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    });

    if (!outputPath) return;

    await invoke("export_rendered_zip", {
      files: rendered.files,
      outputPath,
    });

    recordLog({ type: "success", message: `ZIP exportado para ${outputPath}` });
  };

  const handlePublish = async () => {
    if (!rendered || !project) {
      recordLog({ type: "warning", message: "Carregue um template antes de publicar." });
      return;
    }

    setPublishing(true);
    recordLog({ type: "info", message: "Iniciando publicação na Netlify..." });

    try {
      const result = await publisher.publish(rendered, {
        templateName: project.name,
      });
      updatePublisherUrl(result.url);
      result.logs.forEach((log) => recordLog({ type: "info", message: log }));
      recordLog({ type: "success", message: `Publicado com sucesso: ${result.url}` });
    } catch (error) {
      const typed = error as Error & { logs?: string[] };
      typed.logs?.forEach((log) => recordLog({ type: "error", message: log }));
      recordLog({ type: "error", message: typed.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleLoadConfig = async () => {
    if (!project) return;
    if (!tauriAvailable) {
      recordLog({ type: "warning", message: "Abrir config está disponível apenas no aplicativo desktop." });
      return;
    }
    const selection = await open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
    if (typeof selection === "string") {
      await loadConfigFrom(selection);
    }
  };

  return (
    <header className="top-bar">
      <div className="logo">simplehtml Studio</div>
      <div className="actions">
        <button onClick={handleOpenTemplate}>Abrir Template</button>
        <button
          onClick={handleLoadConfig}
          disabled={!project || !tauriAvailable}
          title={!tauriAvailable ? "Disponível apenas no aplicativo desktop." : undefined}
        >
          Abrir Config
        </button>
        <button
          onClick={handleSaveConfig}
          disabled={!project || !tauriAvailable}
          title={!tauriAvailable ? "Disponível apenas no aplicativo desktop." : undefined}
        >
          Salvar
        </button>
        <button
          onClick={handleExportZip}
          disabled={!rendered || !tauriAvailable}
          title={!tauriAvailable ? "Disponível apenas no aplicativo desktop." : undefined}
        >
          Exportar ZIP
        </button>
        <button onClick={handlePublish} disabled={!rendered || publishing}>
          {publishing ? "Publicando..." : "Publicar"}
        </button>
      </div>
      {project?.publisherUrl && (
        <div className="publish-result">
          Publicado em:
          <a href={project.publisherUrl} target="_blank" rel="noreferrer">
            {project.publisherUrl}
          </a>
        </div>
      )}
    </header>
  );
}
