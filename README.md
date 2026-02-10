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
2. Navegue pelos links de Login, Cadastro e Perfil do Inquilino.
3. Use Inquilinos para ver a listagem paginada.
3. Inicie o servidor: php artisan serve.

### Observacao de banco

- O banco usa SQLite em database/database.sqlite.
- Sanctum foi instalado para tokens. A tabela personal_access_tokens sera criada nas migracoes.

- Registre um usuario em /api/v1/auth/register.
- Use /api/v1/auth/login para obter o token Bearer.
- Os endpoints protegidos exigem Authorization: Bearer <token>.

### Testes

- Em backend/: php artisan test
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
