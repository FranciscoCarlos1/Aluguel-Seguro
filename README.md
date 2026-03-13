# Aluguel Seguro

MVP de plataforma de locacao com busca de imoveis (estilo e-commerce), perfil pontuado de inquilino e intermediação via WhatsApp.

## Como abrir

1. Rode o backend Laravel (passos abaixo).
2. Abra frontend/index.html em servidor local.
3. Aplique filtros de busca e selecione um imovel.
4. Registre interesse no imovel.
5. Na primeira vez, responda o questionario de perfil por probabilidade.
6. Nos proximos interesses, o perfil e reaproveitado automaticamente.

Para integrar com a API, rode o frontend em um servidor local (ex: php -S localhost:5500 -t .) e abra frontend/index.html para evitar origem "null".

## Fluxo implementado

- Filtros: estado (SC), cidade, faixa de valor, quartos, garagem e tipo (kitnet, casa, apartamento, casa em condominio).
- Interesse no imovel: gera mensagem para WhatsApp do locatario com taxa de analise de R$ 5,99.
- Pagamento: retorno com referencia e copia-e-cola PIX.
- Pos-pagamento: mensagem da central com nome, contato e link do perfil do interessado.
- Perfil persistente: salvo no banco e reutilizado para novos interesses sem novo questionario.
- Pontuacao: baseada nas respostas "muito provavel", "provavel", "pouco provavel" e "improvavel".

## Backend (Laravel)

O backend esta em backend/ com API REST para locadores, inquilinos, perfis e avaliacoes.

### Como rodar

1. Garanta que a extensao SQLite do PHP esteja instalada e habilitada.
2. Rode as migracoes: php artisan migrate.
3. Rode o seeder com dados de exemplo: php artisan db:seed.
4. Inicie o servidor: php artisan serve.

### Observacao de banco

- O banco usa SQLite em database/database.sqlite.
- Sanctum foi instalado para tokens. A tabela personal_access_tokens sera criada nas migracoes.

### Autenticacao

- Registre um usuario em /api/v1/auth/register.
- Use /api/v1/auth/login para obter o token Bearer.
- Os endpoints protegidos exigem Authorization: Bearer <token>.

### Testes

- Em backend/: php artisan test

## Publicar no GitHub Pages (frontend)

1. No GitHub, abra Settings > Pages.
2. Em Source, selecione Branch: main e Folder: / (root).
3. Acesse a URL do Pages e abra /frontend/index.html.
4. O arquivo index.html na raiz redireciona automaticamente para /frontend/index.html.

## Backend em producao

- Hospede o backend em um servico que suporte PHP e SQLite (ou banco gerenciado).
- Atualize API_BASE_URL em assets/js/app.js para a URL publica da API.

## Deploy no Render

Este repositório já possui o arquivo render.yaml para subir:

- API Laravel (Web Service): aluguel-seguro-api
- Frontend estático (Static Site): aluguel-seguro-frontend

### Passos

1. No Render, clique em New + > Blueprint.
2. Selecione este repositório e confirme a criação dos 2 serviços.
3. Em aluguel-seguro-api, configure:
	- APP_URL = URL pública da API (ex: https://aluguel-seguro-api.onrender.com)
	- CORS_ALLOWED_ORIGINS = URL do frontend (ex: https://aluguel-seguro-frontend.onrender.com)
4. Em aluguel-seguro-frontend, configure:
	- RENDER_BACKEND_URL = URL pública da API (sem /api/v1)
5. Faça deploy dos dois serviços.

Observação: o backend usa SQLite em disco persistente no Render (/var/data/database.sqlite).
### Endpoints principais

- GET /api/v1/properties
- GET /api/v1/properties/{property}
- POST /api/v1/properties/{property}/interests
- GET /api/v1/prospect-profiles/lookup?phone=...
- GET /api/v1/prospect-profiles/access/{token}
- POST /api/v1/property-interests/confirm-payment
- POST /api/v1/landlords
- GET /api/v1/landlords/{landlord}
- POST /api/v1/tenants
- GET /api/v1/tenants
- GET /api/v1/tenants/{tenant}
- POST /api/v1/tenants/{tenant}/profile
- GET /api/v1/tenants/{tenant}/profile
- POST /api/v1/tenants/{tenant}/reviews
- GET /api/v1/tenants/{tenant}/reviews
