const PORTAL_STORAGE_KEY = "aluguelSeguroPortalState";

const portalBaseState = () => ({
  properties: [
    {
      id: "local-property-1",
      title: "Apartamento terreo com patio para familia",
      city: "Joinville",
      neighborhood: "Saguacu",
      property_type: "apartamento",
      rent_price: 1850,
      bedrooms: 2,
      has_garage: true,
      support_level: "completo",
      deposit_amount: 1850,
      description: "Imovel adaptado para rotina familiar, com regras claras de convivencia e contrato enxuto.",
      guarantee_notes: "Contracheque ou pro-labore, caucao maxima de um aluguel, clausula de cancelamento e seguro incendio.",
      status: "ativo",
      whatsapp: "47999990000",
      created_at: "2026-03-16T09:00:00Z"
    },
    {
      id: "local-property-2",
      title: "Kitnet silenciosa perto da industria",
      city: "Blumenau",
      neighborhood: "Itoupava Norte",
      property_type: "kitnet",
      rent_price: 980,
      bedrooms: 1,
      has_garage: false,
      support_level: "essencial",
      deposit_amount: 980,
      description: "Opcao para recem-chegados que precisam entrar rapido sem excesso de burocracia.",
      guarantee_notes: "Sem fiador, com analise comportamental e contato assistido pela equipe.",
      status: "ativo",
      whatsapp: "47999990001",
      created_at: "2026-03-16T09:20:00Z"
    }
  ],
  leads: [
    {
      id: "lead-1",
      propertyId: "local-property-1",
      tenantName: "Daniel Costa",
      ageRange: "29 anos",
      origin: "Manaus/AM",
      family: "Casado e 1 filho pequeno",
      occupation: "Operador de producao",
      income: 2900,
      score: 82,
      feePaid: false,
      status: "pending_fee",
      phone: "47988887777",
      questionnaire: [
        {
          question: "Cuidado com o ambiente e autodisciplina",
          answer: "Concorda totalmente",
          note: "Tende a zelar pelo imovel e agir preventivamente."
        },
        {
          question: "Casa como refugio de silencio",
          answer: "Concorda",
          note: "Perfil discreto, baixo risco de ruido recorrente."
        },
        {
          question: "Adiar compromissos com justificativa",
          answer: "Discorda",
          note: "Boa rigidez com pagamentos e prazos."
        },
        {
          question: "Rotina focada em trabalho e familia",
          answer: "Concorda totalmente",
          note: "Momento de vida estavel, com meta clara de fixacao em SC."
        }
      ],
      updated_at: "2026-03-16T10:00:00Z"
    },
    {
      id: "lead-2",
      propertyId: "local-property-2",
      tenantName: "Aline Souza",
      ageRange: "31 anos",
      origin: "Belem/PA",
      family: "Casada",
      occupation: "Auxiliar de producao",
      income: 2600,
      score: 69,
      feePaid: true,
      status: "profile_unlocked",
      phone: "47988886666",
      questionnaire: [
        {
          question: "Visitantes e parentes por longos periodos",
          answer: "Neutro",
          note: "Precisa alinhar regra de ocupacao no contrato."
        },
        {
          question: "Regras de condominio e convivio",
          answer: "Concorda",
          note: "Baixo risco de atrito com vizinhanca."
        },
        {
          question: "Pequenos danos devem ser resolvidos rapido",
          answer: "Concorda totalmente",
          note: "Boa tendencia de manutencao preventiva."
        }
      ],
      updated_at: "2026-03-16T10:30:00Z"
    },
    {
      id: "lead-3",
      propertyId: "local-property-1",
      tenantName: "Marcelo Ribeiro",
      ageRange: "34 anos",
      origin: "Fortaleza/CE",
      family: "Casado e 1 filho",
      occupation: "Soldador",
      income: 3100,
      score: 58,
      feePaid: true,
      status: "rejected",
      phone: "47988885555",
      questionnaire: [
        {
          question: "Imprevistos justificam adiar compromissos",
          answer: "Concorda totalmente",
          note: "Risco maior de flexibilizar aluguel e contas."
        },
        {
          question: "Compartilhar espaco com parentes",
          answer: "Concorda totalmente",
          note: "Risco de superlotacao sem aviso."
        }
      ],
      rejectionReason: "Perfil nao apropriado para a rotina silenciosa do predio.",
      updated_at: "2026-03-16T10:45:00Z"
    }
  ],
  visits: [
    {
      id: "visit-1",
      leadId: "lead-2",
      propertyId: "local-property-2",
      tenantName: "Aline Souza",
      when: "2026-03-18T14:00:00Z",
      mode: "presencial",
      status: "requested",
      operator: "Equipe Aluguel Seguro"
    },
    {
      id: "visit-2",
      leadId: "lead-1",
      propertyId: "local-property-1",
      tenantName: "Daniel Costa",
      when: "2026-03-20T09:30:00Z",
      mode: "presencial",
      status: "confirmed",
      operator: "Equipe Aluguel Seguro"
    }
  ],
  services: {
    requirePaystub: true,
    requireProlabore: false,
    enableSerasa: true,
    depositAmount: 1850,
    cancellationFee: 925,
    boletoInstallments: "3",
    enableSecretary: true,
    secretaryFee: 49.99,
    supportChannel: "telefone_e_whatsapp"
  },
  supportTickets: [
    {
      id: "support-1",
      name: "Locador Demo",
      phone: "47999998888",
      topic: "Duvida sobre assinatura digital",
      preferredTime: "Apos as 15h",
      notes: "Preciso entender a clausula de multa e o fluxo de boleto.",
      status: "Em retorno pela equipe",
      createdAt: "2026-03-16T11:00:00Z"
    }
  ]
});

const portalEscapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const portalCurrency = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const portalDate = (value) => {
  if (!value) {
    return "A definir";
  }

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const loadPortalState = () => {
  const base = portalBaseState();

  try {
    const raw = localStorage.getItem(PORTAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(base));
      return base;
    }

    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      properties: Array.isArray(parsed.properties) ? parsed.properties : base.properties,
      leads: Array.isArray(parsed.leads) ? parsed.leads : base.leads,
      visits: Array.isArray(parsed.visits) ? parsed.visits : base.visits,
      supportTickets: Array.isArray(parsed.supportTickets)
        ? parsed.supportTickets
        : base.supportTickets,
      services: {
        ...base.services,
        ...(parsed.services || {})
      }
    };
  } catch (error) {
    localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(base));
    return base;
  }
};

const savePortalState = (state) => {
  localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(state));
};

const PORTAL_API_BASE_URL =
  window.ALUGUEL_API_BASE_URL ||
  document.querySelector('meta[name="api-base-url"]')?.getAttribute("content") ||
  "http://localhost:8000/api/v1";

const PORTAL_AUTH_TOKEN_KEY = "aluguelSeguroToken";

const portalApiRequest = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = localStorage.getItem(PORTAL_AUTH_TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${PORTAL_API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "Falha ao carregar dados da API.");
    error.status = response.status;
    throw error;
  }

  return payload;
};

const loadPortalRemoteData = async () => {
  const requests = [portalApiRequest("/properties?per_page=50")];
  const token = localStorage.getItem(PORTAL_AUTH_TOKEN_KEY);

  if (token) {
    requests.push(portalApiRequest("/tenants?per_page=50"));
    requests.push(portalApiRequest("/landlord/properties"));
    requests.push(portalApiRequest("/landlord/interests"));
    requests.push(portalApiRequest("/landlord/visits"));
    requests.push(portalApiRequest("/landlord/support-tickets"));
    requests.push(
      portalApiRequest("/landlords/me").catch((error) => {
        if (error.status === 404 || error.status === 401) {
          return null;
        }
        throw error;
      })
    );
  }

  const [
    propertiesResponse,
    tenantsResponse,
    landlordPropertiesResponse,
    interestsResponse,
    visitsResponse,
    supportTicketsResponse,
    landlordResponse
  ] = await Promise.all(requests);

  return {
    liveProperties: propertiesResponse?.data || [],
    liveTenants: tenantsResponse?.data || [],
    landlordProperties: landlordPropertiesResponse?.data || [],
    landlordInterests: interestsResponse?.data || [],
    landlordVisits: visitsResponse?.data || [],
    supportTickets: supportTicketsResponse?.data || [],
    landlord: landlordResponse?.data || landlordResponse || null
  };
};

const mapInterestToLead = (interest) => ({
  id: String(interest.id),
  propertyId: interest.property?.id,
  tenantName: interest.profile?.full_name || "Perfil sem nome",
  ageRange: interest.profile?.age_range || "Nao informado",
  origin: interest.profile?.rental_reason || "Origem nao informada",
  family: `${interest.profile?.household_size || 1} pessoa(s) no grupo familiar`,
  occupation: interest.profile?.occupation || "Profissao nao informada",
  income: Number(interest.profile?.monthly_income || 0),
  score: Number(interest.profile?.score || 0),
  feePaid: interest.payment_status === "paid",
  status: interest.landlord_decision || (interest.payment_status === "paid" ? "profile_unlocked" : "pending_fee"),
  phone: interest.profile?.phone || "",
  questionnaire: [
    {
      question: "Compatibilidade geral",
      answer: `${interest.profile?.score || 0}/100`,
      note: interest.landlord_notes || "Perfil analisado pela equipe a partir do questionario comportamental."
    }
  ],
  rejectionReason: interest.landlord_decision === "rejected" ? interest.landlord_notes : "",
  contract: interest.contract || null,
  updated_at: interest.updated_at
});

const mapVisitToCard = (visit) => ({
  id: String(visit.id),
  leadId: String(visit.property_interest_id),
  propertyId: visit.property?.id || visit.property_id,
  tenantName: visit.interest?.profile?.full_name || "Interessado",
  when: visit.scheduled_for,
  mode: visit.mode || "presencial",
  status: visit.status,
  operator: visit.operator_name || "Equipe Aluguel Seguro"
});

const mapSupportTicket = (ticket) => ({
  id: String(ticket.id),
  name: ticket.name,
  phone: ticket.phone,
  topic: ticket.topic,
  preferredTime: ticket.preferred_time,
  notes: ticket.notes,
  status: ticket.status,
  createdAt: ticket.created_at
});

const portalStatusClass = (status) => {
  if (["pending_fee", "requested"].includes(status)) {
    return "pending";
  }

  if (["profile_unlocked", "confirmed", "contract_ready", "ativo"].includes(status)) {
    return "ready";
  }

  if (["contact_requested", "agendado"].includes(status)) {
    return "progress";
  }

  return "alert";
};

const portalStatusLabel = (status) => {
  const map = {
    pending_fee: "Taxa pendente",
    profile_unlocked: "Perfil liberado",
    contact_requested: "Contato solicitado",
    rejected: "Perfil nao apropriado",
    contract_ready: "Contrato em preparacao",
    requested: "Solicitacao aberta",
    confirmed: "Visita confirmada",
    canceled: "Cancelada",
    ativo: "Em divulgacao"
  };

  return map[status] || status;
};

const getPropertyById = (state, propertyId) =>
  state.properties.find((property) => property.id === propertyId);

const ensureVisitForLead = (state, lead) => {
  const existing = state.visits.find((visit) => visit.leadId === lead.id);
  if (existing) {
    return;
  }

  state.visits.unshift({
    id: `visit-${Date.now()}`,
    leadId: lead.id,
    propertyId: lead.propertyId,
    tenantName: lead.tenantName,
    when: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    mode: "presencial",
    status: "requested",
    operator: "Equipe Aluguel Seguro"
  });
};

const setPortalStatus = (element, message) => {
  if (element) {
    element.textContent = message;
  }
};

const initDashboardPage = async () => {
  const page = document.querySelector('[data-page="dashboard"]');
  if (!page) {
    return;
  }

  const state = loadPortalState();
  const alerts = document.querySelector('[data-dashboard-alerts]');
  const nextSteps = document.querySelector('[data-dashboard-steps]');
  const landlordName = document.querySelector('[data-dashboard-landlord]');
  const liveTag = document.querySelector('[data-dashboard-live-tag]');

  const summaryNodes = {
    properties: document.querySelector('[data-dashboard-properties]'),
    leads: document.querySelector('[data-dashboard-leads]'),
    visits: document.querySelector('[data-dashboard-visits]'),
    revenue: document.querySelector('[data-dashboard-revenue]')
  };

  if (liveTag) {
    liveTag.textContent = "Sincronizando dados da API...";
  }

  try {
    const remote = await loadPortalRemoteData();
    const activeProperties = (remote.landlordProperties?.length || remote.liveProperties.length) + state.properties.length;
    const liveTenants = remote.liveTenants.length;
    const liveLeads = (remote.landlordInterests || []).map(mapInterestToLead);
    const liveVisits = (remote.landlordVisits || []).map(mapVisitToCard);
    const pendingFees = liveLeads.filter((lead) => lead.status === "pending_fee");
    const unlockedProfiles = liveLeads.filter((lead) => lead.feePaid);
    const confirmedVisits = liveVisits.filter((visit) => visit.status === "confirmed");

    if (summaryNodes.properties) {
      summaryNodes.properties.textContent = String(activeProperties);
    }
    if (summaryNodes.leads) {
      summaryNodes.leads.textContent = String(liveTenants || unlockedProfiles.length);
    }
    if (summaryNodes.visits) {
      summaryNodes.visits.textContent = String(confirmedVisits.length);
    }
    if (summaryNodes.revenue) {
      const monthly = state.services.enableSecretary ? state.services.secretaryFee : 0;
      summaryNodes.revenue.textContent = portalCurrency(monthly + unlockedProfiles.length * 4.99);
    }

    if (landlordName) {
      landlordName.textContent = remote.landlord?.name || "Locador";
    }

    if (liveTag) {
      liveTag.textContent = `${remote.landlordProperties?.length || 0} imovel(is) do locador · ${liveLeads.length} interesse(s) real(is) · ${confirmedVisits.length} visita(s)`;
    }

    if (alerts) {
      alerts.innerHTML = [
        `${pendingFees.length} interesse(s) aguardando taxa de R$ 4,99 para liberar perfil.`,
        `${remote.landlordProperties?.length || remote.liveProperties.length} anuncio(s) reais disponiveis hoje na API.`,
        `${confirmedVisits.length} visita(s) ja confirmadas com suporte humanizado.`,
        `${(remote.supportTickets || []).length} atendimento(s) abertos para telefone ou WhatsApp.`
      ]
        .map((item) => `<li>${portalEscapeHtml(item)}</li>`)
        .join("");
    }
  } catch (error) {
    if (liveTag) {
      liveTag.textContent = "API indisponivel no momento. Mantendo modo operacional local.";
    }

    if (summaryNodes.properties) {
      summaryNodes.properties.textContent = String(state.properties.length);
    }
    if (summaryNodes.leads) {
      summaryNodes.leads.textContent = String(state.leads.filter((lead) => lead.feePaid).length);
    }
    if (summaryNodes.visits) {
      summaryNodes.visits.textContent = String(state.visits.filter((visit) => visit.status === "confirmed").length);
    }
    if (summaryNodes.revenue) {
      const monthly = state.services.enableSecretary ? state.services.secretaryFee : 0;
      summaryNodes.revenue.textContent = portalCurrency(monthly + state.leads.filter((lead) => lead.feePaid).length * 4.99);
    }

    if (alerts) {
      alerts.innerHTML = [`Modo local ativo: ${error.message}`]
        .map((item) => `<li>${portalEscapeHtml(item)}</li>`)
        .join("");
    }
  }

  if (nextSteps) {
    nextSteps.innerHTML = [
      "Cadastre ou revise seus imoveis ativos.",
      "Libere perfis pagos e decida quem seguir para contato.",
      "Acione a equipe para agendar a visita e preparar o contrato.",
      "Ative boleto, cobranca e reajuste mensal quando o contrato avancar."
    ]
      .map((item) => `<li>${portalEscapeHtml(item)}</li>`)
      .join("");
  }
};

const initPropertiesPage = async () => {
  const page = document.querySelector('[data-page="properties"]');
  if (!page) {
    return;
  }

  const state = loadPortalState();
  const liveList = document.querySelector('[data-property-library-live]');
  const localList = document.querySelector('[data-property-library-local]');
  const status = document.querySelector('[data-property-library-status]');
  if (!liveList || !localList) {
    return;
  }

  const renderPropertyCard = (property, leadCount, sourceLabel) =>
    `
      <article class="property-shell reveal">
        <header>
          <div>
            <h2>${portalEscapeHtml(property.title)}</h2>
            <small>${portalEscapeHtml(property.city)} · ${portalEscapeHtml(property.address_neighborhood || property.neighborhood || "bairro a definir")}</small>
          </div>
          <span class="status-chip ${portalStatusClass(property.status || "ativo")}">${portalEscapeHtml(sourceLabel)}</span>
        </header>
        <div class="tag-row">
          <span class="chip">${portalEscapeHtml(property.property_type)}</span>
          <span class="chip">${portalEscapeHtml(String(property.bedrooms))} quarto(s)</span>
          <span class="chip">${property.has_garage ? "Com garagem" : "Sem garagem"}</span>
        </div>
        <p>${portalEscapeHtml(property.description || "Sem descricao detalhada.")}</p>
        <div class="metric-strip">
          <div class="metric-box"><strong>${portalCurrency(property.rent_price)}</strong><span>aluguel</span></div>
          <div class="metric-box"><strong>${portalCurrency(property.deposit_amount || 0)}</strong><span>caucao maxima</span></div>
          <div class="metric-box"><strong>${leadCount}</strong><span>interesse(s)</span></div>
        </div>
        <div class="callout">${portalEscapeHtml(property.guarantee_notes || "Analise de perfil, contrato digital e suporte assistido.")}</div>
      </article>
    `;

  localList.innerHTML = state.properties.length
    ? state.properties
        .map((property) => {
          const leadCount = state.leads.filter((lead) => lead.propertyId === property.id).length;
          return renderPropertyCard(property, leadCount, "Carteira operacional");
        })
        .join("")
    : '<div class="empty-state">Nenhum imovel operacional salvo localmente.</div>';

  if (status) {
    status.textContent = "Carregando anuncios reais da API...";
  }

  try {
    const remote = await loadPortalRemoteData();
    const landlordProperties = remote.landlordProperties?.length ? remote.landlordProperties : remote.liveProperties;
    liveList.innerHTML = landlordProperties.length
      ? landlordProperties
          .map((property) => renderPropertyCard(property, 0, "Publicado na API"))
          .join("")
      : '<div class="empty-state">Nenhum imovel real encontrado na API.</div>';

    if (status) {
      status.textContent = `${landlordProperties.length} imovel(is) real(is) carregados da API.`;
    }
  } catch (error) {
    liveList.innerHTML = `<div class="empty-state">${portalEscapeHtml(error.message)}</div>`;
    if (status) {
      status.textContent = "API indisponivel. Exibindo apenas a carteira local.";
    }
  }
};

const initPropertyFormPage = () => {
  const page = document.querySelector('[data-page="property-form"]');
  if (!page) {
    return;
  }

  const form = document.querySelector('[data-property-form]');
  const status = document.querySelector('[data-property-form-status]');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const state = loadPortalState();
    const payload = {
      title: formData.get('title'),
      city: formData.get('city'),
      state: 'SC',
      address_neighborhood: formData.get('neighborhood'),
      property_type: formData.get('property_type'),
      rent_price: Number(formData.get('rent_price') || 0),
      bedrooms: Number(formData.get('bedrooms') || 1),
      has_garage: formData.get('has_garage') === '1',
      description: formData.get('description'),
      is_active: true
    };

    try {
      if (localStorage.getItem(PORTAL_AUTH_TOKEN_KEY)) {
        await portalApiRequest('/landlord/properties', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        form.reset();
        setPortalStatus(status, 'Imovel publicado no backend com sucesso.');
        return;
      }
    } catch (error) {
      setPortalStatus(status, `Falha ao publicar na API: ${error.message}. Salvando localmente.`);
    }

    state.properties.unshift({
      id: `local-property-${Date.now()}`,
      title: formData.get('title'),
      city: formData.get('city'),
      neighborhood: formData.get('neighborhood'),
      property_type: formData.get('property_type'),
      rent_price: Number(formData.get('rent_price') || 0),
      bedrooms: Number(formData.get('bedrooms') || 1),
      has_garage: formData.get('has_garage') === '1',
      support_level: formData.get('support_level'),
      deposit_amount: Number(formData.get('deposit_amount') || 0),
      description: formData.get('description'),
      guarantee_notes: formData.get('guarantee_notes'),
      status: 'ativo',
      whatsapp: formData.get('whatsapp'),
      created_at: new Date().toISOString()
    });

    savePortalState(state);
    form.reset();
    setPortalStatus(status, 'Imovel salvo na sua carteira local. Abra o portfolio para revisar a nova tela.');
  });
};

const initLeadsPage = () => {
  const page = document.querySelector('[data-page="leads"]');
  if (!page) {
    return;
  }

  const list = document.querySelector('[data-lead-board]');
  const status = document.querySelector('[data-lead-status]');
  if (!list) {
    return;
  }

  const render = async () => {
    const state = loadPortalState();
    let leads = state.leads;
    let properties = state.properties;

    try {
      if (localStorage.getItem(PORTAL_AUTH_TOKEN_KEY)) {
        const remote = await loadPortalRemoteData();
        leads = (remote.landlordInterests || []).map(mapInterestToLead);
        properties = remote.landlordProperties || properties;
      }
    } catch (error) {
      setPortalStatus(status, `Modo local ativo: ${error.message}`);
    }

    if (leads.length === 0) {
      list.innerHTML = '<div class="empty-state">Nenhum interesse registrado ainda.</div>';
      return;
    }

    list.innerHTML = leads
      .map((lead) => {
        const property = properties.find((item) => String(item.id) === String(lead.propertyId));
        const actions = [];
        if (!lead.feePaid) {
          actions.push(`<button class="button" type="button" data-action="mark-paid" data-lead-id="${portalEscapeHtml(lead.id)}">Confirmar taxa de R$ 4,99</button>`);
        }
        if (lead.feePaid && lead.status !== 'rejected') {
          actions.push(`<button class="button" type="button" data-action="request-contact" data-lead-id="${portalEscapeHtml(lead.id)}">Contatar inquilino</button>`);
          actions.push(`<button class="button ghost" type="button" data-action="prepare-contract" data-lead-id="${portalEscapeHtml(lead.id)}">Preparar contrato</button>`);
        }
        if (lead.status !== 'rejected') {
          actions.push(`<button class="button ghost" type="button" data-action="reject-profile" data-lead-id="${portalEscapeHtml(lead.id)}">Perfil nao apropriado</button>`);
        }

        return `
          <article class="lead-card reveal">
            <header>
              <div>
                <h2>${portalEscapeHtml(lead.tenantName)}</h2>
                <small>${portalEscapeHtml(lead.origin)} · ${portalEscapeHtml(lead.family)} · ${portalEscapeHtml(lead.occupation)}</small>
              </div>
              <div>
                <div class="lead-score">${portalEscapeHtml(String(lead.score))}</div>
                <span class="status-chip ${portalStatusClass(lead.status)}">${portalEscapeHtml(portalStatusLabel(lead.status))}</span>
              </div>
            </header>
            <div class="metric-strip">
              <div class="metric-box"><strong>${portalCurrency(lead.income)}</strong><span>renda</span></div>
              <div class="metric-box"><strong>${portalEscapeHtml(lead.ageRange)}</strong><span>faixa etaria</span></div>
              <div class="metric-box"><strong>${property ? portalEscapeHtml(property.title) : 'Imovel'}</strong><span>interesse</span></div>
            </div>
            <div class="qa-grid">
              ${lead.questionnaire
                .map(
                  (item) => `
                    <div class="qa-item">
                      <strong>${portalEscapeHtml(item.question)}</strong>
                      <div>${portalEscapeHtml(item.answer)}</div>
                      <small>${portalEscapeHtml(item.note)}</small>
                    </div>
                  `
                )
                .join('')}
            </div>
            ${lead.rejectionReason ? `<div class="callout">${portalEscapeHtml(lead.rejectionReason)}</div>` : ''}
            <div class="action-row">${actions.join('')}</div>
          </article>
        `;
      })
      .join('');
  };

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const state = loadPortalState();
    const lead = state.leads.find((item) => item.id === button.dataset.leadId);
    const token = localStorage.getItem(PORTAL_AUTH_TOKEN_KEY);

    try {
      if (token) {
        if (button.dataset.action === 'mark-paid') {
          await portalApiRequest(`/landlord/interests/${button.dataset.leadId}/mark-paid`, { method: 'POST', body: JSON.stringify({}) });
          setPortalStatus(status, 'Taxa confirmada no backend.');
        }

        if (button.dataset.action === 'request-contact') {
          await portalApiRequest(`/landlord/interests/${button.dataset.leadId}/request-contact`, { method: 'POST', body: JSON.stringify({}) });
          setPortalStatus(status, 'Equipe acionada para contato e visita.');
        }

        if (button.dataset.action === 'reject-profile') {
          await portalApiRequest(`/landlord/interests/${button.dataset.leadId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: 'Perfil nao apropriado para a rotina deste imovel.' })
          });
          setPortalStatus(status, 'Perfil encerrado no backend.');
        }

        if (button.dataset.action === 'prepare-contract') {
          const liveProperty = lead ? getPropertyById(state, lead.propertyId) : null;
          await portalApiRequest(`/landlord/interests/${button.dataset.leadId}/generate-contract`, {
            method: 'POST',
            body: JSON.stringify({
              start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              end_date: new Date(Date.now() + 372 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              rent_amount: Number(liveProperty?.rent_price || state.services.depositAmount || 0),
              deposit_amount: Number(state.services.depositAmount || 0),
              fire_insurance: 38.5,
              garbage_fee: 21.5,
              boleto_installments: Number(state.services.boletoInstallments || 1),
              cancellation_fee: Number(state.services.cancellationFee || 0),
              require_paystub: Boolean(state.services.requirePaystub),
              require_prolabore: Boolean(state.services.requireProlabore),
              enable_serasa: Boolean(state.services.enableSerasa)
            })
          });
          setPortalStatus(status, 'Contrato digital e boletos iniciais gerados.');
        }

        await render();
        return;
      }
    } catch (error) {
      setPortalStatus(status, error.message);
      return;
    }

    if (!lead) {
      return;
    }

    switch (button.dataset.action) {
      case 'mark-paid':
        lead.feePaid = true;
        lead.status = 'profile_unlocked';
        lead.updated_at = new Date().toISOString();
        setPortalStatus(status, `Perfil de ${lead.tenantName} liberado para contato.`);
        break;
      case 'request-contact':
        lead.status = 'contact_requested';
        lead.updated_at = new Date().toISOString();
        ensureVisitForLead(state, lead);
        setPortalStatus(status, `Equipe acionada para contato com ${lead.tenantName}.`);
        break;
      case 'reject-profile':
        lead.status = 'rejected';
        lead.rejectionReason = 'O imovel fica oculto para este inquilino em novas buscas e o WhatsApp informa indisponibilidade.';
        lead.updated_at = new Date().toISOString();
        setPortalStatus(status, `Perfil marcado como nao apropriado para ${lead.tenantName}.`);
        break;
      case 'prepare-contract':
        lead.status = 'contract_ready';
        lead.updated_at = new Date().toISOString();
        setPortalStatus(status, `Contrato seguro iniciado para ${lead.tenantName}.`);
        break;
      default:
        break;
    }

    savePortalState(state);
    render();
  });

  render();
};

const initVisitsPage = () => {
  const page = document.querySelector('[data-page="visits"]');
  if (!page) {
    return;
  }

  const pending = document.querySelector('[data-visit-pending]');
  const confirmed = document.querySelector('[data-visit-confirmed]');
  const status = document.querySelector('[data-visit-status]');
  if (!pending || !confirmed) {
    return;
  }

  const renderVisits = async () => {
    const state = loadPortalState();
    let visits = state.visits;

    try {
      if (localStorage.getItem(PORTAL_AUTH_TOKEN_KEY)) {
        const remote = await loadPortalRemoteData();
        visits = (remote.landlordVisits || []).map(mapVisitToCard);
      }
    } catch (error) {
      setPortalStatus(status, `Modo local ativo: ${error.message}`);
    }

    const requested = visits.filter((visit) => visit.status === 'requested');
    const scheduled = visits.filter((visit) => visit.status === 'confirmed');

    pending.innerHTML = requested.length
      ? requested
          .map(
            (visit) => `
              <article class="visit-card">
                <header>
                  <div>
                    <h3>${portalEscapeHtml(visit.tenantName)}</h3>
                    <small>${portalDate(visit.when)} · ${portalEscapeHtml(visit.operator)}</small>
                  </div>
                  <span class="status-chip ${portalStatusClass(visit.status)}">${portalEscapeHtml(portalStatusLabel(visit.status))}</span>
                </header>
                <div class="action-row">
                  <button class="button" type="button" data-visit-action="confirm" data-visit-id="${portalEscapeHtml(visit.id)}">Confirmar visita</button>
                  <button class="button ghost" type="button" data-visit-action="cancel" data-visit-id="${portalEscapeHtml(visit.id)}">Cancelar</button>
                </div>
              </article>
            `
          )
          .join('')
      : '<div class="empty-state">Nenhuma visita aguardando confirmacao.</div>';

    confirmed.innerHTML = scheduled.length
      ? scheduled
          .map(
            (visit) => `
              <article class="visit-card">
                <header>
                  <div>
                    <h3>${portalEscapeHtml(visit.tenantName)}</h3>
                    <small>${portalDate(visit.when)} · ${portalEscapeHtml(visit.mode)}</small>
                  </div>
                  <span class="status-chip ${portalStatusClass(visit.status)}">${portalEscapeHtml(portalStatusLabel(visit.status))}</span>
                </header>
                <div class="callout">Equipe faz o contato, alinha horario e deixa a visita sob responsabilidade do locador.</div>
              </article>
            `
          )
          .join('')
      : '<div class="empty-state">Ainda nao ha visitas confirmadas.</div>';
  };

  page.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-visit-action]');
    if (!button) {
      return;
    }

    const state = loadPortalState();
    const visit = state.visits.find((item) => item.id === button.dataset.visitId);
    const token = localStorage.getItem(PORTAL_AUTH_TOKEN_KEY);

    try {
      if (token) {
        await portalApiRequest(`/landlord/visits/${button.dataset.visitId}/${button.dataset.visitAction}`, {
          method: 'POST',
          body: JSON.stringify({})
        });
        setPortalStatus(status, button.dataset.visitAction === 'confirm' ? 'Visita confirmada.' : 'Visita cancelada.');
        await renderVisits();
        return;
      }
    } catch (error) {
      setPortalStatus(status, error.message);
      return;
    }

    if (!visit) {
      return;
    }

    if (button.dataset.visitAction === 'confirm') {
      visit.status = 'confirmed';
      setPortalStatus(status, `Visita de ${visit.tenantName} confirmada.`);
    }

    if (button.dataset.visitAction === 'cancel') {
      visit.status = 'canceled';
      setPortalStatus(status, `Visita de ${visit.tenantName} cancelada.`);
    }

    savePortalState(state);
    renderVisits();
  });

  renderVisits();
};

const initServicesPage = () => {
  const page = document.querySelector('[data-page="services"]');
  if (!page) {
    return;
  }

  const form = document.querySelector('[data-service-form]');
  const status = document.querySelector('[data-service-status]');
  const summary = document.querySelector('[data-service-summary]');
  if (!form || !summary) {
    return;
  }

  const render = () => {
    const state = loadPortalState();
    form.require_paystub.checked = Boolean(state.services.requirePaystub);
    form.require_prolabore.checked = Boolean(state.services.requireProlabore);
    form.enable_serasa.checked = Boolean(state.services.enableSerasa);
    form.enable_secretary.checked = Boolean(state.services.enableSecretary);
    form.deposit_amount.value = state.services.depositAmount;
    form.cancellation_fee.value = state.services.cancellationFee;
    form.boleto_installments.value = state.services.boletoInstallments;

    summary.innerHTML = `
      <div class="report-item">
        <span class="report-label">Plano mensal</span>
        <span class="report-value">${state.services.enableSecretary ? portalCurrency(state.services.secretaryFee) + ' / mes' : 'Desativado'}</span>
      </div>
      <div class="report-item">
        <span class="report-label">Garantias do contrato</span>
        <span class="report-value">${state.services.requirePaystub ? 'Contracheque' : 'Sem contracheque'} · ${state.services.requireProlabore ? 'Pro-labore' : 'Sem pro-labore'}</span>
      </div>
      <div class="report-item">
        <span class="report-label">Caucao maxima</span>
        <span class="report-value">${portalCurrency(state.services.depositAmount)}</span>
      </div>
      <div class="report-item">
        <span class="report-label">Boleto inicial</span>
        <span class="report-value">Taxa de lixo + seguro incendio em ate ${portalEscapeHtml(state.services.boletoInstallments)}x</span>
      </div>
    `;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const state = loadPortalState();
    state.services = {
      ...state.services,
      requirePaystub: form.require_paystub.checked,
      requireProlabore: form.require_prolabore.checked,
      enableSerasa: form.enable_serasa.checked,
      enableSecretary: form.enable_secretary.checked,
      depositAmount: Number(form.deposit_amount.value || 0),
      cancellationFee: Number(form.cancellation_fee.value || 0),
      boletoInstallments: form.boleto_installments.value
    };
    savePortalState(state);
    render();
    setPortalStatus(status, 'Politicas do contrato e servicos atualizadas na demonstracao.');
  });

  render();
};

const initSupportPage = () => {
  const page = document.querySelector('[data-page="support"]');
  if (!page) {
    return;
  }

  const form = document.querySelector('[data-support-form]');
  const queue = document.querySelector('[data-support-queue]');
  const status = document.querySelector('[data-support-status]');
  if (!form || !queue) {
    return;
  }

  const render = async () => {
    const state = loadPortalState();
    let tickets = state.supportTickets;

    try {
      if (localStorage.getItem(PORTAL_AUTH_TOKEN_KEY)) {
        const remote = await loadPortalRemoteData();
        tickets = (remote.supportTickets || []).map(mapSupportTicket);
      }
    } catch (error) {
      setPortalStatus(status, `Modo local ativo: ${error.message}`);
    }

    queue.innerHTML = tickets.length
      ? tickets
          .map(
            (ticket) => `
              <article class="support-card">
                <header>
                  <div>
                    <h3>${portalEscapeHtml(ticket.topic)}</h3>
                    <small>${portalEscapeHtml(ticket.name)} · ${portalEscapeHtml(ticket.phone)}</small>
                  </div>
                  <span class="status-chip progress">${portalEscapeHtml(ticket.status)}</span>
                </header>
                <p>${portalEscapeHtml(ticket.notes)}</p>
                <small>Melhor horario: ${portalEscapeHtml(ticket.preferredTime)} · aberto em ${portalDate(ticket.createdAt)}</small>
              </article>
            `
          )
          .join('')
      : '<div class="empty-state">Nenhum atendimento aberto.</div>';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      topic: formData.get('topic'),
      preferred_time: formData.get('preferred_time'),
      notes: formData.get('notes')
    };

    try {
      if (localStorage.getItem(PORTAL_AUTH_TOKEN_KEY)) {
        await portalApiRequest('/landlord/support-tickets', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        form.reset();
        await render();
        setPortalStatus(status, 'Pedido enviado para a equipe pelo backend.');
        return;
      }
    } catch (error) {
      setPortalStatus(status, `Falha ao registrar suporte na API: ${error.message}`);
    }

    const state = loadPortalState();
    state.supportTickets.unshift({
      id: `support-${Date.now()}`,
      name: formData.get('name'),
      phone: formData.get('phone'),
      topic: formData.get('topic'),
      preferredTime: formData.get('preferred_time'),
      notes: formData.get('notes'),
      status: 'Recebido pela equipe',
      createdAt: new Date().toISOString()
    });

    savePortalState(state);
    form.reset();
    render();
    setPortalStatus(status, 'Pedido enviado. Nossa equipe retorna por telefone ou WhatsApp.');
  });

  render();
};

document.addEventListener('DOMContentLoaded', () => {
  initDashboardPage();
  initPropertiesPage();
  initPropertyFormPage();
  initLeadsPage();
  initVisitsPage();
  initServicesPage();
  initSupportPage();
});
