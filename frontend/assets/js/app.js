document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('[data-marketplace-filters]');
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'property-results';
  form.parentNode.appendChild(resultsContainer);

  async function fetchProperties(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/v1/properties?${params}`);
    if (!res.ok) {
      resultsContainer.innerHTML = '<p class="error">Erro ao buscar imóveis.</p>';
      return;
    }
    const data = await res.json();
    renderProperties(data.data || []);
  }

  function renderProperties(properties) {
    if (!properties.length) {
      resultsContainer.innerHTML = '<p>Nenhum imóvel encontrado.</p>';
      return;
    }
    resultsContainer.innerHTML = properties.map(property => `
      <div class="property-card">
        <h2>${property.title}</h2>
        <p><strong>Cidade:</strong> ${property.city}</p>
        <p><strong>Valor:</strong> R$ ${Number(property.rent_price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
        <p><strong>Quartos:</strong> ${property.bedrooms}</p>
        <a href="property-detail.html?id=${property.id}" class="button">Ver detalhes</a>
      </div>
    `).join('');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const filters = {};
    for (const [key, value] of formData.entries()) {
      if (value) filters[key] = value;
    }
    fetchProperties(filters);
  });

  // Busca inicial
  fetchProperties();

  // Cadastro de locador
  if (document.querySelector('[data-form="register"]')) {
    const registerForm = document.querySelector('[data-form="register"]');
    const status = registerForm.querySelector('[data-status]');
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      status.textContent = 'Enviando...';
      const formData = new FormData(registerForm);
      const payload = Object.fromEntries(formData.entries());
      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          status.textContent = 'Cadastro realizado com sucesso!';
          registerForm.reset();
        } else {
          status.textContent = data.message || 'Erro ao cadastrar.';
        }
      } catch (err) {
        status.textContent = 'Erro de conexão.';
      }
    });
  }
});
