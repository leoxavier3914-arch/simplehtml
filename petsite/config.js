// ===============================================
// INSTRUÇÕES RÁPIDAS: este arquivo já está pronto.
// • Se você NÃO é programador(a), edite apenas o arquivo config.json
// • Para trocar fotos, coloque imagens em assets/images (veja TUTORIAL.txt)
// • Não precisa instalar nada. É só publicar a pasta no Netlify ou Vercel.
// ===============================================

(function applySiteConfig() {
  const fallbackConfig = {{ __CONFIG__ }};
  if (typeof window.SITE_CONFIG === "object" && window.SITE_CONFIG !== null) {
    window.SITE_CONFIG = { ...fallbackConfig, ...window.SITE_CONFIG };
  } else {
    window.SITE_CONFIG = fallbackConfig;
  }
})();
