import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

interface FloatingPreviewWindowProps {
  title: string;
  onClose: () => void;
  variant?: "window" | "fullscreen";
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export function FloatingPreviewWindow({ title, onClose, children, variant = "window" }: PropsWithChildren<FloatingPreviewWindowProps>) {
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 560, height: 640 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 560, height: 640 });
  const container = useMemo(() => document.createElement("div"), []);
  const windowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  useEffect(() => {
    if (variant !== "fullscreen") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [variant]);

  useEffect(() => {
    if (variant !== "window") return;

    function handleMouseMove(event: MouseEvent) {
      if (isDragging) {
        const bounds = windowRef.current?.getBoundingClientRect();
        const width = bounds?.width ?? size.width;
        const height = bounds?.height ?? size.height;
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        const nextX = event.clientX - dragOffset.current.x;
        const nextY = event.clientY - dragOffset.current.y;

        setPosition({
          x: Math.min(Math.max(0, nextX), Math.max(0, maxX)),
          y: Math.min(Math.max(0, nextY), Math.max(0, maxY)),
        });
      }

      if (isResizing) {
        const deltaX = event.clientX - resizeStart.current.x;
        const deltaY = event.clientY - resizeStart.current.y;
        const rawWidth = resizeStart.current.width + deltaX;
        const rawHeight = resizeStart.current.height + deltaY;
        const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - position.x - 16);
        const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - position.y - 16);

        setSize({
          width: Math.min(Math.max(MIN_WIDTH, rawWidth), maxWidth),
          height: Math.min(Math.max(MIN_HEIGHT, rawHeight), maxHeight),
        });
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
      setIsResizing(false);
    }

    if (!isDragging && !isResizing) {
      return;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, position.x, position.y, size.height, size.width, variant]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (variant !== "window") return;
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

  function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (variant !== "window") return;
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      width: size.width,
      height: size.height,
    };
  }

  if (variant === "fullscreen") {
    return createPortal(
      <div className="floating-window-overlay floating-window-overlay-fullscreen" role="dialog" aria-modal="true">
        <div ref={windowRef} className="floating-window floating-window-fullscreen">
          <header className="floating-window-title">
            <span>{title}</span>
            <button type="button" onClick={onClose} aria-label="Fechar preview">
              ×
            </button>
          </header>
          <div className="floating-window-content floating-window-content-fullscreen">{children}</div>
        </div>
      </div>,
      container
    );
  }

  return createPortal(
    <div className="floating-window-overlay" role="presentation">
      <div
        ref={windowRef}
        className={`floating-window${isDragging ? " dragging" : ""}${isResizing ? " resizing" : ""}`}
        style={{ top: position.y, left: position.x, width: size.width, height: size.height }}
      >
        <header className="floating-window-title" onPointerDown={handlePointerDown}>
          <span>{title}</span>
          <button type="button" onClick={onClose} aria-label="Fechar preview">
            ×
          </button>
        </header>
        <div className="floating-window-content">
          {children}
          <div className="floating-window-resize-handle" onPointerDown={handleResizePointerDown} />
        </div>
      </div>
    </div>,
    container
  );
}
