# Aluguel Seguro

MVP de plataforma de locacao com busca de imoveis, match entre inquilinos e locatarios, perfil comportamental e intermediação via WhatsApp.

## Como abrir

1. Rode o backend Laravel (passos abaixo).
2. Abra frontend/index.html em servidor local.
3. Aplique filtros de busca e selecione um imovel.
4. Registre interesse no imovel.
5. Na primeira vez, responda o questionario de perfil comportamental com 7 perguntas.
6. Nos proximos interesses, o perfil e reaproveitado automaticamente e pode ser atualizado a cada 3 meses.

Para integrar com a API, rode o frontend em um servidor local (ex: php -S localhost:5500 -t .) e abra frontend/index.html para evitar origem "null".

## Fluxo implementado

- Filtros: estado (SC), cidade, faixa de valor, quartos, garagem e tipo (kitnet, casa, apartamento, casa em condominio).
- Interesse no imovel: gera mensagem para WhatsApp do locatario com taxa de analise de R$ 4,99.
- Pagamento: retorno com referencia e copia-e-cola PIX.
- Pos-pagamento: mensagem da central com nome, contato e link do perfil do interessado.
- Perfil persistente: salvo no banco, reutilizado para novos interesses e elegivel para atualizacao a cada 3 meses.
- Pontuacao: baseada em 7 respostas de perfil comportamental com foco em cuidado com o imovel, ruido, regras, manutencao, estabilidade e risco de inadimplencia.
- Rejeicao do locador: quando o perfil e marcado como nao apropriado, o imovel deixa de aparecer para aquele interessado nas proximas buscas.
- Importacao externa: o backend aceita importacao de imoveis por feed JSON/XML autorizado para abastecer o marketplace sem scraping.
- Busca externa embutida: o marketplace pode consultar o motor do Google por API oficial e mostrar os anuncios dentro do proprio sistema.

## Importacao de imoveis por fonte autorizada

O sistema agora suporta importacao por feed oficial/autorizado em JSON ou XML.

Endpoint protegido do locador:

- POST /api/v1/landlord/properties/import-feed

Payload exemplo:

```json
{
	"feed_url": "https://parceiro.exemplo/imoveis.json",
	"source_name": "olx_parceiro",
	"format": "json",
	"max_items": 50
}
```

Campos normalizados automaticamente quando presentes no feed: titulo, cidade, estado, preco/aluguel, quartos, garagem, tipo, descricao, bairro, link do anuncio e imagens.

## Integracao oficial OLX

O backend tambem ficou preparado para a integracao oficial da OLX via OAuth e API de anuncios.

Rotas autenticadas do locador:

- GET /api/v1/integrations/olx/auth-url?redirect_uri=...
- POST /api/v1/integrations/olx/exchange-token
- POST /api/v1/integrations/olx/import-properties
- GET /api/v1/integrations/olx/published-ads?access_token=...

Configuracao necessaria no ambiente:

- OLX_CLIENT_ID
- OLX_CLIENT_SECRET
- OLX_AUTH_BASE_URL
- OLX_APPS_BASE_URL

Observacao: a documentacao oficial consultada mostra suporte a OAuth, importacao de anuncios para a OLX e listagem/status de anuncios publicados. Para trazer anuncios completos da OLX para dentro do Aluguel Seguro ainda e necessario ter acesso a um endpoint oficial que retorne os detalhes completos do anuncio, e nao apenas id/status.

## Busca externa com Google dentro do sistema

O marketplace pode usar a Google Custom Search JSON API no backend para buscar anuncios externos e renderizar os resultados dentro da interface do Aluguel Seguro.

Rota publica:

- GET /api/v1/external-search/google

Filtros aceitos:

- state
- city
- price_range
- bedrooms
- garage
- property_type
- limit

Configuracao necessaria no ambiente:

- GOOGLE_SEARCH_API_KEY
- GOOGLE_SEARCH_ENGINE_ID
- GOOGLE_SEARCH_BASE_URL
- GOOGLE_SEARCH_SITE_QUERY

Sem essas credenciais, a API responde com erro controlado informando que a busca externa ainda nao foi configurada.

## Backend (Laravel)

O backend esta em backend/ com API REST para locadores, inquilinos, perfis e avaliacoes.

### Como rodar

1. Garanta que a extensao do banco escolhido esteja instalada e habilitada no PHP.
2. Rode as migracoes: php artisan migrate.
3. Rode o seeder com dados de exemplo: php artisan db:seed.
4. Inicie o servidor: php artisan serve.

### Observacao de banco

- Em desenvolvimento voce pode usar SQLite ou Postgres, conforme as variaveis do arquivo backend/.env.
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
- Frontend estático (Static Site): aluguel-seguro
- Postgres gerenciado: aluguel-seguro-db

### O que fica automático

- O Blueprint cria uma instancia Render Postgres para a API.
- O backend roda php artisan migrate --force a cada novo deploy.
- O backend preserva os imoveis cadastrados e so recompõe o catalogo demo quando a tabela properties estiver vazia.
- O frontend gera frontend/env.js em build com a URL pública da API e copia os assets compartilhados para a pasta publicada.
- O health check da API responde em /api/health.

### Passos

1. No Render, clique em New + > Blueprint.
2. Selecione este repositório e confirme a criação dos 3 recursos.
3. Em aluguel-seguro-api, configure:
	- APP_KEY = gere uma chave única com php artisan key:generate --show
	- APP_URL = URL pública da API (ex: https://aluguel-seguro-api.onrender.com)
	- CORS_ALLOWED_ORIGINS = URL do frontend (ex: https://aluguel-seguro.onrender.com)
	- GOOGLE_SEARCH_API_KEY = chave da Google Custom Search JSON API
	- GOOGLE_SEARCH_ENGINE_ID = identificador do mecanismo de busca programável
	- GOOGLE_SEARCH_SITE_QUERY = opcional, para limitar domínios como OLX, VivaReal e Zap
4. Em aluguel-seguro, configure:
	- RENDER_BACKEND_URL = URL pública da API (sem /api/v1)
5. Faça deploy dos serviços.
6. Se quiser forcar a reposicao segura do catalogo demo no shell do Render, rode:
	- php artisan catalog:ensure-demo

Observacao: o banco Render sera criado com nome aluguel_seguro e usuario admin. A senha do Postgres gerenciado nao pode ser fixada no Blueprint; o Render gera essa senha automaticamente e a injeta no servico da API. O backend nao executa db:seed automaticamente no boot. Em vez disso, ele garante apenas o catalogo demo quando a tabela de imoveis estiver vazia, sem apagar anuncios ja cadastrados.

Se você criar um Web Service Docker manual no Render apontando para a raiz do repositório, o Dockerfile da raiz já encaminha corretamente para backend/.
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
