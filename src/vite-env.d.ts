/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_NETLIFY_CLIENT_ID?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
