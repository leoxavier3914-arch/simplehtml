import { useMemo, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useProject } from "@/state/ProjectContext";
import { NetlifyPublisher } from "@/services/publishers/netlifyPublisher";

export function TopBar() {
  const { project, rendered, selectTemplate, saveConfigTo, loadConfigFrom, recordLog, updatePublisherUrl } = useProject();
  const [publishing, setPublishing] = useState(false);
  const publisher = useMemo(() => new NetlifyPublisher(), []);

  const handleOpenTemplate = async () => {
    const selection = await open({ directory: true, multiple: false, title: "Selecione a pasta do template" });
    if (typeof selection === "string") {
      await selectTemplate(selection);
    }
  };

  const handleSaveConfig = async () => {
    if (!project) return;
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
        <button onClick={handleLoadConfig} disabled={!project}>
          Abrir Config
        </button>
        <button onClick={handleSaveConfig} disabled={!project}>
          Salvar
        </button>
        <button onClick={handleExportZip} disabled={!rendered}>
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
