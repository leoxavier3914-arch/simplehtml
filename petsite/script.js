// ===============================================
// INSTRUÇÕES RÁPIDAS: este arquivo já está pronto.
// • Se você NÃO é programador(a), edite apenas o arquivo config.json
// • Para trocar fotos, coloque imagens em assets/images (veja TUTORIAL.txt)
// • Não precisa instalar nada. É só publicar a pasta no Netlify ou Vercel.
// ===============================================

/* AuMiau Petshop – Interações básicas */
const $ = (s, d=document)=>d.querySelector(s)
const $$ = (s, d=document)=>Array.from(d.querySelectorAll(s))

/* Ano no rodapé */
$('#year').textContent = new Date().getFullYear()

/* Menu mobile */
const menuBtn = $('#menuBtn')
const mobile = $('#mobileMenu')
if (menuBtn){
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true'
    menuBtn.setAttribute('aria-expanded', String(!open))
    mobile.hidden = open
  })
  $$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>{
    mobile.hidden = true
    menuBtn.setAttribute('aria-expanded','false')
  }))
}

/* Smooth scroll */
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1)
    const el = document.getElementById(id)
    if (el){
      e.preventDefault()
      el.scrollIntoView({behavior:'smooth', block:'start'})
    }
  })
})

/* Inline SVG substitution for icons */
const iconMap = {
  '{%SCISSORS%}': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3m6 0a3 3 0 1 1-3 3 3 3 0 0 1 3-3M2 20l8-8m4 0 8 8M2 20l6-2 3 3"/></svg>',
  '{%STETH%}': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v6a4 4 0 0 0 8 0V3h2v6a6 6 0 1 1-12 0V3z"/><circle cx="19" cy="12" r="3"/><path d="M19 15v2a6 6 0 0 1-6 6h-1"/></svg>',
  '{%HOUSE%}': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10 12 3l8 7v10a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
  '{%TRUCK%}': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
}
$$('.icon').forEach(el=>{
  const placeholder = el.textContent.trim()
  if (iconMap[placeholder]) el.innerHTML = iconMap[placeholder]
})

/* Lead form (demonstrativo) */
const WHATSAPP_MIN_LENGTH = 10;
const WHATSAPP_MAX_LENGTH = 15;

const getValidWhatsappNumber = () => {
  const raw = window.SITE_CONFIG && window.SITE_CONFIG.whatsappNumber;
  const digits = (raw == null ? '' : String(raw)).replace(/\D+/g, '');
  if (!digits || digits.length < WHATSAPP_MIN_LENGTH || digits.length > WHATSAPP_MAX_LENGTH){
    return '';
  }
  return digits;
};
window.getValidWhatsappNumber = getValidWhatsappNumber;

const provider = (window.SITE_CONFIG && window.SITE_CONFIG.form && window.SITE_CONFIG.form.provider || 'whatsapp').toLowerCase();

const whatsappConfigErrorManager = (() => {
  const MESSAGE = 'Por favor, informe um número de WhatsApp válido nas configurações (inclua DDI e DDD, apenas dígitos).';
  const alerts = new Set();
  const disabledButtons = new Set();

  const ensureAlertForForm = (form) => {
    if (!form) return null;
    let alert = form.querySelector('[data-whatsapp-config-alert]');
    if (!alert){
      alert = document.createElement('p');
      alert.dataset.whatsappConfigAlert = 'true';
      alert.setAttribute('role', 'alert');
      alert.className = 'form-alert';
      alert.textContent = MESSAGE;
      const actions = form.querySelector('.actions');
      if (actions){
        const firstAction = actions.querySelector('button, a');
        if (firstAction){
          actions.insertBefore(alert, firstAction);
        } else {
          actions.appendChild(alert);
        }
      } else {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn){
          submitBtn.insertAdjacentElement('afterend', alert);
        } else {
          form.appendChild(alert);
        }
      }
    }
    alerts.add(alert);
    return alert;
  };

  const disableButton = (button) => {
    if (!button) return;
    if (button.dataset.whatsappConfigGuard === 'locked'){
      disabledButtons.add(button);
      return;
    }
    const wasDisabled = button.disabled;
    const hadAriaDisabled = button.hasAttribute('aria-disabled');
    button.dataset.whatsappConfigGuard = 'locked';
    button.dataset.whatsappConfigWasDisabled = wasDisabled ? 'true' : 'false';
    if (!wasDisabled){
      button.disabled = true;
      if (!hadAriaDisabled){
        button.setAttribute('aria-disabled', 'true');
        button.dataset.whatsappConfigSetAria = 'true';
      }
    }
    disabledButtons.add(button);
  };

  const restoreButton = (button) => {
    if (!button || button.dataset.whatsappConfigGuard !== 'locked') return;
    const wasDisabled = button.dataset.whatsappConfigWasDisabled === 'true';
    const setAria = button.dataset.whatsappConfigSetAria === 'true';
    if (!wasDisabled){
      button.disabled = false;
    }
    if (setAria){
      button.removeAttribute('aria-disabled');
    }
    delete button.dataset.whatsappConfigGuard;
    delete button.dataset.whatsappConfigWasDisabled;
    delete button.dataset.whatsappConfigSetAria;
    disabledButtons.delete(button);
  };

  const targetForms = () => {
    const forms = [];
    const lead = $('#leadForm');
    if (lead) forms.push(lead);
    if (provider === 'whatsapp'){
      const contact = $('#contactForm');
      if (contact) forms.push(contact);
    }
    return forms;
  };

  const show = () => {
    targetForms().forEach(form => {
      ensureAlertForForm(form);
      disableButton(form.querySelector('button[type="submit"]'));
    });
  };

  const clear = () => {
    alerts.forEach(alert => {
      if (alert && alert.parentNode){
        alert.parentNode.removeChild(alert);
      }
    });
    alerts.clear();
    Array.from(disabledButtons).forEach(restoreButton);
    disabledButtons.clear();
  };

  return { show, clear };
})();

const showWhatsappConfigError = () => {
  whatsappConfigErrorManager.show();
};

const clearWhatsappConfigError = () => {
  whatsappConfigErrorManager.clear();
};

const ensureWhatsappNumber = () => {
  const digits = getValidWhatsappNumber();
  if (!digits){
    showWhatsappConfigError();
    return null;
  }
  clearWhatsappConfigError();
  return digits;
};

$('#leadForm')?.addEventListener('submit', (e)=>{
  e.preventDefault()
  const businessNumber = ensureWhatsappNumber();
  if (!businessNumber) return;
  const fd = new FormData(e.currentTarget)
  const nome = fd.get('nome')
  const whats = fd.get('whats')
  const msg = `Olá! Sou ${nome}. Quero aproveitar a promoção de estreia e meu WhatsApp é ${whats}.`
  const url = `https://wa.me/${businessNumber}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
})

/* Contact form -> WhatsApp por padrão; respeita provider do config */
const contactForm = $('#contactForm');
const whatsappSubmitHandler = (e)=>{
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const data = {
    nome: fd.get('nome'),
    whats: fd.get('whats'),
    pet: fd.get('pet'),
    servico: fd.get('servico'),
    data: fd.get('data') || 'a combinar',
    hora: fd.get('hora') || 'a combinar',
    obs: (fd.get('obs') || '').trim()
  };
  const msg = `Olá! Quero agendar:
• Nome: ${data.nome}
• WhatsApp: ${data.whats}
• Pet: ${data.pet}
• Serviço: ${data.servico}
• Data/Hora: ${data.data} ${data.hora}
• Obs: ${data.obs || '—'}`;
  const businessNumber = ensureWhatsappNumber();
  if (!businessNumber) return;
  const url = `https://wa.me/${businessNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

if (contactForm){
  const submitButton = contactForm.querySelector('button[type="submit"]');
  if (provider === 'whatsapp'){
    submitButton && (submitButton.disabled = false);
    contactForm.addEventListener('submit', whatsappSubmitHandler);
  } else if (provider === 'disabled') {
    contactForm.removeEventListener('submit', whatsappSubmitHandler);
    if (submitButton){
      submitButton.disabled = true;
      submitButton.setAttribute('aria-disabled', 'true');
    }
    if (!contactForm.querySelector('[data-form-disabled-message]')){
      const info = document.createElement('p');
      info.dataset.formDisabledMessage = 'true';
      info.textContent = 'Formulário temporariamente indisponível.';
      info.className = 'form-disabled-message';
      contactForm.appendChild(info);
    }
  } else if (provider === 'netlify') {
    // Netlify Forms: add attributes and allow normal submit
    contactForm.setAttribute('data-netlify','true');
    contactForm.setAttribute('name','agendamento');
    contactForm.method = 'POST';
    contactForm.action = 'thanks.html';
    contactForm.setAttribute('netlify-honeypot', 'bot-field');
    const formNameInput = document.createElement('input');
    formNameInput.type = 'hidden';
    formNameInput.name = 'form-name';
    formNameInput.value = 'agendamento';
    contactForm.appendChild(formNameInput);
    // honeypot
    const hp = document.createElement('input'); hp.type='text'; hp.name='bot-field'; hp.style.display='none'; contactForm.appendChild(hp);
  } else if (provider === 'formspree') {
    contactForm.action = (window.SITE_CONFIG && window.SITE_CONFIG.form && window.SITE_CONFIG.form.formspreeEndpoint) || '#';
    contactForm.method = 'POST';
  } else if (provider === 'emailjs') {
    contactForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      alert('Envie via EmailJS (configure chaves no config.json).');
    });
  }
}
