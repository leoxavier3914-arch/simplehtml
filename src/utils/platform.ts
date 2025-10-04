export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as WindowWithTauri).__TAURI_INTERNALS__);
}

interface WindowWithTauri extends Window {
  __TAURI_INTERNALS__?: unknown;
}
