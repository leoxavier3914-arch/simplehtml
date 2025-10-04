// ===============================================
// INSTRUÇÕES RÁPIDAS: este arquivo já está pronto.
// • Se você NÃO é programador(a), edite apenas o arquivo config.json
// • Para trocar fotos, coloque imagens em assets/images (veja TUTORIAL.txt)
// • Não precisa instalar nada. É só publicar a pasta no Netlify ou Vercel.
// ===============================================

(function applySiteConfig() {
  const fallbackConfig = {{ __CONFIG__ }};

  const applyConfig = (config) => {
    const currentConfig =
      typeof window.SITE_CONFIG === "object" && window.SITE_CONFIG !== null
        ? window.SITE_CONFIG
        : {};
    window.SITE_CONFIG = { ...fallbackConfig, ...currentConfig, ...config };
  };

  applyConfig();

  fetch("./config.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then((config) => {
      applyConfig(config);
    })
    .catch((error) => {
      console.warn("Não foi possível carregar config.json; usando configuração padrão.", error);
    });
})();
