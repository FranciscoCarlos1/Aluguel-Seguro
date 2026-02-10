# Aluguel Seguro

MVP estatico para demonstrar a ideia de avaliacao e perfil de inquilinos.

## Como abrir

1. Abra o arquivo frontend/index.html no navegador.
2. Navegue pelos links de Login, Cadastro e Perfil do Inquilino.

Para integrar com a API, rode o frontend em um servidor local (ex: php -S localhost:5500 -t .) e abra frontend/index.html para evitar origem "null".

## Observacoes

- O frontend agora envia os dados para a API Laravel quando o backend estiver rodando.
- Substitua os textos e regras de negocio conforme necessario.

## Backend (Laravel)

O backend esta em backend/ com API REST para locadores, inquilinos, perfis e avaliacoes.

### Como rodar

1. Garanta que a extensao SQLite do PHP esteja instalada e habilitada.
2. Rode as migracoes: php artisan migrate.
3. Inicie o servidor: php artisan serve.

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
### Endpoints principais

- POST /api/v1/landlords
- GET /api/v1/landlords/{landlord}
- POST /api/v1/tenants
- GET /api/v1/tenants
- GET /api/v1/tenants/{tenant}
- POST /api/v1/tenants/{tenant}/profile
- GET /api/v1/tenants/{tenant}/profile
- POST /api/v1/tenants/{tenant}/reviews
- GET /api/v1/tenants/{tenant}/reviews
