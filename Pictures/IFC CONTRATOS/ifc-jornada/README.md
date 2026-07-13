# IFC FISCALIZA

Sistema completo para controle de usuários e registro de horários de entrada e saída, construído para o cenário do IFC com foco em arquitetura robusta, segurança e operação simples.

## Stack

- Next.js 16 com App Router
- TypeScript
- PostgreSQL
- Prisma 7 com adapter PostgreSQL oficial
- Server Actions para mutações seguras
- Sessão própria com cookie HTTP-only e armazenamento em banco
- Tailwind CSS 4

## Escopo funcional

- Autenticação com sessão segura
- Controle de usuários com perfis `ADMIN`, `OPERATOR` e `AUDITOR`
- Cadastro de funcionárias
- Registro de batidas considerando somente entrada e saída
- Dashboard com visão operacional
- Trilha de auditoria para eventos principais
- Seed inicial com funcionárias e usuários padrão

## Arquitetura

### Camadas principais

- `src/app`: páginas, layouts e route handlers
- `src/actions`: mutações server-side com validação e autorização
- `src/lib`: autenticação, banco, constantes e utilidades
- `src/components`: componentes de interface e formulários
- `prisma`: schema, configuração e seed

### Segurança aplicada

- Cookies de sessão `HTTP-only`
- Hash de senha com `bcryptjs`
- Token de sessão persistido em banco com hash SHA-256
- Middleware de proteção para rotas privadas
- Headers de endurecimento no `next.config.ts`
- Auditoria para login, criação de usuário, cadastro de funcionária e lançamento de batidas

## Usuários semeados

- Administrador
	- E-mail: `admin@ifcfiscaliza.local`
	- Senha: `Admin@12345`
- Operação
	- E-mail: `operacao@ifcfiscaliza.local`
	- Senha: `Operacao@12345`

## Funcionárias pré-cadastradas

- Alana
- Keise
- Luciana
- Viviane
- Zenaide
- Marineida
- Ivonete

## Configuração local

O projeto já contém um `.env` local para desenvolvimento. Se precisar ajustar, use também `.env.example` como referência.

### Variáveis principais

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ifc_fiscaliza?schema=public"
AUTH_SECRET="troque-esta-chave-em-producao"
AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@ifcfiscaliza.local"
ADMIN_PASSWORD="Admin@12345"
```

## Banco de dados

Existe um `docker-compose.yml` pronto para PostgreSQL local. Se Docker estiver disponível na máquina:

```bash
docker compose up -d
npm run db:push
npm run db:seed
```

Se preferir usar um PostgreSQL já existente, ajuste apenas a `DATABASE_URL`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:push
npm run db:seed
npm run db:studio
```

## Execução

Depois do banco estar disponível e do schema aplicado:

```bash
npm run dev
```

Acesse:

- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/api/health`

## Deploy no Render

O projeto agora inclui o blueprint [render.yaml](render.yaml) para publicação no Render com PostgreSQL gerenciado.

### O que o blueprint faz

- cria um serviço web Node.js
- cria um banco PostgreSQL no Render
- executa `npm run db:push` e `npm run db:seed` antes do deploy
- usa `/api/health` como health check

### Variáveis que você ainda precisa conferir no Render

- `AUTH_URL`: defina com a URL pública final do serviço, por exemplo `https://ifc-fiscaliza.onrender.com`
- `ADMIN_PASSWORD`: defina uma senha forte para o administrador inicial

### Publicação

1. Suba este projeto para um repositório Git.
2. No Render, escolha New + e depois Blueprint.
3. Aponte para o repositório que contém este projeto.
4. Revise as variáveis `AUTH_URL` e `ADMIN_PASSWORD` antes de concluir.

## Observações operacionais

- O sistema modela cada batida como um evento individual.
- Há suporte a múltiplas entradas e saídas na mesma data.
- O seed importa exemplos iniciais de jornadas com base no material fornecido.
- O sistema não calcula folha, custos ou jornada contratual: o foco é o controle dos horários de entrada e saída.
