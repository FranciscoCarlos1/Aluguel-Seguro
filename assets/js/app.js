const API_BASE_URL =
  window.ALUGUEL_API_BASE_URL ||
  document.querySelector('meta[name="api-base-url"]')?.getAttribute("content") ||
  "http://localhost:8000/api/v1";
const AUTH_TOKEN_KEY = "aluguelSeguroToken";
const SESSION_EMAIL_KEY = "aluguelSeguroEmail";
const SESSION_ACCOUNT_TYPE_KEY = "aluguelSeguroAccountType";
const LAST_ROUTE_KEY = "aluguelSeguroLastRoute";
const PROSPECT_PHONE_KEY = "aluguelSeguroProspectPhone";

const AppState = {
  profile: null,
  session: null,
};

const setStatus = (status, message, isError = false) => {
  if (!status) {
    return;
  }
  status.textContent = message;
  status.style.color = isError ? "#b42318" : "#d6532e";
};

const setFormValue = (form, name, value) => {
  if (!form) {
    return;
  }
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) {
    return;
  }
  field.value = value ?? "";
};

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const setToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

const clearToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

const setSessionEmail = (email) => {
  if (email) {
    localStorage.setItem(SESSION_EMAIL_KEY, email);
  }
};

const setSessionAccountType = (accountType) => {
  if (accountType) {
    localStorage.setItem(SESSION_ACCOUNT_TYPE_KEY, accountType);
  }
};

const getSessionAccountType = () =>
  localStorage.getItem(SESSION_ACCOUNT_TYPE_KEY) || "landlord";

const getSessionEmail = () => localStorage.getItem(SESSION_EMAIL_KEY);

const clearSessionEmail = () => {
  localStorage.removeItem(SESSION_EMAIL_KEY);
};

const clearSessionAccountType = () => {
  localStorage.removeItem(SESSION_ACCOUNT_TYPE_KEY);
};

const setLastRoute = (route) => {
  if (route) {
    localStorage.setItem(LAST_ROUTE_KEY, route);
  }
};

const getLastRoute = () => localStorage.getItem(LAST_ROUTE_KEY);

const clearLastRoute = () => {
  localStorage.removeItem(LAST_ROUTE_KEY);
};

const normalizePhone = (value) => String(value || "").replace(/\D+/g, "");

const getProspectPhone = () => localStorage.getItem(PROSPECT_PHONE_KEY);

const setProspectPhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (normalized) {
    localStorage.setItem(PROSPECT_PHONE_KEY, normalized);
  }
};

const isAuthPage = () =>
  /\/(login|register)\.html$/.test(window.location.pathname);

const trackLastRoute = () => {
  if (isAuthPage()) {
    return;
  }

  const route = `${window.location.pathname}${window.location.search}`;
  setLastRoute(route);
};

const apiRequest = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Nao foi possivel conectar a API. Confira se o backend esta rodando e se o frontend foi aberto via http://localhost:5500."
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message || "Falha ao processar requisicao.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
};

const getAccountTypeLabel = (accountType) => {
  if (accountType === "tenant") {
    return "inquilino";
  }

  return "locador";
};

const getPostAuthRoute = (accountType) =>
  accountType === "tenant" ? "profile.html" : "dashboard.html";

const updateSessionUI = () => {
  const label = document.querySelector("[data-session-label]");
  const action = document.querySelector("[data-session-action]");
  const hasToken = Boolean(getToken());
  const email = getSessionEmail();
  const accountType = getSessionAccountType();
  const authOnlyItems = document.querySelectorAll("[data-auth-only]");
  const guestOnlyItems = document.querySelectorAll("[data-guest-only]");

  if (label) {
    label.textContent = hasToken
      ? `Sessao ativa${email ? ` · ${email}` : ""}${accountType ? ` · ${getAccountTypeLabel(accountType)}` : ""}`
      : "Sem sessao";
  }

  if (action) {
    action.textContent = hasToken ? "Sair" : "Entrar";
    action.dataset.sessionMode = hasToken ? "logout" : "login";
  }

  authOnlyItems.forEach((item) => {
    item.classList.toggle("is-hidden", !hasToken);
  });

  guestOnlyItems.forEach((item) => {
    item.classList.toggle("is-hidden", hasToken);
  });
};

const initSessionActions = () => {
  document.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-session-action]");
    if (!action) {
      return;
    }

    if (action.dataset.sessionMode === "login") {
      window.location.href = "login.html";
      return;
    }

    if (!window.confirm("Deseja realmente sair?")) {
      return;
    }

    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      // Ignore logout failures.
    } finally {
      clearToken();
      clearSessionEmail();
      clearSessionAccountType();
      clearLastRoute();
      updateSessionUI();
      window.location.href = "index.html";
    }
  });
};

const formatIncomeRange = (range) => {
  switch (range) {
    case "ate_2000":
      return "ate R$ 2000";
    case "2000_5000":
      return "R$ 2000 a 5000";
    case "5000_10000":
      return "R$ 5000 a 10000";
    case "acima_10000":
      return "acima de R$ 10000";
    default:
      return "renda nao informada";
  }
};

const buildProfileSummary = (tenant, profile) => {
  const name = tenant.full_name || "Inquilino";
  const occupation = tenant.occupation || "profissao nao informada";
  const income = formatIncomeRange(tenant.monthly_income_range);
  const references = profile?.references_text || "nao informado";
  const notes = profile?.notes || "nao informado";

  return (
    `${name} atua como ${occupation}. ` +
    `Faixa de renda: ${income}. ` +
    `Referencias: ${references}. ` +
    `Observacoes: ${notes}.`
  );
};

const estimateScore = (income, references, notes) => {
  let score = 40;
  const incomeValue = Number(income);

  if (incomeValue >= 5000) {
    score += 20;
  } else if (incomeValue >= 2000) {
    score += 10;
  }

  if (references && references.length > 10) {
    score += 15;
  }

  if (notes && notes.length > 20) {
    score += 10;
  }

  return Math.min(score, 100);
};

const formHandlers = {
  async login(form, status) {
    const formData = new FormData(form);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setToken(response.token);
    AppState.session = response.user;
    setSessionEmail(response.user.email);
    setSessionAccountType(response.user.account_type || "landlord");
    setStatus(status, `Sessao iniciada para ${response.user.email}.`);
    updateSessionUI();
    window.location.href = getLastRoute() || getPostAuthRoute(response.user.account_type || "landlord");
  },
  async register(form, status) {
    const formData = new FormData(form);
    const payload = {
      account_type: formData.get("account_type"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      password_confirmation: formData.get("password_confirmation"),
    };

    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setToken(response.token);
    AppState.session = response.user;
    setSessionEmail(response.user.email);
    setSessionAccountType(response.user.account_type || payload.account_type || "landlord");

    setStatus(
      status,
      payload.account_type === "tenant"
        ? "Cadastro realizado. Agora voce pode montar seu perfil de inquilino."
        : "Cadastro realizado. Agora voce pode acessar o painel do locador."
    );
    updateSessionUI();
    window.location.href = getLastRoute() || getPostAuthRoute(payload.account_type);
  },
  async profile(form, status) {
    if (!getToken()) {
      setStatus(status, "Faca login antes de criar o perfil.", true);
      return;
    }

    const formData = new FormData(form);
    const tenantPayload = {
      full_name: formData.get("tenantName"),
      cpf: formData.get("cpf"),
      rg: formData.get("rg"),
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      occupation: formData.get("occupation"),
      monthly_income: Number(formData.get("income")),
      address_line: formData.get("addressLine"),
      address_number: formData.get("addressNumber"),
      address_complement: formData.get("addressComplement"),
      address_neighborhood: formData.get("addressNeighborhood"),
      address_city: formData.get("addressCity"),
      address_state: formData.get("addressState"),
      address_postal_code: formData.get("addressPostalCode"),
      notes: formData.get("notes"),
    };

    const tenantResponse = await apiRequest("/tenants", {
      method: "POST",
      body: JSON.stringify(tenantPayload),
    });

    const tenant = tenantResponse.data || tenantResponse;

    const profilePayload = {
      summary_text: "Resumo inicial gerado no cadastro.",
      references_text: formData.get("references"),
      notes: formData.get("notes"),
      score: estimateScore(
        formData.get("income"),
        formData.get("references"),
        formData.get("notes")
      ),
      status: "active",
      consent_at: new Date().toISOString(),
      consent_source: "formulario-web",
    };

    const profile = await apiRequest(`/tenants/${tenant.id}/profile`, {
      method: "POST",
      body: JSON.stringify(profilePayload),
    });

    AppState.profile = { tenant, profile };
    setStatus(status, "Resumo gerado com sucesso.");

    const summary = document.querySelector("[data-summary]");
    if (summary) {
      const summaryText = summary.querySelector(".summary-text");
      summaryText.textContent = buildProfileSummary(tenant, profile);
    }
  },
  async "tenant-edit"(form, status) {
    if (!getToken()) {
      setStatus(status, "Faca login antes de editar o perfil.", true);
      return;
    }

    const tenantId = form?.dataset?.tenantId;
    if (!tenantId) {
      setStatus(status, "Inquilino nao informado.", true);
      return;
    }

    const formData = new FormData(form);
    const tenantPayload = {
      full_name: formData.get("tenantName"),
      cpf: formData.get("cpf"),
      rg: formData.get("rg"),
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      occupation: formData.get("occupation"),
      monthly_income: Number(formData.get("income")),
      address_line: formData.get("addressLine"),
      address_number: formData.get("addressNumber"),
      address_complement: formData.get("addressComplement"),
      address_neighborhood: formData.get("addressNeighborhood"),
      address_city: formData.get("addressCity"),
      address_state: formData.get("addressState"),
      address_postal_code: formData.get("addressPostalCode"),
      notes: formData.get("notes"),
    };

    const tenantResponse = await apiRequest(`/tenants/${tenantId}`,
      {
        method: "PUT",
        body: JSON.stringify(tenantPayload),
      }
    );
    const tenant = tenantResponse.data || tenantResponse;

    const profilePayload = {
      summary_text: "Resumo atualizado no formulario de edicao.",
      references_text: formData.get("references"),
      notes: formData.get("notes"),
      score: estimateScore(
        formData.get("income"),
        formData.get("references"),
        formData.get("notes")
      ),
      status: "active",
      consent_at: new Date().toISOString(),
      consent_source: "formulario-edicao",
    };

    const profileResponse = await apiRequest(`/tenants/${tenantId}/profile`, {
      method: "POST",
      body: JSON.stringify(profilePayload),
    });

    setStatus(status, "Perfil atualizado com sucesso.");

    const summary = document.querySelector("[data-summary]");
    if (summary) {
      const summaryText = summary.querySelector(".summary-text");
      summaryText.textContent = buildProfileSummary(
        tenant,
        profileResponse?.data || profileResponse
      );
    }
  },
  async "landlord-edit"(form, status) {
    if (!getToken()) {
      setStatus(status, "Faca login antes de editar o perfil.", true);
      return;
    }

    const landlordId = form?.dataset?.landlordId;
    if (!landlordId) {
      setStatus(status, "Locador nao informado.", true);
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company_name: formData.get("company_name"),
      notes: formData.get("notes"),
    };

    await apiRequest(`/landlords/${landlordId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );

    setStatus(status, "Perfil do locador atualizado.");
  },
};

const initTenantList = () => {
  const page = document.querySelector('[data-page="tenants"]');
  if (!page) {
    return;
  }

  const searchInput = document.querySelector("[data-tenant-search]");
  const status = document.querySelector("[data-tenant-status]");
  const tbody = document.querySelector("[data-tenant-body]");
  const prevBtn = document.querySelector("[data-tenant-prev]");
  const nextBtn = document.querySelector("[data-tenant-next]");
  const pageLabel = document.querySelector("[data-tenant-page]");
  const sortSelect = document.querySelector("[data-tenant-sort]");

  const state = {
    page: 1,
    perPage: 10,
    search: "",
    sort: sortSelect?.value || "score_desc",
  };

  const renderRows = (items) => {
    if (!tbody) {
      return;
    }

    tbody.innerHTML = "";
    items.forEach((tenant) => {
      const detailLink = `tenant-detail.html?id=${tenant.id}`;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><a class="link" href="${detailLink}">${tenant.full_name}</a></td>
        <td>${tenant.score ?? "-"}</td>
        <td>${tenant.cpf_masked || "-"}</td>
        <td>${tenant.email_masked || "-"}</td>
        <td>${tenant.occupation || "-"}</td>
        <td>${formatIncomeRange(tenant.monthly_income_range)}</td>
        <td>${tenant.status}</td>
      `;
      tbody.appendChild(row);
    });
  };

  const updatePagination = (meta) => {
    const current = meta?.current_page || 1;
    const last = meta?.last_page || 1;

    if (pageLabel) {
      pageLabel.textContent = `Pagina ${current} de ${last}`;
    }

    if (prevBtn) {
      prevBtn.disabled = current <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = current >= last;
    }
  };

  const loadTenants = async () => {
    if (!getToken()) {
      setStatus(status, "Faca login para ver os inquilinos.", true);
      return;
    }

    setStatus(status, "Carregando...");
    const query = new URLSearchParams({
      search: state.search,
      page: state.page,
      per_page: state.perPage,
      sort: state.sort,
    }).toString();

    try {
      const response = await apiRequest(`/tenants?${query}`);
      renderRows(response.data || []);
      updatePagination(response.meta || {});

      if (!response.data || response.data.length === 0) {
        setStatus(status, "Nenhum inquilino encontrado.");
      } else {
        setStatus(status, "Lista atualizada.");
      }
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim();
      state.page = 1;
      loadTenants();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.page = 1;
      loadTenants();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        loadTenants();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      state.page += 1;
      loadTenants();
    });
  }

  loadTenants();
};

const initTenantDetail = () => {
  const page = document.querySelector('[data-page="tenant-detail"]');
  if (!page) {
    return;
  }

  const status = document.querySelector("[data-tenant-detail-status]");
  const header = document.querySelector("[data-tenant-detail-header]");
  const summary = document.querySelector("[data-tenant-detail-summary]");
  const metaList = document.querySelector("[data-tenant-detail-meta]");
  const reviewsList = document.querySelector("[data-tenant-detail-reviews]");
  const reportGrid = document.querySelector("[data-tenant-report]");
  const reviewForm = document.querySelector("[data-review-form]");
  const reviewStatus = document.querySelector("[data-review-status]");
  const reportExport = document.querySelector("[data-report-export]");
  const reportExportCsv = document.querySelector("[data-report-export-csv]");
  const editLink = document.querySelector("[data-tenant-edit-link]");
  const reportState = {
    tenant: null,
    profile: null,
    reviews: [],
  };

  const params = new URLSearchParams(window.location.search);
  const tenantId = params.get("id");

  if (!tenantId) {
    setStatus(status, "Inquilino nao informado.", true);
    return;
  }

  const renderMeta = (tenant, profile) => {
    if (!metaList) {
      return;
    }

    const addressParts = [
      tenant.address_line,
      tenant.address_number,
      tenant.address_complement,
      tenant.address_neighborhood,
      tenant.address_city,
      tenant.address_state,
      tenant.address_postal_code,
    ].filter(Boolean);

    const address = addressParts.length > 0 ? addressParts.join(", ") : "-";

    const items = [
      { label: "Score", value: tenant?.score ?? profile?.score ?? "-" },
      { label: "CPF", value: tenant.cpf_masked || "-" },
      { label: "RG", value: tenant.rg_masked || "-" },
      { label: "Email", value: tenant.email_masked || "-" },
      { label: "Telefone", value: tenant.phone_masked || "-" },
      { label: "Profissao", value: tenant.occupation || "-" },
      { label: "Renda", value: formatIncomeRange(tenant.monthly_income_range) },
      { label: "Endereco", value: address },
      { label: "Status", value: tenant.status || "-" },
    ];

    metaList.innerHTML = items
      .map((item) => `<li><strong>${item.label}:</strong> ${item.value}</li>`)
      .join("");
  };

  const renderReviews = (reviews) => {
    if (!reviewsList) {
      return;
    }

    if (!reviews || reviews.length === 0) {
      reviewsList.innerHTML = "<li>Nenhuma avaliacao cadastrada.</li>";
      return;
    }

    reviewsList.innerHTML = reviews
      .map(
        (review) => `
        <li>
          <div class="review-card">
            <div>
              <strong>Avaliacao geral:</strong> ${review.rating} | <strong>Pagamento:</strong>
              ${review.payment_history}
            </div>
            <div>
              <strong>Tempo de moradia:</strong> ${review.stay_duration_months || "-"} meses |
              <strong>Convivencia:</strong> ${review.neighbor_relations || "-"} |
              <strong>Cuidado do imovel:</strong> ${review.property_care || "-"} |
              <strong>Ruido:</strong> ${review.noise_level || "-"}
            </div>
            <div>${review.comment || "Sem comentarios."}</div>
            <div class="review-meta">
              ${review.landlord_name ? `Locador: ${review.landlord_name}` : ""}
              ${review.created_by_name ? ` · ${review.created_by_name}` : ""}
              ${review.created_by_role ? ` (${review.created_by_role})` : ""}
            </div>
          </div>
        </li>
      `
      )
      .join("");
  };

  const renderReport = (reviews, profile) => {
    if (!reportGrid) {
      return;
    }

    if (!reviews || reviews.length === 0) {
      reportGrid.innerHTML = "<p>Nenhuma avaliacao para gerar relatorio.</p>";
      return;
    }

    const total = reviews.length;
    const avgRating = (
      reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / total
    ).toFixed(1);
    const avgStay = (
      reviews.reduce(
        (sum, review) => sum + (Number(review.stay_duration_months) || 0),
        0
      ) / total
    ).toFixed(1);

    const countBy = (key) =>
      reviews.reduce((acc, review) => {
        const value = review[key] || "na";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

    const payments = countBy("payment_history");
    const neighbors = countBy("neighbor_relations");
    const care = countBy("property_care");
    const noise = countBy("noise_level");
    const rentAgain = countBy("would_rent_again");

    const item = (label, value) => `
      <div class="report-item">
        <span class="report-label">${label}</span>
        <span class="report-value">${value}</span>
      </div>
    `;

    reportGrid.innerHTML = [
      item("Score", reportState.tenant?.score ?? profile?.score ?? "-"),
      item("Avaliacoes", total),
      item("Nota media", avgRating),
      item("Tempo medio", `${avgStay} meses`),
      item(
        "Pagamento",
        `Em dia: ${payments.on_time || 0} | Atraso: ${payments.late || 0} | Inad: ${payments.defaulted || 0}`
      ),
      item(
        "Vizinhos",
        `Boa: ${neighbors.good || 0} | Regular: ${neighbors.average || 0} | Ruim: ${neighbors.bad || 0}`
      ),
      item(
        "Cuidado com imovel",
        `Bom: ${care.good || 0} | Regular: ${care.average || 0} | Ruim: ${care.bad || 0}`
      ),
      item(
        "Nivel de ruido",
        `Baixo: ${noise.low || 0} | Medio: ${noise.medium || 0} | Alto: ${noise.high || 0}`
      ),
      item(
        "Alugaria novamente",
        `Sim: ${rentAgain.yes || 0} | Nao: ${rentAgain.no || 0}`
      ),
    ].join("");
  };

  const buildReportHtml = (tenant, profile, reviews) => {
    const addressParts = [
      tenant.address_line,
      tenant.address_number,
      tenant.address_complement,
      tenant.address_neighborhood,
      tenant.address_city,
      tenant.address_state,
      tenant.address_postal_code,
    ].filter(Boolean);

    const address = addressParts.length > 0 ? addressParts.join(", ") : "-";

    const total = reviews.length;
    const avgRating = total
      ? (
          reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / total
        ).toFixed(1)
      : "0.0";
    const avgStay = total
      ? (
          reviews.reduce(
            (sum, review) => sum + (Number(review.stay_duration_months) || 0),
            0
          ) / total
        ).toFixed(1)
      : "0.0";

    const countBy = (key) =>
      reviews.reduce((acc, review) => {
        const value = review[key] || "na";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

    const payments = countBy("payment_history");
    const neighbors = countBy("neighbor_relations");
    const care = countBy("property_care");
    const noise = countBy("noise_level");
    const rentAgain = countBy("would_rent_again");

    const summary = buildProfileSummary(tenant, profile);
    const reviewsHtml = reviews.length
      ? reviews
          .map(
            (review) => `
            <tr>
              <td>${review.rating}</td>
              <td>${review.payment_history}</td>
              <td>${review.stay_duration_months || "-"}</td>
              <td>${review.neighbor_relations || "-"}</td>
              <td>${review.property_care || "-"}</td>
              <td>${review.noise_level || "-"}</td>
              <td>${review.would_rent_again || "-"}</td>
              <td>${review.comment || "-"}</td>
            </tr>
          `
          )
          .join("")
      : "<tr><td colspan=\"8\">Nenhuma avaliacao registrada.</td></tr>";

    return `
      <html>
        <head>
          <title>Relatorio do Inquilino</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 24px; }
            p { line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f4f4f4; text-align: left; }
            .grid { display: grid; gap: 8px; }
            .item { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>${tenant.full_name}</h1>
          <p>${summary}</p>
          <div class="grid">
            <div class="item"><strong>CPF:</strong> ${tenant.cpf_masked || "-"}</div>
            <div class="item"><strong>RG:</strong> ${tenant.rg_masked || "-"}</div>
            <div class="item"><strong>Email:</strong> ${tenant.email_masked || "-"}</div>
            <div class="item"><strong>Telefone:</strong> ${tenant.phone_masked || "-"}</div>
            <div class="item"><strong>Endereco:</strong> ${address}</div>
          </div>

          <h2>Resumo do historico</h2>
          <div class="grid">
            <div class="item"><strong>Avaliacoes:</strong> ${total}</div>
            <div class="item"><strong>Avaliacao geral (media):</strong> ${avgRating}</div>
            <div class="item"><strong>Tempo medio:</strong> ${avgStay} meses</div>
            <div class="item"><strong>Pagamento:</strong> Em dia ${payments.on_time || 0}, Atraso ${payments.late || 0}, Inad ${payments.defaulted || 0}</div>
            <div class="item"><strong>Vizinhos:</strong> Boa ${neighbors.good || 0}, Regular ${neighbors.average || 0}, Ruim ${neighbors.bad || 0}</div>
            <div class="item"><strong>Cuidado:</strong> Bom ${care.good || 0}, Regular ${care.average || 0}, Ruim ${care.bad || 0}</div>
            <div class="item"><strong>Ruido:</strong> Baixo ${noise.low || 0}, Medio ${noise.medium || 0}, Alto ${noise.high || 0}</div>
            <div class="item"><strong>Alugaria novamente:</strong> Sim ${rentAgain.yes || 0}, Nao ${rentAgain.no || 0}</div>
          </div>

          <h2>Avaliacoes detalhadas</h2>
          <table>
            <thead>
              <tr>
                <th>Avaliacao geral</th>
                <th>Pagamento</th>
                <th>Moradia (meses)</th>
                <th>Vizinhos</th>
                <th>Imovel</th>
                <th>Ruido</th>
                <th>Alugaria?</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              ${reviewsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const buildReportCsv = (tenant, profile, reviews) => {
    const addressParts = [
      tenant.address_line,
      tenant.address_number,
      tenant.address_complement,
      tenant.address_neighborhood,
      tenant.address_city,
      tenant.address_state,
      tenant.address_postal_code,
    ].filter(Boolean);

    const address = addressParts.length > 0 ? addressParts.join(", ") : "-";
    const header = [
      "nome",
      "cpf",
      "rg",
      "email",
      "telefone",
      "profissao",
      "renda_faixa",
      "endereco",
      "nota",
      "pagamento",
      "moradia_meses",
      "vizinhos",
      "imovel",
      "ruido",
      "alugaria_novamente",
      "comentario",
    ];

    const base = [
      tenant.full_name || "",
      tenant.cpf_masked || "",
      tenant.rg_masked || "",
      tenant.email_masked || "",
      tenant.phone_masked || "",
      tenant.occupation || "",
      formatIncomeRange(tenant.monthly_income_range),
      address,
    ];

    const rows = reviews.length
      ? reviews.map((review) => [
          ...base,
          review.rating || "",
          review.payment_history || "",
          review.stay_duration_months || "",
          review.neighbor_relations || "",
          review.property_care || "",
          review.noise_level || "",
          review.would_rent_again || "",
          (review.comment || "").replace(/\r?\n/g, " "),
        ])
      : [[...base, "", "", "", "", "", "", "", ""]];

    const escapeValue = (value) => {
      const text = String(value ?? "");
      if (text.includes("\"") || text.includes(",") || text.includes("\n")) {
        return `"${text.replace(/\"/g, '""')}"`;
      }
      return text;
    };

    const lines = [header, ...rows].map((row) =>
      row.map(escapeValue).join(",")
    );

    return lines.join("\n");
  };

  const loadDetail = async () => {
    if (!getToken()) {
      setStatus(status, "Faca login para ver o perfil.", true);
      return;
    }

    setStatus(status, "Carregando perfil...");

    try {
      const response = await apiRequest(`/tenants/${tenantId}`);
      const tenant = response.data;
      const profile = tenant?.profile;
      const reviews = tenant?.reviews || [];

      reportState.tenant = tenant;
      reportState.profile = profile;
      reportState.reviews = reviews;

      if (header) {
        header.textContent = tenant?.full_name || "Inquilino";
      }
      if (editLink && tenant?.id) {
        editLink.href = `tenant-edit.html?id=${tenant.id}`;
      }
      if (summary) {
        summary.textContent = buildProfileSummary(tenant, profile);
      }

      renderMeta(tenant, profile);
      renderReviews(reviews);
      renderReport(reviews, profile);
      setStatus(status, "Perfil atualizado.");
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  if (reviewForm) {
    reviewForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!getToken()) {
        setStatus(reviewStatus, "Faca login para avaliar.", true);
        return;
      }

      const formData = new FormData(reviewForm);
      const payload = {
        rating: Number(formData.get("rating")),
        payment_history: formData.get("payment_history"),
        stay_duration_months: Number(formData.get("stay_duration_months")),
        neighbor_relations: formData.get("neighbor_relations"),
        property_care: formData.get("property_care"),
        noise_level: formData.get("noise_level"),
        would_rent_again: formData.get("would_rent_again"),
        comment: formData.get("comment"),
        created_by_name: formData.get("created_by_name"),
        created_by_role: formData.get("created_by_role"),
      };

      try {
        await apiRequest(`/tenants/${tenantId}/reviews`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setStatus(reviewStatus, "Avaliacao registrada.");
        reviewForm.reset();
        loadDetail();
      } catch (error) {
        if (error.status === 403) {
          setStatus(
            reviewStatus,
            "Para avaliar, o locador precisa estar cadastrado. Abra Cadastro e conclua o perfil.",
            true
          );
          return;
        }
        setStatus(reviewStatus, error.message, true);
      }
    });
  }

  if (reportExport) {
    reportExport.addEventListener("click", () => {
      if (!reportState.tenant) {
        setStatus(status, "Carregue o perfil antes de exportar.", true);
        return;
      }

      const reportHtml = buildReportHtml(
        reportState.tenant,
        reportState.profile,
        reportState.reviews
      );
      const popup = window.open("", "_blank");
      if (!popup) {
        setStatus(status, "Bloqueio de popup. Permita popups para exportar.", true);
        return;
      }

      popup.document.open();
      popup.document.write(reportHtml);
      popup.document.close();
      popup.focus();
      popup.print();
    });
  }

  if (reportExportCsv) {
    reportExportCsv.addEventListener("click", () => {
      if (!reportState.tenant) {
        setStatus(status, "Carregue o perfil antes de exportar.", true);
        return;
      }

      const csv = buildReportCsv(
        reportState.tenant,
        reportState.profile,
        reportState.reviews
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-inquilino-${reportState.tenant.id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  loadDetail();
};

const initTenantEdit = () => {
  const page = document.querySelector('[data-page="tenant-edit"]');
  if (!page) {
    return;
  }

  const form = document.querySelector('[data-form="tenant-edit"]');
  const status = form?.querySelector("[data-status]");
  const summary = document.querySelector("[data-summary]");

  const params = new URLSearchParams(window.location.search);
  const tenantId = params.get("id");

  if (!tenantId) {
    setStatus(status, "Inquilino nao informado.", true);
    return;
  }

  if (form) {
    form.dataset.tenantId = tenantId;
  }

  const loadTenant = async () => {
    if (!getToken()) {
      setStatus(status, "Faca login para editar o perfil.", true);
      return;
    }

    setStatus(status, "Carregando dados...");

    try {
      const response = await apiRequest(`/tenants/${tenantId}`);
      const tenant = response.data || response;
      const profile = tenant?.profile;

      setFormValue(form, "tenantName", tenant?.full_name);
      setFormValue(form, "cpf", tenant?.cpf);
      setFormValue(form, "rg", tenant?.rg);
      setFormValue(form, "email", tenant?.email);
      setFormValue(form, "phone", tenant?.phone);
      setFormValue(form, "occupation", tenant?.occupation);
      setFormValue(form, "income", tenant?.monthly_income);
      setFormValue(form, "addressLine", tenant?.address_line);
      setFormValue(form, "addressNumber", tenant?.address_number);
      setFormValue(form, "addressComplement", tenant?.address_complement);
      setFormValue(form, "addressNeighborhood", tenant?.address_neighborhood);
      setFormValue(form, "addressCity", tenant?.address_city);
      setFormValue(form, "addressState", tenant?.address_state);
      setFormValue(form, "addressPostalCode", tenant?.address_postal_code);
      setFormValue(form, "references", profile?.references_text);
      setFormValue(form, "notes", profile?.notes ?? tenant?.notes);

      if (summary) {
        const summaryText = summary.querySelector(".summary-text");
        summaryText.textContent = buildProfileSummary(tenant, profile);
      }

      setStatus(status, "Dados carregados.");
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  loadTenant();
};

const initLandlordEdit = () => {
  const page = document.querySelector('[data-page="landlord-edit"]');
  if (!page) {
    return;
  }

  const form = document.querySelector('[data-form="landlord-edit"]');
  const status = form?.querySelector("[data-status]");

  const loadLandlord = async () => {
    if (!getToken()) {
      setStatus(status, "Faca login para editar seu perfil.", true);
      return;
    }

    setStatus(status, "Carregando dados...");

    try {
      const response = await apiRequest("/landlords/me");
      const landlord = response.data || response;

      if (form && landlord?.id) {
        form.dataset.landlordId = landlord.id;
      }

      setFormValue(form, "name", landlord?.name);
      setFormValue(form, "email", landlord?.email);
      setFormValue(form, "phone", landlord?.phone);
      setFormValue(form, "company_name", landlord?.company_name);
      setFormValue(form, "notes", landlord?.notes);

      setStatus(status, "Dados carregados.");
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  loadLandlord();
};

const formatPropertyType = (type) => {
  const labels = {
    kitnet: "Kitnet",
    casa: "Casa",
    apartamento: "Apartamento",
    casa_condominio: "Casa em condominio",
  };

  return labels[type] || type || "-";
};

const formatMoney = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const resolvePropertyImages = (property) => {
  const gallery = Array.isArray(property?.image_urls) ? property.image_urls.filter(Boolean) : [];
  const hero = property?.hero_image_url || gallery[0] || null;
  const images = hero ? [hero, ...gallery.filter((item) => item !== hero)] : gallery;

  return {
    hero,
    images,
  };
};

const initMarketplace = () => {
  const page = document.querySelector('[data-page="marketplace"]');
  if (!page) {
    return;
  }

  const filtersForm = document.querySelector("[data-marketplace-filters]");
  const status = document.querySelector("[data-marketplace-status]");
  const results = document.querySelector("[data-property-results]");
  const googleSearchButton = document.querySelector("[data-google-property-search]");
  const storedProspectPhone = getProspectPhone();

  const collectFilterParams = () => {
    const params = new URLSearchParams();
    const formData = new FormData(filtersForm);

    for (const [key, value] of formData.entries()) {
      if (value !== "") {
        params.append(key, value);
      }
    }

    if (storedProspectPhone) {
      params.append("prospect_phone", storedProspectPhone);
    }

    return params;
  };

  const renderInternalProperties = (items) => {
    if (!results) {
      return;
    }

    if (!items || items.length === 0) {
      results.innerHTML = "<p>Nenhum imovel encontrado com esses filtros.</p>";
      return;
    }

    results.innerHTML = items
      .map(
        (property) => `
          <article class="property-card">
            ${resolvePropertyImages(property).hero ? `<img class="property-card-image" src="${resolvePropertyImages(property).hero}" alt="${property.title}">` : ""}
            <h3>${property.title}</h3>
            <p>${property.city}/${property.state}</p>
            <p class="property-price">${formatMoney(property.rent_price)}/mês</p>
            <div class="property-tags">
              <span>${formatPropertyType(property.property_type)}</span>
              <span>${property.bedrooms} quarto(s)</span>
              <span>${property.has_garage ? "Com garagem" : "Sem garagem"}</span>
              ${property.source_name ? `<span>Fonte: ${property.source_name}</span>` : ""}
            </div>
            <a class="button" href="property-detail.html?id=${property.id}">Ver imóvel</a>
          </article>
        `
      )
      .join("");
  };

  const renderExternalProperties = (items) => {
    if (!results) {
      return;
    }

    if (!items || items.length === 0) {
      results.innerHTML = "<p>Nenhum anuncio externo encontrado com esses filtros.</p>";
      return;
    }

    results.innerHTML = items
      .map(
        (item) => `
          <article class="property-card property-card--external">
            <h3>${item.title}</h3>
            <p>${item.snippet || "Resultado externo encontrado pela busca do Google."}</p>
            <div class="property-tags">
              <span>Fonte externa</span>
              <span>${item.display_link || "google"}</span>
            </div>
            <a class="button" href="${item.link}" target="_blank" rel="noreferrer">Abrir anuncio</a>
          </article>
        `
      )
      .join("");
  };

  const loadInternalProperties = async () => {
    setStatus(status, "Buscando imóveis no cadastro interno...");

    try {
      const params = collectFilterParams();
      const response = await apiRequest(`/properties?${params.toString()}`);
      const items = response.data || [];
      renderInternalProperties(items);
      setStatus(
        status,
        storedProspectPhone
          ? `${items.length} imóvel(is) encontrado(s). Imoveis recusados anteriormente nao voltam a aparecer para este perfil.`
          : `${items.length} imóvel(is) encontrado(s).`
      );
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  const loadGoogleProperties = async () => {
    setStatus(status, "Buscando imóveis com o motor do Google dentro do sistema...");

    try {
      const params = collectFilterParams();
      params.delete("prospect_phone");
      params.append("limit", "10");

      const response = await apiRequest(`/external-search/google?${params.toString()}`);
      const items = response.data || [];
      renderExternalProperties(items);
      setStatus(status, `${items.length} anuncio(s) externo(s) encontrado(s) pelo motor do Google dentro do sistema.`);
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  if (filtersForm) {
    filtersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      loadInternalProperties();
    });
  }

  if (googleSearchButton) {
    googleSearchButton.addEventListener("click", () => {
      loadGoogleProperties();
    });
  }

  loadInternalProperties();
};

const initPropertyDetail = () => {
  const page = document.querySelector('[data-page="property-detail"]');
  if (!page) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("id");

  const title = document.querySelector("[data-property-title]");
  const subtitle = document.querySelector("[data-property-subtitle]");
  const description = document.querySelector("[data-property-description]");
  const meta = document.querySelector("[data-property-meta]");
  const heroImage = document.querySelector("[data-property-hero]");
  const gallery = document.querySelector("[data-property-gallery]");
  const form = document.querySelector("[data-property-interest-form]");
  const phoneInput = document.querySelector("[data-prospect-phone]");
  const questionnaireBox = document.querySelector("[data-questionnaire-box]");
  const questionnaireHint = document.querySelector("[data-questionnaire-hint]");
  const behavioralFields = document.querySelectorAll("[data-behavioral-answer]");
  const status = document.querySelector("[data-interest-status]");
  const paymentCard = document.querySelector("[data-payment-card]");
  const paymentRef = document.querySelector("[data-payment-reference]");
  const pixCopy = document.querySelector("[data-pix-copy]");
  const paymentStatus = document.querySelector("[data-payment-status]");
  const landlordWaLink = document.querySelector("[data-landlord-wa-link]");
  const confirmPaymentBtn = document.querySelector("[data-confirm-payment]");
  const storedProspectPhone = getProspectPhone();

  let currentPaymentReference = null;

  if (!propertyId) {
    setStatus(status, "Imóvel não informado.", true);
    return;
  }

  const formatReviewDate = (value) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleDateString("pt-BR");
  };

  const toggleQuestionnaire = (show, hint = "") => {
    if (!questionnaireBox) {
      return;
    }

    questionnaireBox.classList.toggle("is-hidden", !show);
    behavioralFields.forEach((field) => {
      field.required = show;
    });

    if (questionnaireHint) {
      questionnaireHint.textContent = hint;
    }
  };

  const lookupProfileByPhone = async () => {
    const phone = phoneInput?.value?.trim();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return;
    }

    try {
      const response = await apiRequest(`/prospect-profiles/lookup?phone=${encodeURIComponent(phone)}`);
      if (response.exists) {
        const profile = response.profile || {};
        if (profile.can_refresh_questionnaire) {
          toggleQuestionnaire(
            true,
            "Seu perfil ja pode ser atualizado, porque a ultima revisao passou de 3 meses."
          );
          setStatus(status, "Perfil encontrado. Atualize o questionario se quiser renovar a analise comportamental.");
        } else {
          toggleQuestionnaire(
            false,
            `Perfil salvo e valido ate ${formatReviewDate(profile.review_due_at)}. O questionario sera reaproveitado automaticamente.`
          );
          setStatus(status, "Perfil ja salvo. Nao precisa responder o questionario novamente agora.");
        }
      } else {
        toggleQuestionnaire(true, "Na primeira demonstracao de interesse, responda as 7 perguntas do perfil comportamental.");
      }
    } catch (error) {
      toggleQuestionnaire(true, "Nao foi possivel verificar o perfil salvo. Preencha o questionario para seguir.");
    }
  };

  const loadProperty = async () => {
    setStatus(status, "Carregando imóvel...");
    try {
      const query = storedProspectPhone ? `?prospect_phone=${encodeURIComponent(storedProspectPhone)}` : "";
      const response = await apiRequest(`/properties/${propertyId}${query}`);
      const property = response.data || response;

      if (title) {
        title.textContent = property.title;
      }
      if (subtitle) {
        subtitle.textContent = `${property.city}/${property.state} · ${formatMoney(property.rent_price)}/mês`;
      }
      if (description) {
        description.textContent = property.description || "Sem descrição.";
      }
      const propertyImages = resolvePropertyImages(property);
      if (heroImage) {
        if (propertyImages.hero) {
          heroImage.src = propertyImages.hero;
          heroImage.alt = property.title;
          heroImage.classList.remove("is-hidden");
        } else {
          heroImage.removeAttribute("src");
          heroImage.classList.add("is-hidden");
        }
      }
      if (gallery) {
        gallery.innerHTML = propertyImages.images.length > 1
          ? propertyImages.images
              .map(
                (imageUrl, index) => `
                  <button class="property-gallery-item" type="button" data-gallery-image="${imageUrl}" aria-label="Ver imagem ${index + 1} do imóvel">
                    <img src="${imageUrl}" alt="${property.title} - imagem ${index + 1}">
                  </button>
                `
              )
              .join("")
          : "";

        gallery.querySelectorAll("[data-gallery-image]").forEach((button) => {
          button.addEventListener("click", () => {
            if (!heroImage) {
              return;
            }

            heroImage.src = button.dataset.galleryImage || "";
            heroImage.alt = property.title;
            heroImage.classList.remove("is-hidden");
          });
        });
      }
      if (meta) {
        meta.innerHTML = `
          <li><strong>Tipo:</strong> ${formatPropertyType(property.property_type)}</li>
          <li><strong>Quartos:</strong> ${property.bedrooms}</li>
          <li><strong>Garagem:</strong> ${property.has_garage ? "Sim" : "Não"}</li>
          <li><strong>Bairro:</strong> ${property.address_neighborhood || "-"}</li>
          <li><strong>Origem:</strong> ${property.source_name || "Carteira interna"}</li>
          ${property.source_url ? `<li><strong>Anuncio original:</strong> <a href="${property.source_url}" target="_blank" rel="noreferrer">abrir fonte</a></li>` : ""}
        `;
      }

      setStatus(status, "Pronto para registrar interesse.");
    } catch (error) {
      setStatus(status, error.message, true);
    }
  };

  if (phoneInput) {
    phoneInput.addEventListener("blur", lookupProfileByPhone);
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        tenant_name: formData.get("tenant_name"),
        tenant_phone: formData.get("tenant_phone"),
        tenant_email: formData.get("tenant_email") || null,
        occupation: formData.get("occupation") || null,
        monthly_income: formData.get("monthly_income") || null,
        household_size: formData.get("household_size") || null,
        has_pet: formData.get("has_pet") === "1",
        rental_reason: formData.get("rental_reason") || null,
        additional_notes: formData.get("additional_notes") || null,
        care_reflection: formData.get("care_reflection") || null,
        quiet_refuge: formData.get("quiet_refuge") || null,
        financial_commitment: formData.get("financial_commitment") || null,
        stability_focus: formData.get("stability_focus") || null,
        visitors_sharing: formData.get("visitors_sharing") || null,
        rule_respect: formData.get("rule_respect") || null,
        preventive_maintenance: formData.get("preventive_maintenance") || null,
      };

      try {
        const response = await apiRequest(`/properties/${propertyId}/interests`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const interest = response.interest?.data || response.interest || {};
        currentPaymentReference = interest.payment_reference;
        setProspectPhone(payload.tenant_phone);

        if (paymentRef) {
          paymentRef.textContent = interest.payment_reference || "-";
        }
        if (pixCopy) {
          pixCopy.value = interest.pix_copy_paste || "";
        }
        if (paymentCard) {
          paymentCard.classList.remove("is-hidden");
        }
        if (landlordWaLink && response.landlord_whatsapp_url) {
          landlordWaLink.href = response.landlord_whatsapp_url;
          landlordWaLink.classList.remove("is-hidden");
        }
        if (confirmPaymentBtn) {
          confirmPaymentBtn.classList.remove("is-hidden");
        }

        setStatus(status, response.message || "Interesse enviado com sucesso.");
      } catch (error) {
        setStatus(status, error.message, true);
      }
    });
  }

  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener("click", async () => {
      if (!currentPaymentReference) {
        setStatus(paymentStatus, "Nenhuma referência de pagamento disponível.", true);
        return;
      }

      setStatus(paymentStatus, "Confirmando pagamento...");
      try {
        const response = await apiRequest("/property-interests/confirm-payment", {
          method: "POST",
          body: JSON.stringify({ payment_reference: currentPaymentReference }),
        });
        setStatus(paymentStatus, response.central_message || "Pagamento confirmado.");
      } catch (error) {
        setStatus(paymentStatus, error.message, true);
      }
    });
  }

  if (phoneInput && storedProspectPhone && !phoneInput.value) {
    phoneInput.value = storedProspectPhone;
  }

  toggleQuestionnaire(true, "Na primeira demonstracao de interesse, responda as 7 perguntas do perfil comportamental.");
  loadProperty();
};

const initContractPage = () => {
  const page = document.querySelector('[data-page="contract"]');
  if (!page) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");
  const content = document.getElementById("contract-content");
  const signForm = document.getElementById("contract-sign-form");
  const status = signForm?.querySelector("[data-status]");

  const renderSlip = (slip) => `
    <article class="detail-card">
      <h3>${escapeHtml(slip.description || `Boleto ${slip.installment_number || ""}`)}</h3>
      <p><strong>Vencimento:</strong> ${escapeHtml(new Date(slip.due_date).toLocaleDateString("pt-BR"))}</p>
      <p><strong>Valor:</strong> ${escapeHtml(formatMoney(slip.amount))}</p>
      <p><strong>Status:</strong> ${escapeHtml(slip.status || "pending")}</p>
      ${slip.payment_link ? `<p><a class="button ghost" href="${escapeHtml(slip.payment_link)}" target="_blank" rel="noreferrer">Abrir pagamento</a></p>` : ""}
      ${slip.pdf_url ? `<p><a class="link" href="${escapeHtml(slip.pdf_url)}" target="_blank" rel="noreferrer">Abrir boleto em PDF</a></p>` : ""}
    </article>
  `;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderContract = (contract) => {
    if (!content) {
      return;
    }

    content.innerHTML = "";

    if (!contract) {
      content.innerHTML = "<p>Contrato nao encontrado.</p>";
      if (signForm) {
        signForm.style.display = "none";
      }
      return;
    }

    const slips = contract.payment_slips || [];

    content.innerHTML = `
      <div class="section-stack">
        <div class="metric-strip">
          <div class="metric-box"><strong>${escapeHtml(contract.property?.title || "Imovel")}</strong><span>imovel</span></div>
          <div class="metric-box"><strong>${escapeHtml(contract.tenant?.full_name || "Inquilino")}</strong><span>interessado</span></div>
          <div class="metric-box"><strong>${escapeHtml(contract.status || "draft")}</strong><span>status</span></div>
          <div class="metric-box"><strong>${escapeHtml(formatMoney(contract.rent_amount || 0))}</strong><span>aluguel mensal</span></div>
        </div>
        <div class="detail-card">
          <h2>Resumo do contrato</h2>
          <p><strong>Inicio:</strong> ${escapeHtml(new Date(contract.start_date).toLocaleDateString("pt-BR"))}</p>
          <p><strong>Fim previsto:</strong> ${contract.end_date ? escapeHtml(new Date(contract.end_date).toLocaleDateString("pt-BR")) : "Prazo em aberto"}</p>
          <p><strong>Caucao:</strong> ${escapeHtml(formatMoney(contract.deposit_amount || 0))}</p>
          <p><strong>Seguro incendio:</strong> ${escapeHtml(formatMoney(contract.fire_insurance || 0))}</p>
          <p><strong>Taxa de lixo:</strong> ${escapeHtml(formatMoney(contract.garbage_fee || 0))}</p>
        </div>
        <div class="detail-card">
          <h2>Texto contratual</h2>
          <pre>${escapeHtml(contract.contract_text || "Contrato sem conteudo.")}</pre>
        </div>
        <div class="detail-card">
          <h2>Boletos iniciais</h2>
          ${slips.length ? slips.map(renderSlip).join("") : "<p>Nenhum boleto inicial gerado.</p>"}
        </div>
        ${contract.signed_at ? `
          <div class="callout">
            Contrato assinado em ${escapeHtml(new Date(contract.signed_at).toLocaleString("pt-BR"))} com registro de IP ${escapeHtml(contract.signed_by_ip || "n/d")}.
          </div>
        ` : ""}
      </div>
    `;

    if (signForm) {
      signForm.style.display = contract.status === "draft" ? "" : "none";
    }
  };

  const loadContract = async () => {
    if (!contractId) {
      if (content) {
        content.innerHTML = "<p>Contrato nao informado.</p>";
      }
      setStatus(status, "Contrato nao informado.", true);
      return;
    }

    if (!getToken()) {
      if (content) {
        content.innerHTML = "<p>Faca login para visualizar o contrato.</p>";
      }
      if (signForm) {
        signForm.style.display = "none";
      }
      setStatus(status, "Faca login para acessar o contrato.", true);
      return;
    }

    setStatus(status, "Carregando contrato...");

    try {
      const response = await apiRequest(`/contracts/${contractId}`);
      const contract = response.contract || response.data || response;
      renderContract(contract);
      setStatus(
        status,
        contract?.status === "draft"
          ? "Contrato carregado. Assine quando estiver pronto."
          : "Contrato carregado."
      );
    } catch (error) {
      if (content) {
        content.innerHTML = `<p>${error.message}</p>`;
      }
      if (signForm) {
        signForm.style.display = "none";
      }
      setStatus(status, error.message, true);
    }
  };

  if (signForm) {
    signForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      setStatus(status, "Assinando contrato...");

      try {
        const formData = new FormData(signForm);
        const response = await apiRequest(`/contracts/${contractId}/sign`, {
          method: "POST",
          body: JSON.stringify({ signer_ip: formData.get("signer_ip") }),
        });

        renderContract(response.contract || response.data || response);
        setStatus(status, response.message || "Contrato assinado com sucesso.");
      } catch (error) {
        setStatus(status, error.message, true);
      }
    });
  }

  loadContract();
};

document.addEventListener("DOMContentLoaded", () => {
  trackLastRoute();
  updateSessionUI();
  initSessionActions();
  initTenantList();
  initTenantDetail();
  initTenantEdit();
  initLandlordEdit();
  initMarketplace();
  initPropertyDetail();
  initContractPage();
  const forms = document.querySelectorAll("[data-form]");
  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const key = form.getAttribute("data-form");
      const status = form.querySelector("[data-status]");
      if (!formHandlers[key]) {
        return;
      }
      try {
        await formHandlers[key](form, status);
      } catch (error) {
        if (error.status === 401 || error.status === 419) {
          clearToken();
        }
        setStatus(status, error.message, true);
      }
    });
  });
});
