// ===============================================
// INSTRUÇÕES RÁPIDAS: este arquivo já está pronto.
// • Se você NÃO é programador(a), edite apenas o arquivo config.js
// • Para trocar fotos, coloque imagens em assets/images (veja TUTORIAL.txt)
// • Não precisa instalar nada. É só publicar a pasta no Netlify ou Vercel.
// ===============================================


/* =======================
   CONFIGURAÇÃO RÁPIDA (plug-and-play)
   ======================= */
window.SITE_CONFIG = {
  /* =======================
     Identidade e dados gerais
     ======================= */
  siteName: "AuMiau Petshop", // Usado em títulos/metadados
  brand: {
    primary: "AuMiau",       // Nome exibido em destaque
    secondary: "Petshop",    // Palavra pequena ao lado do nome
    short: "AuMiau"          // Versão curta (menu mobile, favicon etc.)
  },
  theme: {
    background: "#0f1f14",        // Fundo principal (gradiente escuro)
    backgroundAccent: "#153726",   // Fundo secundário do gradiente
    primary: "#2aba8a",            // Cor principal (botões, destaques)
    secondary: "#a5e2c8",          // Variação suave da cor principal
    text: "#0e1a14",               // Texto sobre fundos claros
    textSoft: "#22372f",           // Texto secundário/hover
    card: "#ffffff1a",             // Fundo translúcido dos cards (usar #RRGGBBAA)
    stroke: "#ffffff2e",           // Bordas translúcidas
    muted: "#cfe7dc",              // Textos suaves/legendas
    white: "#ffffff"               // Branco padrão para contrastar com o tema
  },
  whatsappNumber: "5511999999999", // DDI+DDD+número (somente dígitos)
  addressHtml: "Rua dos Pets, 123 — Centro<br/>Sua Cidade • SP",
  openingHours: [
    { day: "Seg–Sex:", hours: "9h às 19h" },
    { day: "Sábado:",  hours: "9h às 16h" },
    { day: "Domingo:", hours: "plantão veterinário" }
  ],

  navigation: {
    links: [
      { label: "Serviços", href: "#servicos" },
      { label: "Planos", href: "#planos" },
      { label: "Depoimentos", href: "#depoimentos" },
      { label: "Galeria", href: "#galeria" }
    ],
    cta: { label: "Agendar", href: "#contato" }
  },

  hero: {
    title: "Cuidado completo para",
    highlight: "quem te ama",
    description: "Banho & tosa, veterinário, creche e delivery. Tudo em um só lugar, com profissionais apaixonados por pets.",
    trustBadges: [
      "Equipe certificada",
      "Produtos hipoalergênicos",
      "Retirada e entrega"
    ],
    primaryCTA: { label: "Agendar agora", href: "#contato" },
    secondaryCTA: { label: "Ver serviços", href: "#servicos" },
    promo: {
      enabled: true,
      title: "Promo de estreia",
      description: "Banho & tosa com {highlight} na primeira visita.",
      highlight: "15% OFF",
      leadForm: {
        nameLabel: "Seu nome",
        namePlaceholder: "Ex.: Ana Souza",
        whatsappLabel: "WhatsApp",
        whatsappPlaceholder: "(11) 99999-9999",
        buttonLabel: "Quero meu desconto"
      },
      disclaimer: "Sem spam. Entraremos em contato por WhatsApp."
    }
  },

  services: {
    enabled: true,
    title: "Nossos serviços",
    subtitle: "Do banho ao check-up, tudo para o bem-estar do seu melhor amigo.",
    items: [
      {
        icon: "scissors",
        title: "Banho & Tosa",
        description: "Corte higiênico, tosa na tesoura ou máquina, hidratação e perfumação.",
        features: [
          "Secagem com protetor auricular",
          "Produtos hipoalergênicos",
          "Relatório pós-atendimento"
        ]
      },
      {
        icon: "steth",
        title: "Veterinário",
        description: "Consultas, vacinas e exames com profissionais credenciados.",
        features: [
          "Teletriagem gratuita",
          "Carteirinha digital",
          "Parcerias laboratoriais"
        ]
      },
      {
        icon: "house",
        title: "Creche & Hotel",
        description: "Ambiente seguro e monitorado para brincar e descansar.",
        features: [
          "Monitoração por câmera",
          "Enriquecimento ambiental",
          "Relatórios diários"
        ]
      },
      {
        icon: "truck",
        title: "Delivery",
        description: "Retiramos e entregamos seu pet em casa. Rações e acessórios sob demanda.",
        features: [
          "Agendamento via WhatsApp",
          "Pagamentos digitais",
          "Roteirização inteligente"
        ]
      }
    ]
  },

  plans: {
    enabled: true,
    title: "Planos e pacotes",
    subtitle: "Economize com pacotes mensais e vantagens exclusivas.",
    items: [
      {
        name: "Essencial",
        pricePrefix: "R$",
        price: "79",
        priceSuffix: "/banho",
        features: [
          "Banho básico",
          "Escovação de pelagem",
          "Perfume hipoalergênico"
        ],
        buttonLabel: "Escolher",
        buttonHref: "#contato"
      },
      {
        name: "Premium",
        pricePrefix: "R$",
        price: "129",
        priceSuffix: "/sessão",
        features: [
          "Banho & tosa completa",
          "Hidratação + limpeza auricular",
          "Laço ou gravatinha"
        ],
        badge: "Mais popular",
        highlight: true,
        buttonLabel: "Escolher",
        buttonHref: "#contato"
      },
      {
        name: "VIP Mensal",
        pricePrefix: "R$",
        price: "349",
        priceSuffix: "/mês",
        features: [
          "3 banhos mensais",
          "1 tosa por mês",
          "Retirada e entrega grátis"
        ],
        buttonLabel: "Escolher",
        buttonHref: "#contato"
      }
    ]
  },

  testimonials: {
    enabled: true,
    title: "Quem confia, recomenda",
    items: [
      { quote: "Meu cãozinho nunca voltou tão cheiroso. Atendimento impecável!", author: "— Júlia M." },
      { quote: "A creche foi uma salvação nos dias corridos. Ele chega cansado e feliz.", author: "— Caio M." },
      { quote: "Gostei da carteirinha digital e do relatório após a consulta.", author: "— Renata M." }
    ]
  },

  gallery: {
    enabled: true,
    title: "Nossos momentos",
    subtitle: "Alguns registros de quem passa por aqui."
  },

  faq: {
    enabled: true,
    title: "Perguntas frequentes",
    items: [
      {
        question: "Quais vacinas são exigidas para a creche?",
        answer: "Exigimos vacinação em dia (V8/V10, raiva e tosse dos canis) e controle antipulgas/carrapatos."
      },
      {
        question: "Como funciona a retirada e entrega?",
        answer: "Agendamos via WhatsApp e passamos em horários combinados. Cobrança por raio de distância."
      },
      {
        question: "Vocês atendem gatos?",
        answer: "Sim! Temos sala separada, com manejo gentil e produtos específicos para felinos."
      },
      {
        question: "Quais formas de pagamento aceitam?",
        answer: "Cartão, Pix e link de pagamento. Para planos, oferecemos recorrência mensal."
      }
    ]
  },

  contact: {
    enabled: true,
    title: "Agende seu atendimento",
    subtitle: "Preencha os dados ou chame no WhatsApp. Respondemos rápido!",
    serviceOptions: [
      "Banho",
      "Tosa",
      "Banho & Tosa",
      "Consulta Veterinária",
      "Creche / Hotel"
    ],
    badges: ["Pix", "Cartão", "Delivery"],
    primaryButton: { label: "Enviar pelo WhatsApp" },
    secondaryButton: { label: "Chamar direto" },
    disclaimer: "Ao enviar, abriremos uma conversa no WhatsApp com as informações preenchidas."
  },

  footer: {
    legal: "© {year} AuMiau Petshop. Todos os direitos reservados.",
    links: [
      { label: "Serviços", href: "#servicos" },
      { label: "Planos", href: "#planos" },
      { label: "Contato", href: "#contato" }
    ]
  },

  social: {
    instagram: "",
    tiktok: ""
  },
  form: {
    provider: "whatsapp", // "whatsapp" | "netlify" | "formspree" | "emailjs" | "disabled"
    formspreeEndpoint: "", // ex: https://formspree.io/f/xxxxxxx
    emailjs: { publicKey: "", serviceId: "", templateId: "" }
  },
  thankYouPage: {
    title: "Obrigado! 🎉",
    message: "Recebemos sua mensagem. Em breve entraremos em contato.",
    backButtonLabel: "Voltar",
    backButtonHref: "/"
  },
  pixels: {
    ga4: "",        // G-XXXXXXXXXX
    facebook: "",   // 1234567890
    tiktok: ""      // TTP123abc...
  },
  seo: {
    pageTitle: "AuMiau Petshop • Banho & Tosa, Veterinário e Mais",
    metaDescription: "Cuidamos do seu pet com carinho e profissionalismo. Agende online!",
    ogImage: "", // URL absoluta 1200x630 (opcional)
    faviconEmoji: "🐾",
  }
};
