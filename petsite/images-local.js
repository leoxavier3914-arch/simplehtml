// ===============================================
// INSTRUÇÕES RÁPIDAS: este arquivo já está pronto.
// • Se você NÃO é programador(a), edite apenas o arquivo config.js
// • Para trocar fotos, coloque imagens em assets/images (veja TUTORIAL.txt)
// • Não precisa instalar nada. É só publicar a pasta no Netlify ou Vercel.
// ===============================================


/* Override opcional de imagens locais (hero + galeria) sem alterar o design
   TAMANHOS RECOMENDADOS:
   - Logo: assets/images/logo.png → ~640×180 (proporção horizontal). PNG com fundo transparente.
   - Hero: assets/images/hero.jpg → 1920×1280 (JPG).
   - Galeria: assets/images/gallery/gallery-[1..8].jpg → 1200×1200 (JPG). */
(function(){
  var heroCandidate = "assets/images/hero.jpg";
  var testHero = new Image();
  testHero.onload = function(){
    var hero = document.querySelector('.hero-bg');
    if (hero){
      hero.style.backgroundImage = "linear-gradient(180deg, rgba(10,20,15,.5), rgba(10,20,15,.9)), url('"+heroCandidate+"')";
    }
  };
  testHero.src = heroCandidate;

  var gallery = document.querySelector('.gallery');
  if (gallery){
    var imgs = Array.from(gallery.querySelectorAll('img'));
    imgs.forEach(function(img, i){
      var path = "assets/images/gallery/gallery-"+(i+1)+".jpg";
      var im = new Image();
      im.onload = function(){ img.src = path };
      im.src = path;
    });
  }

  // LOGO opcional (assets/images/logo.png). Se existir, substitui o texto da marca no header.
  (function(){
    var logoPath = "assets/images/logo.png";
    var test = new Image();
    test.onload = function(){
      var brand = document.querySelector('.brand');
      if (!brand) return;
      // remove placeholder (.brand-logo) if it's not an <img>
      var placeholder = brand.querySelector('.brand-logo');
      if (placeholder && placeholder.tagName !== 'IMG'){
        placeholder.remove();
      }
      // cria <img class="brand-logo">
      var img = document.createElement('img');
      img.src = logoPath;
      img.alt = (window.SITE_CONFIG && window.SITE_CONFIG.siteName) || 'Logo';
      img.className = 'brand-logo';
      // envolve o texto existente em .brand-text (se ainda não existir)
      if (!brand.querySelector('.brand-text')){
        var span = document.createElement('span');
        span.className = 'brand-text';
        span.textContent = brand.textContent.trim();
        brand.textContent = '';
        brand.appendChild(img);
        brand.appendChild(span);
      } else {
        brand.insertBefore(img, brand.firstChild);
      }
      brand.classList.add('has-logo');
    };
    test.src = logoPath;
  })();

})();