# simplehtml Studio

MVP desktop construído com **Tauri + React + Vite + TypeScript** para editar templates de landing pages estáticas a partir de um `config.json` e publicar em poucos cliques.

## Requisitos

- Node.js 18+
- Rust toolchain estável

## Instalação

```bash
npm install
```

## Desenvolvimento

Inicie o front-end (Vite) isolado:

```bash
npm run dev
```

Para executar o aplicativo desktop completo:

```bash
npm run tauri:dev
```

## Build

Gere o bundle de produção da interface:

```bash
npm run build
```

Crie o instalador desktop (Tauri build):

```bash
npm run tauri:build
```

## Fluxo de publicação (Netlify)

1. Carregue um template (ex.: `template-exemplo`).
2. Ajuste o formulário, cores, imagens e SEO pelo formulário dinâmico.
3. Clique em **Publicar** – o app iniciará o *device flow* do OAuth da Netlify. Autorize a aplicação no navegador.
4. Após a autorização, o deploy é enviado (ZIP gerado automaticamente) e a URL final aparece no topo da interface e no painel de logs.

> Para usar um client ID próprio da Netlify, defina `VITE_NETLIFY_CLIENT_ID` em um arquivo `.env` na raiz.

## Estrutura

```
/core              # Interfaces para engines, publishers e providers
/src               # Código React + serviços Tauri
/src-tauri         # Backend Tauri (Rust) com storage seguro e exportação ZIP
/template-exemplo  # Template HTML/CSS/JS de exemplo com schema/config
```

## Importação automática de landing pages

Agora é possível selecionar qualquer pasta com uma landing page estática (HTML/CSS/JS) mesmo que ela não possua
`schema.json` ou `config.json`. O Studio analisa os arquivos HTML, gera placeholders nos textos, imagens, links e metas,
monta um schema com campos correspondentes e cria um `config` inicial com os valores encontrados. Caso não seja possível
identificar campos específicos, ele cria um fallback permitindo editar o HTML bruto diretamente. Isso vale tanto para
pastas locais quanto para diretórios escolhidos pelo picker do navegador.

## Testes futuros

- Integrações adicionais (Vercel, Cloudflare Pages) // TODO
- Auxiliar de domínio/Cloudflare // TODO
