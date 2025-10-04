import { fetch } from "@tauri-apps/plugin-http";
import { open } from "@tauri-apps/plugin-shell";
import type { Publisher, PublishResult, PublisherContext } from "@/core/publisher";
import type { RenderedTemplate } from "@/core/template";
import { createZipBuffer } from "@/utils/zip";
import { deleteToken, loadToken, saveToken } from "@/services/secureStore";

interface DeviceAuthorizationResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface NetlifySite {
  id: string;
  name: string;
  ssl_url: string;
}

interface NetlifyDeploy {
  ssl_url: string;
  deploy_ssl_url?: string;
  state: string;
}

const NETLIFY_CLIENT_ID = import.meta.env.VITE_NETLIFY_CLIENT_ID ?? "8dfea53f24f0f605d6b0db1f60c3978b6c52b2f9f9f0b20b5316510d060f6324"; // public demo client
const DEVICE_AUTH_URL = "https://api.netlify.com/oauth/device_authorizations";
const TOKEN_URL = "https://api.netlify.com/oauth/token";
const SITES_URL = "https://api.netlify.com/api/v1/sites";
const SERVICE_NAME = "simplehtml-netlify";
const ACCOUNT = "default";

export class NetlifyPublisher implements Publisher {
  readonly id = "netlify";
  readonly label = "Netlify";

  async authenticate(): Promise<string> {
    return this.authenticateWithLogs([]);
  }

  async publish(rendered: RenderedTemplate, context: PublisherContext): Promise<PublishResult> {
    const logs: string[] = [];
    let token = context.accessToken ?? (await this.authenticateWithLogs(logs));

    try {
      const siteName = this.createSiteName(context.templateName);
      logs.push(`Criando site temporário ${siteName}...`);

      const createSite = async (authToken: string) =>
        fetch(SITES_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: siteName }),
        });

      let siteResponse = await createSite(token);
      if (siteResponse.status === 401) {
        logs.push("Token expirado. Reautenticando com a Netlify...");
        await deleteToken(SERVICE_NAME, ACCOUNT);
        token = await this.authenticateWithLogs(logs);
        siteResponse = await createSite(token);
      }

      if (!siteResponse.ok) {
        throw new Error("Falha ao criar site na Netlify.");
      }

      const site = (await siteResponse.json()) as NetlifySite;
      logs.push(`Site ${site.name} criado.`);

      const zipBuffer = await createZipBuffer(rendered.files);
      const zipArrayBuffer = zipBuffer.buffer.slice(
        zipBuffer.byteOffset,
        zipBuffer.byteOffset + zipBuffer.byteLength,
      ) as ArrayBuffer;
      const zipBlob = new Blob([zipArrayBuffer], { type: "application/zip" });
      logs.push("Enviando arquivos renderizados...");

      const deployResponse = await fetch(`${SITES_URL}/${site.id}/deploys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/zip",
        },
        body: zipBlob,
      });

      if (!deployResponse.ok) {
        throw new Error("Falha ao publicar deploy na Netlify.");
      }

      const deploy = (await deployResponse.json()) as NetlifyDeploy;
      logs.push(`Deploy estado: ${deploy.state}`);

      const url = deploy.deploy_ssl_url ?? deploy.ssl_url ?? site.ssl_url;
      logs.push(`Site disponível em ${url}`);

      return {
        url,
        logs,
      };
    } catch (error) {
      logs.push(`Erro: ${(error as Error).message}`);
      throw Object.assign(new Error("Falha na publicação"), { logs });
    }
  }

  private createSiteName(templateName?: string) {
    const slug = (templateName ?? "simplehtml").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `${slug}-${Date.now()}`;
  }

  private async authenticateWithLogs(logs: string[]): Promise<string> {
    const existing = await loadToken(SERVICE_NAME, ACCOUNT);
    if (existing) {
      logs.push("Token Netlify carregado do armazenamento seguro.");
      return existing;
    }

    const deviceResponse = await fetch(DEVICE_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: NETLIFY_CLIENT_ID,
        scope: "deploys",
      }),
    });

    if (!deviceResponse.ok) {
      throw new Error("Não foi possível iniciar a autenticação com a Netlify.");
    }

    const deviceData = (await deviceResponse.json()) as DeviceAuthorizationResponse;
    logs.push(`Autorize o acesso Netlify em ${deviceData.verification_uri_complete} (código: ${deviceData.user_code}).`);

    try {
      await open(deviceData.verification_uri_complete);
    } catch (error) {
      console.warn("Falha ao abrir navegador automaticamente", error);
    }

    const token = await this.pollForToken(deviceData);
    await saveToken(SERVICE_NAME, ACCOUNT, token);
    logs.push("Token Netlify salvo com sucesso.");
    return token;
  }

  private async pollForToken(device: DeviceAuthorizationResponse): Promise<string> {
    const start = Date.now();
    const expiresAt = start + device.expires_in * 1000;
    const interval = device.interval * 1000;

    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: NETLIFY_CLIENT_ID,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: device.device_code,
        }),
      });

      let parsed: TokenResponse | { error?: string } | null = null;
      try {
        parsed = (await response.json()) as TokenResponse | { error?: string };
      } catch (parseError) {
        console.warn("Resposta inesperada do token Netlify", parseError);
      }

      if (response.ok && parsed && "access_token" in parsed && parsed.access_token) {
        return parsed.access_token;
      }

      const error = parsed && "error" in parsed ? parsed.error : undefined;
      if (error === "authorization_pending" || error === "slow_down") {
        continue;
      }

      if (error) {
        throw new Error(`Erro na autenticação: ${error}`);
      }
    }

    throw new Error("Tempo de autenticação expirado. Tente novamente.");
  }
}
