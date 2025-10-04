import { invoke } from "@tauri-apps/api/core";

export async function saveToken(service: string, account: string, token: string) {
  await invoke("save_token", { service, account, token });
}

export async function loadToken(service: string, account: string) {
  return (await invoke<string | null>("load_token", { service, account })) ?? null;
}

export async function deleteToken(service: string, account: string) {
  await invoke("delete_token", { service, account });
}
