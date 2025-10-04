// ===============================================
// INSTRUÇÕES RÁPIDAS: este arquivo já está pronto.
// • Se você NÃO é programador(a), edite apenas o arquivo config.js
// • Para trocar fotos, coloque imagens em assets/images (veja TUTORIAL.txt)
// • Não precisa instalar nada. É só publicar a pasta no Netlify ou Vercel.
// ===============================================


/* Liga o config.js ao HTML mantendo o design original */
(function(){
  const C = window.SITE_CONFIG || {};
  const ICONS = {
    scissors: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3m6 0a3 3 0 1 1-3 3 3 3 0 0 1 3-3M2 20l8-8m4 0 8 8M2 20l6-2 3 3"/></svg>',
    steth: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v6a4 4 0 0 0 8 0V3h2v6a6 6 0 1 1-12 0V3z"/><circle cx="19" cy="12" r="3"/><path d="M19 15v2a6 6 0 0 1-6 6h-1"/></svg>',
    house: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10 12 3l8 7v10a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    paw: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="20" r="8"/><circle cx="44" cy="20" r="8"/><circle cx="24" cy="40" r="8"/><circle cx="40" cy="40" r="8"/><path d="M32 60c12 0 20-10 12-18-4-4-8-4-12-4s-8 0-12 4c-8 8 0 18 12 18z"/></svg>'
  };

  const SOCIAL_PLATFORMS = {
    instagram: {
      label: 'Instagram',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8zm4 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5zm5-3.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>'
    },
    tiktok: {
      label: 'TikTok',
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.75 3H18a3.25 3.25 0 0 0 3.25 3.25V9.5a6.5 6.5 0 0 1-3.67-1.1v6.37a6.77 6.77 0 1 1-6.77-6.77h.52v3.34a3.43 3.43 0 1 0 2.48 3.3z"/></svg>'
    }
  };

  const THEME_VARS = {
    background: '--bg',
    backgroundAccent: '--bg-2',
    primary: '--brand',
    secondary: '--brand-2',
    text: '--ink',
    textSoft: '--ink-2',
    card: '--card',
    stroke: '--stroke',
    muted: '--muted',
    white: '--white'
  };

  const WHATSAPP_MIN_LENGTH = 10;
  const WHATSAPP_MAX_LENGTH = 15;
  const toDigits = (value) => (value || '').toString().replace(/\D+/g, '');
  const isValidWhatsappNumber = (digits) => digits.length >= WHATSAPP_MIN_LENGTH && digits.length <= WHATSAPP_MAX_LENGTH;
  const resolveConfiguredWhatsapp = () => {
    if (typeof window.getValidWhatsappNumber === 'function'){
      const fromScript = window.getValidWhatsappNumber();
      if (fromScript) return fromScript;
    }
    const digits = toDigits(C.whatsappNumber);
    return isValidWhatsappNumber(digits) ? digits : '';
  };
  const formatWhatsUrl = (value) => {
    const digits = toDigits(value);
    return isValidWhatsappNumber(digits) ? `https://wa.me/${digits}` : '';
  };
  const disableWhatsappLink = (btn) => {
    if (!btn || btn.dataset.whatsappDisabled === 'true') return;
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
    btn.dataset.whatsappDisabled = 'true';
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      alert('Nenhum número de WhatsApp válido foi configurado. Atualize as configurações para utilizar este botão.');
    });
  };

  const setText = (selector, text) => {
    if (text == null) return;
    document.querySelectorAll(selector).forEach(el => { el.textContent = text; });
  };

  const bindMeta = () => {
    const seo = C.seo || {};
    if (seo.pageTitle){
      const title = document.querySelector('title');
      if (title){
        title.textContent = seo.pageTitle;
        title.dataset.lock = 'true';
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', seo.pageTitle);
    }
    if (seo.metaDescription){
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', seo.metaDescription);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', seo.metaDescription);
    }
    if (seo.ogImage){
      let og = document.querySelector('meta[property="og:image"]');
      if (!og){
        og = document.createElement('meta');
        og.setAttribute('property', 'og:image');
        document.head.appendChild(og);
      }
      og.setAttribute('content', seo.ogImage);
    }
    if (seo.faviconEmoji){
      const link = document.createElement('link'); link.rel="icon";
      link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${encodeURIComponent(seo.faviconEmoji)}</text></svg>`;
      document.head.appendChild(link);
    }
  };

  const bindBrand = () => {
    const brand = C.brand || {};
    const primary = brand.primary || C.siteName || '';
    const secondary = brand.secondary || '';
    const short = brand.short || primary;
    setText('header .brand strong', primary);
    setText('header .brand .sub', secondary);
    setText('.brand-text', short);
    setText('.site-footer .brand strong', primary);
    setText('.site-footer .brand .sub', secondary);
  };

  const bindTheme = () => {
    const theme = C.theme || {};
    const root = document.documentElement;
    Object.entries(THEME_VARS).forEach(([key, cssVar]) => {
      const value = theme[key];
      if (value){
        root.style.setProperty(cssVar, value);
      }
    });
  };

  const bindNavigation = () => {
    const navigation = C.navigation || {};
    const links = Array.isArray(navigation.links) ? navigation.links : [];
    const cta = navigation.cta;

    const attachSmoothScroll = (linkEl) => {
      const href = linkEl.getAttribute('href') || '';
      if (!href || !href.startsWith('#') || href.length <= 1) return;
      const targetId = href.slice(1);
      linkEl.addEventListener('click', (event) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    const closeMobileMenu = () => {
      const mobileMenu = document.getElementById('mobileMenu');
      const menuButton = document.getElementById('menuBtn');
      if (mobileMenu) mobileMenu.hidden = true;
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    };

    const createLinkElement = (item, extraClasses = [], options = {}) => {
      if (!item) return null;
      const label = item.label != null ? item.label : '';
      const href = item.href || '#';
      const linkEl = document.createElement('a');
      linkEl.textContent = label;
      if (href) linkEl.setAttribute('href', href);
      if (item.target) linkEl.setAttribute('target', item.target);
      if (item.rel) linkEl.setAttribute('rel', item.rel);
      if (item.id) linkEl.id = item.id;
      if (item.ariaLabel) linkEl.setAttribute('aria-label', item.ariaLabel);
      const classNames = [];
      if (Array.isArray(extraClasses)) classNames.push(...extraClasses);
      if (typeof item.className === 'string'){
        classNames.push(...item.className.split(/\s+/).filter(Boolean));
      }
      classNames.filter(Boolean).forEach(cls => linkEl.classList.add(cls));
      if (options.closeMobileOnClick){
        linkEl.addEventListener('click', closeMobileMenu);
      }
      attachSmoothScroll(linkEl);
      return linkEl;
    };

    const buildLinks = (container, items, options = {}) => {
      if (!container) return;
      container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      items.forEach(item => {
        const linkEl = createLinkElement(item, options.linkClasses, options);
        if (linkEl) fragment.appendChild(linkEl);
      });
      if (options.cta){
        const ctaEl = createLinkElement(options.cta, options.ctaClasses, options);
        if (ctaEl) fragment.appendChild(ctaEl);
      }
      container.appendChild(fragment);
    };

    const navContainer = document.querySelector('.nav-links');
    buildLinks(navContainer, links, { cta, ctaClasses: ['btn', 'btn-sm'] });

    const mobileContainer = document.getElementById('mobileMenu');
    buildLinks(mobileContainer, links, { cta, ctaClasses: ['btn'], closeMobileOnClick: true });

    const footerLinks = (C.footer && Array.isArray(C.footer.links) && C.footer.links.length) ? C.footer.links : links;
    const footerContainer = document.querySelector('.footer-links');
    buildLinks(footerContainer, footerLinks);
  };

  const bindHero = () => {
    const hero = C.hero || {};
    const h1 = document.querySelector('.hero-copy h1');
    if (h1){
      const title = hero.title || '';
      const highlight = hero.highlight || C.tagline || '';
      if (title && highlight){
        h1.innerHTML = `${title} <span class="highlight">${highlight}</span>`;
      } else if (title){
        h1.textContent = title;
      }
    }
    if (hero.description) setText('.hero-copy p', hero.description);
    if (hero.trustBadges){
      const ul = document.querySelector('.hero-copy .trust');
      if (ul){
        ul.innerHTML = hero.trustBadges.map(item => `\n            <li>✔️ ${item}</li>`).join('');
      }
    }
    if (hero.primaryCTA){
      const btn = document.querySelector('.hero-copy .btn.btn-lg');
      if (btn){
        if (hero.primaryCTA.label != null) btn.textContent = hero.primaryCTA.label;
        if (hero.primaryCTA.href) btn.setAttribute('href', hero.primaryCTA.href);
      }
    }
    if (hero.secondaryCTA){
      const btn = document.querySelector('.hero-copy .btn.ghost');
      if (btn){
        if (hero.secondaryCTA.label != null) btn.textContent = hero.secondaryCTA.label;
        if (hero.secondaryCTA.href) btn.setAttribute('href', hero.secondaryCTA.href);
      }
    }

    const promo = hero.promo || {};
    const card = document.querySelector('.hero-card');
    if (card){
      if (promo.enabled === false){
        card.hidden = true;
      } else {
        card.hidden = false;
        const titleEl = card.querySelector('.card-title');
        if (titleEl && promo.title != null) titleEl.textContent = promo.title;
        const descEl = card.querySelector('p');
        if (descEl && promo.description){
          let html = promo.description;
          if (promo.highlight){
            if (html.includes('{highlight}')){
              html = html.replace(/\{highlight\}/g, `<strong>${promo.highlight}</strong>`);
            } else {
              html = `${html} <strong>${promo.highlight}</strong>`;
            }
          }
          descEl.innerHTML = html;
        }
        const leadForm = card.querySelector('form');
        if (leadForm && promo.leadForm){
          const spans = leadForm.querySelectorAll('label span');
          if (spans[0] && promo.leadForm.nameLabel != null) spans[0].textContent = promo.leadForm.nameLabel;
          if (spans[1] && promo.leadForm.whatsappLabel != null) spans[1].textContent = promo.leadForm.whatsappLabel;
          const inputs = leadForm.querySelectorAll('input');
          if (inputs[0]){
            if (promo.leadForm.namePlaceholder != null){
              inputs[0].placeholder = promo.leadForm.namePlaceholder;
            } else if (promo.leadForm.nameLabel != null && inputs[0].placeholder.toLowerCase().startsWith('ex.:')){
              inputs[0].placeholder = `Ex.: ${promo.leadForm.nameLabel}`;
            }
          }
          if (inputs[1]){
            if (promo.leadForm.whatsappPlaceholder != null){
              inputs[1].placeholder = promo.leadForm.whatsappPlaceholder;
            } else if (promo.leadForm.whatsappLabel != null && inputs[1].placeholder.includes('9')){
              inputs[1].placeholder = `(11) 99999-9999`;
            }
          }
          const button = leadForm.querySelector('button');
          if (button && promo.leadForm.buttonLabel != null) button.textContent = promo.leadForm.buttonLabel;
          const disclaimer = leadForm.querySelector('small');
          if (disclaimer && promo.disclaimer != null) disclaimer.textContent = promo.disclaimer;
        }
      }
    }
  };

  const iconMarkup = (name) => ICONS[name?.toLowerCase?.()] || ICONS.paw;

  const bindServices = () => {
    const services = C.services || {};
    const section = document.querySelector('#servicos');
    const items = Array.isArray(services.items) ? services.items : [];
    if (section){
      if (services.enabled === false || !items.length){
        section.hidden = true;
        return;
      }
      section.hidden = false;
    }
    if (services.title != null) setText('#servicos .section-header h2', services.title);
    if (services.subtitle != null) setText('#servicos .section-header p', services.subtitle);
    const grid = document.querySelector('#servicos .grid.cards');
    if (grid){
      grid.innerHTML = '';
      items.forEach(item => {
        const article = document.createElement('article');
        article.className = 'card glass';
        const icon = document.createElement('div'); icon.className = 'icon'; icon.innerHTML = iconMarkup(item.icon);
        const h3 = document.createElement('h3'); h3.textContent = item.title || '';
        const p = document.createElement('p'); p.textContent = item.description || '';
        article.appendChild(icon);
        article.appendChild(h3);
        article.appendChild(p);
        if (Array.isArray(item.features) && item.features.length){
          const ul = document.createElement('ul'); ul.className = 'features';
          item.features.forEach(feature => {
            const li = document.createElement('li'); li.textContent = feature; ul.appendChild(li);
          });
          article.appendChild(ul);
        }
        grid.appendChild(article);
      });
    }
  };

  const bindPlans = () => {
    const plans = C.plans || {};
    const section = document.querySelector('#planos');
    const items = Array.isArray(plans.items) ? plans.items : [];
    if (section){
      if (plans.enabled === false || !items.length){
        section.hidden = true;
        return;
      }
      section.hidden = false;
    }
    if (plans.title != null) setText('#planos .section-header h2', plans.title);
    if (plans.subtitle != null) setText('#planos .section-header p', plans.subtitle);
    const grid = document.querySelector('#planos .grid.plans');
    if (grid){
      grid.innerHTML = '';
      items.forEach(plan => {
        const article = document.createElement('article');
        article.className = 'plan glass';
        if (plan.highlight) article.classList.add('highlight');
        if (plan.badge){
          const badge = document.createElement('div'); badge.className = 'badge'; badge.textContent = plan.badge; article.appendChild(badge);
        }
        const h3 = document.createElement('h3'); h3.textContent = plan.name || '';
        const price = document.createElement('p'); price.className = 'price';
        const prefix = document.createElement('span'); prefix.textContent = plan.pricePrefix || '';
        const amount = document.createTextNode(plan.price || '');
        price.appendChild(prefix);
        price.appendChild(amount);
        if (plan.priceSuffix){
          const suffix = document.createElement('span'); suffix.className = 'per'; suffix.textContent = plan.priceSuffix; price.appendChild(suffix);
        }
        article.appendChild(h3);
        article.appendChild(price);
        if (Array.isArray(plan.features) && plan.features.length){
          const ul = document.createElement('ul');
          plan.features.forEach(feature => {
            const li = document.createElement('li'); li.textContent = feature; ul.appendChild(li);
          });
          article.appendChild(ul);
        }
        const btn = document.createElement('a'); btn.className = 'btn';
        btn.textContent = plan.buttonLabel || 'Escolher';
        btn.setAttribute('href', plan.buttonHref || '#contato');
        article.appendChild(btn);
        grid.appendChild(article);
      });
    }
  };

  const bindTestimonials = () => {
    const testimonials = C.testimonials || {};
    const section = document.querySelector('#depoimentos');
    const items = Array.isArray(testimonials.items) ? testimonials.items : [];
    if (section){
      if (testimonials.enabled === false || !items.length){
        section.hidden = true;
        return;
      }
      section.hidden = false;
    }
    if (testimonials.title != null) setText('#depoimentos .section-header h2', testimonials.title);
    const grid = document.querySelector('#depoimentos .grid.testimonials');
    if (grid){
      grid.innerHTML = '';
      items.forEach(item => {
        const figure = document.createElement('figure'); figure.className = 't-card glass';
        const block = document.createElement('blockquote'); block.textContent = item.quote || '';
        const caption = document.createElement('figcaption'); caption.textContent = item.author || '';
        figure.appendChild(block);
        figure.appendChild(caption);
        grid.appendChild(figure);
      });
    }
  };

  const bindGallery = () => {
    const gallery = C.gallery || {};
    const section = document.querySelector('#galeria');
    if (!section) return;
    if (gallery.enabled === false){
      section.hidden = true;
      return;
    }
    section.hidden = false;
    const header = section.querySelector('.section-header');
    if (!header) return;
    const h2 = header.querySelector('h2'); if (h2 && gallery.title != null) h2.textContent = gallery.title;
    const p = header.querySelector('p'); if (p && gallery.subtitle != null) p.textContent = gallery.subtitle;
  };

  const bindFaq = () => {
    const faq = C.faq || {};
    const faqContainer = document.querySelector('.faq');
    if (!faqContainer) return;
    const section = faqContainer.closest('section');
    const items = Array.isArray(faq.items) ? faq.items : [];
    if (section){
      if (faq.enabled === false || !items.length){
        section.hidden = true;
        return;
      }
      section.hidden = false;
    }
    const header = faqContainer.previousElementSibling;
    if (header && faq.title != null){
      const h2 = header.querySelector('h2'); if (h2) h2.textContent = faq.title;
    }
    faqContainer.innerHTML = '';
    items.forEach(item => {
        const details = document.createElement('details');
        const summary = document.createElement('summary'); summary.textContent = item.question || '';
        const p = document.createElement('p'); p.textContent = item.answer || '';
        details.appendChild(summary);
        details.appendChild(p);
        faqContainer.appendChild(details);
    });
  };

  const bindContact = () => {
    const contact = C.contact || {};
    const section = document.querySelector('#contato');
    if (section){
      if (contact.enabled === false){
        section.hidden = true;
        return;
      }
      section.hidden = false;
    }
    if (contact.title != null) setText('#contato .section-header h2', contact.title);
    if (contact.subtitle != null) setText('#contato .section-header p', contact.subtitle);

    const select = document.querySelector('#contactForm select[name="servico"]');
    if (select && Array.isArray(contact.serviceOptions)){
      const placeholder = select.querySelector('option[value=""]');
      select.innerHTML = '';
      const defaultOption = document.createElement('option'); defaultOption.value = ''; defaultOption.textContent = 'Selecione';
      select.appendChild(defaultOption);
      contact.serviceOptions.forEach(option => {
        const opt = document.createElement('option'); opt.textContent = option; select.appendChild(opt);
      });
    }

    const badges = document.querySelector('.contact-badges');
    if (badges && Array.isArray(contact.badges)){
      badges.innerHTML = contact.badges.map(label => `<span class="badge">${label}</span>`).join('');
    }

    const primaryBtn = document.querySelector('#contactForm .actions .btn');
    const provider = (C.form && typeof C.form.provider === 'string') ? C.form.provider.toLowerCase() : 'whatsapp';
    if (primaryBtn){
      if (contact.primaryButton && contact.primaryButton.label != null){
        primaryBtn.textContent = contact.primaryButton.label;
      }
      const currentLabel = (primaryBtn.textContent || '').trim();
      if (provider !== 'whatsapp' && /whatsapp/i.test(currentLabel)){
        primaryBtn.textContent = 'Enviar formulário';
      }
    }
    const secondaryBtn = document.querySelector('#contactForm .actions .btn.ghost');
    const fallbackDigits = resolveConfiguredWhatsapp();
    const fallbackUrl = formatWhatsUrl(fallbackDigits);
    if (secondaryBtn && contact.secondaryButton){
      if (contact.secondaryButton.label != null) secondaryBtn.textContent = contact.secondaryButton.label;
      if (contact.secondaryButton.href){
        secondaryBtn.setAttribute('href', contact.secondaryButton.href);
        secondaryBtn.removeAttribute('aria-disabled');
        delete secondaryBtn.dataset.whatsappDisabled;
      } else if (fallbackUrl){
        secondaryBtn.setAttribute('href', fallbackUrl);
        secondaryBtn.removeAttribute('aria-disabled');
        delete secondaryBtn.dataset.whatsappDisabled;
      } else {
        disableWhatsappLink(secondaryBtn);
      }
    } else if (secondaryBtn){
      if (fallbackUrl){
        secondaryBtn.setAttribute('href', fallbackUrl);
        secondaryBtn.removeAttribute('aria-disabled');
        delete secondaryBtn.dataset.whatsappDisabled;
      } else {
        disableWhatsappLink(secondaryBtn);
      }
    }

    const disclaimer = document.querySelector('#contactForm small');
    if (disclaimer && contact.disclaimer != null) disclaimer.textContent = contact.disclaimer;

    const aside = document.querySelector('#contato aside');
    if (aside){
      if (C.addressHtml != null){
        const p = aside.querySelector('p'); if (p) p.innerHTML = C.addressHtml;
      }
      if (Array.isArray(C.openingHours)){
        const list = aside.querySelector('.hours');
        if (list){
          list.innerHTML = C.openingHours.map(item => `<li><strong>${item.day}</strong> ${item.hours}</li>`).join('');
        }
      }
    }
  };

  const bindFooter = () => {
    const footer = C.footer || {};
    if (footer.legal){
      const legal = footer.legal.replace('{year}', new Date().getFullYear());
      const el = document.querySelector('.site-footer p.muted');
      if (el) el.textContent = legal;
    }
  };

  const bindSocial = () => {
    const container = document.querySelector('[data-social-container]');
    if (!container) return;

    const socials = C.social || {};
    let visibleCount = 0;

    Object.entries(SOCIAL_PLATFORMS).forEach(([key, meta]) => {
      const url = typeof socials[key] === 'string' ? socials[key].trim() : '';
      let link = container.querySelector(`[data-social-link="${key}"]`);

      if (!link){
        link = document.createElement('a');
        link.dataset.socialLink = key;
        link.className = `social-link ${key}`;
        link.setAttribute('aria-label', meta.label);
        link.innerHTML = `<span aria-hidden="true" class="icon">${meta.icon}</span><span class="sr-only">${meta.label}</span>`;
        link.setAttribute('hidden', '');
        container.appendChild(link);
      } else {
        link.classList.add(key);
        if (!link.getAttribute('aria-label')){
          link.setAttribute('aria-label', meta.label);
        }
        if (!link.innerHTML.trim()){
          link.innerHTML = `<span aria-hidden="true" class="icon">${meta.icon}</span><span class="sr-only">${meta.label}</span>`;
        }
      }

      if (url){
        link.href = url;
        link.removeAttribute('hidden');
        link.classList.remove('is-hidden');
        visibleCount++;
      } else {
        link.removeAttribute('href');
        link.setAttribute('hidden', '');
        link.classList.add('is-hidden');
      }
    });

    if (visibleCount){
      container.removeAttribute('hidden');
    } else {
      container.setAttribute('hidden', '');
    }
  };

  const bindSeo = () => {
    bindMeta();
  };

  const bindPixels = () => {
    if (C.pixels && C.pixels.ga4){
      const s = document.createElement('script'); s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${C.pixels.ga4}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      gtag('js', new Date()); gtag('config', C.pixels.ga4);
    }
    if (C.pixels && C.pixels.facebook){
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js'); window.fbq('init', C.pixels.facebook); window.fbq('track', 'PageView');
    }
    if (C.pixels && C.pixels.tiktok){
      !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) { for (var e = ttq._i = ttq._i || {}, n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e[t] = [], ttq.methods[n]); return e[t] };
      ttq.load = function (e, n) { var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._t = ttq._t || []; ttq._t.push([e, n]); var a = d.createElement("script"); a.type = "text/javascript";
      a.async = !0; a.src = i; var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(a, s) };
      ttq.load(C.pixels.tiktok); ttq.page(); }(window, document, 'ttq');
    }
  };

  bindSeo();
  bindTheme();
  bindBrand();
  bindNavigation();
  bindHero();
  bindServices();
  bindPlans();
  bindTestimonials();
  bindGallery();
  bindFaq();
  bindContact();
  bindFooter();
  bindSocial();
  bindPixels();
})();
