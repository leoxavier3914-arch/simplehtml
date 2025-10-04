import { useEffect, useMemo, useRef, useState } from "react";
import type { RenderedTemplate } from "@/core/template";
import { FloatingPreviewWindow } from "./FloatingPreviewWindow";

interface PreviewPanelProps {
  rendered: RenderedTemplate | null;
}

type ViewMode = "desktop" | "mobile";

export function PreviewPanel({ rendered }: PreviewPanelProps) {
  const [mode, setMode] = useState<ViewMode>("desktop");
  const [isDetached, setIsDetached] = useState(false);

  const html = useMemo(() => buildPreviewHtml(rendered), [rendered]);

  return (
    <>
      <aside className={`preview preview-${mode}`}>
        <header>
          <div className="preview-heading">
            <h2>Preview</h2>
            <button type="button" onClick={() => setIsDetached((current) => !current)}>
              {isDetached ? "Recolocar" : "Destacar"}
            </button>
          </div>
          <ModeSelector mode={mode} onChange={setMode} />
        </header>
        <div className="preview-surface">
          {isDetached ? (
            <div className="preview-detached" role="status">
              <p>A pré-visualização está aberta em uma janela flutuante.</p>
              <button type="button" onClick={() => setIsDetached(false)}>
                Recolocar preview
              </button>
            </div>
          ) : (
            <PreviewViewport mode={mode} html={html} />
          )}
        </div>
      </aside>

      {isDetached && (
        <FloatingPreviewWindow title="Preview" onClose={() => setIsDetached(false)}>
          <div className="floating-preview-controls">
            <ModeSelector mode={mode} onChange={setMode} />
          </div>
          <div className={`floating-preview-surface preview-${mode}`}>
            <PreviewViewport mode={mode} html={html} />
          </div>
        </FloatingPreviewWindow>
      )}
    </>
  );
}

interface ModeSelectorProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="modes">
      <button type="button" className={mode === "desktop" ? "active" : ""} onClick={() => onChange("desktop")}>
        Desktop
      </button>
      <button type="button" className={mode === "mobile" ? "active" : ""} onClick={() => onChange("mobile")}>
        Mobile
      </button>
    </div>
  );
}

interface PreviewViewportProps {
  mode: ViewMode;
  html: string | undefined;
}

function PreviewViewport({ mode, html }: PreviewViewportProps) {
  const iframeRef = useIframe(html);

  if (mode === "desktop") {
    return (
      <div className="browser-preview">
        <div className="browser-toolbar" aria-hidden="true">
          <div className="browser-buttons" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="browser-address" aria-label="Endereço">
            <span>https://preview.local</span>
          </div>
          <div className="browser-actions" aria-hidden="true">
            <span />
            <span />
          </div>
        </div>
        <div className="browser-content">
          <iframe ref={iframeRef} title="Preview" sandbox="allow-same-origin allow-forms allow-scripts" />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-preview">
      <div className="mobile-notch" aria-hidden="true" />
      <iframe ref={iframeRef} title="Preview" sandbox="allow-same-origin allow-forms allow-scripts" />
    </div>
  );
}

function useIframe(html: string | undefined) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    iframeRef.current.srcdoc = html ?? "<p>Pré-visualização indisponível</p>";
  }, [html]);

  return iframeRef;
}

function buildPreviewHtml(rendered: RenderedTemplate | null): string | undefined {
  if (!rendered) return undefined;
  const main = rendered.files.find((file) => file.path.endsWith("index.html")) ?? rendered.files[0];
  if (!main) return undefined;

  let html = main.contents;

  for (const file of rendered.files) {
    if (file === main) continue;
    if (file.path.endsWith(".css")) {
      html = replaceLinkWithInline(html, file.path, `<style>${file.contents}</style>`);
    }
    if (file.path.endsWith(".js") || file.path.endsWith(".mjs")) {
      html = replaceScriptWithInline(html, file.path, `<script>${file.contents}</script>`);
    }
  }

  return html;
}

function replaceLinkWithInline(html: string, assetPath: string, replacement: string) {
  const pattern = new RegExp(`<link[^>]+href=["']${escapeRegExp(assetPath)}["'][^>]*>`, "gi");
  return html.replace(pattern, replacement);
}

function replaceScriptWithInline(html: string, assetPath: string, replacement: string) {
  const pattern = new RegExp(`<script[^>]+src=["']${escapeRegExp(assetPath)}["'][^>]*></script>`, "gi");
  return html.replace(pattern, replacement);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
