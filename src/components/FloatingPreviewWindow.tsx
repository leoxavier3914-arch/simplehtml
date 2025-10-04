import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

interface FloatingPreviewWindowProps {
  title: string;
  onClose: () => void;
}

export function FloatingPreviewWindow({ title, onClose, children }: PropsWithChildren<FloatingPreviewWindowProps>) {
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const container = useMemo(() => document.createElement("div"), []);
  const windowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!isDragging) return;
      const bounds = windowRef.current?.getBoundingClientRect();
      const width = bounds?.width ?? 0;
      const height = bounds?.height ?? 0;
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      const nextX = event.clientX - dragOffset.current.x;
      const nextY = event.clientY - dragOffset.current.y;

      setPosition({
        x: Math.min(Math.max(0, nextX), Math.max(0, maxX)),
        y: Math.min(Math.max(0, nextY), Math.max(0, maxY)),
      });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  return createPortal(
    <div className="floating-window-overlay" role="presentation">
      <div
        ref={windowRef}
        className={`floating-window ${isDragging ? "dragging" : ""}`}
        style={{ top: position.y, left: position.x }}
      >
        <header className="floating-window-title" onPointerDown={handlePointerDown}>
          <span>{title}</span>
          <button type="button" onClick={onClose} aria-label="Fechar preview">
            ×
          </button>
        </header>
        <div className="floating-window-content">{children}</div>
      </div>
    </div>,
    container
  );
}
