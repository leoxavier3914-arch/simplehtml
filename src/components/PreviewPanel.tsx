import { useEffect, useMemo, useRef, useState } from "react";
import type { RenderedTemplate } from "@/core/template";

interface PreviewPanelProps {
  rendered: RenderedTemplate | null;
}

type ViewMode = "desktop" | "mobile";

export function PreviewPanel({ rendered }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mode, setMode] = useState<ViewMode>("desktop");

  const html = useMemo(() => buildPreviewHtml(rendered), [rendered]);

  useEffect(() => {
    if (!iframeRef.current) return;
    iframeRef.current.srcdoc = html ?? "<p>Pré-visualização indisponível</p>";
  }, [html]);

  return (
    <aside className={`preview preview-${mode}`}>
      <header>
        <h2>Preview</h2>
        <div className="modes">
          <button className={mode === "desktop" ? "active" : ""} onClick={() => setMode("desktop")}>
            Desktop
          </button>
          <button className={mode === "mobile" ? "active" : ""} onClick={() => setMode("mobile")}>
            Mobile
          </button>
        </div>
      </header>
      <div className="preview-surface">
        <iframe ref={iframeRef} title="Preview" sandbox="allow-same-origin allow-forms allow-scripts" />
      </div>
    </aside>
  );
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
