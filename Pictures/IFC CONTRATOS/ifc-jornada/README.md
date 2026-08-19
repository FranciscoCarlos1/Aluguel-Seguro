# IFC FISCALIZA

Sistema integrado para fiscalização de contrato de limpeza do IFC, com autenticação, jornada, importação de planilhas, custos, IMR, glosas e medição mensal.

## Funcionalidades

- Autenticação segura com perfis `ADMIN`, `OPERATOR` e `AUDITOR`.
- Cadastro de funcionárias e controle de entradas/saídas.
- Importação de CSV no formato real `NOME`, `DIA`, `ENTRADAS`, `SAÍDAS`.
- Compatibilidade com o layout antigo de controle de acesso.
- Criação automática de funcionárias encontradas na importação.
- Deduplicação de batidas importadas.
- Cálculo de jornada, horas trabalhadas, horas faltantes e glosa.
- Importação nativa da Planilha de Custos `.xlsx`, sem pacote externo de Excel.
- Leitura das abas `RESUMO`, `Custos por posto`, `Cálculo custoM²`, `MAT.UTEN`, `EQU`, `UNI.EPI`, `UTE` e `Locais`.
- Armazenamento da versão integral da planilha importada no PostgreSQL para auditoria.
- Custos por posto, módulos 1 a 6, materiais, equipamentos, uniformes, EPIs, utensílios e produtividade.
- IMR calculado automaticamente pelas ocorrências e respostas dos indicadores.
- Fator de nível de serviço aplicado ao valor contratual.
- Nova avaliação mensal usa automaticamente a última Planilha de Custos importada como base.
- Cada avaliação registra qual snapshot de custos foi usado.
- Relatório PDF e trilha de auditoria.

## Fluxo integrado

```text
Planilha de Custos XLSX
        ↓
Snapshot contratual no PostgreSQL
        ↓
Valor mensal / postos / custos / áreas
        ↓
CSV de jornadas
        ↓
Funcionárias + entradas + saídas
        ↓
Horas trabalhadas e faltantes
        ↓
Glosa de jornada
        ↓
Indicadores IMR + pesquisa de qualidade
        ↓
Pontuação IMR
        ↓
Fator de nível de serviço
        ↓
Valor após IMR
        ↓
Glosas / ajustes
        ↓
Valor final da medição
        ↓
Relatório PDF
```

## Stack

- Next.js 16 / App Router
- TypeScript
- PostgreSQL
- Prisma 7 + adapter PostgreSQL
- Server Actions
- Tailwind CSS 4
- React 19

## Usuários padrão

- Administrador: `admin@ifcfiscaliza.local` / `Admin@12345`
- Operação: `operacao@ifcfiscaliza.local` / `Operacao@12345`

Em produção, altere a senha administrativa.

## Configuração local

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ifc_fiscaliza?schema=public"
AUTH_SECRET="troque-esta-chave-em-producao"
AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@ifcfiscaliza.local"
ADMIN_PASSWORD="Admin@12345"
```

O projeto pode usar um PostgreSQL existente. Docker não é obrigatório.

## Primeiro uso

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000/login`.

Depois de entrar como administrador:

1. Abra **Custos do Contrato**.
2. Importe a planilha `.xlsx` de custos.
3. Abra **Jornadas** e importe o CSV de acessos.
4. Confira as funcionárias e batidas.
5. Abra **Avaliações**.
6. Escolha a competência e gere a avaliação.
7. O sistema calculará jornada, glosa, indicadores, IMR, fator e valor final.
8. Gere o PDF da medição.

## Formato do CSV de jornada

O importador reconhece, inclusive com acentuação:

```text
NOME,DIA,ENTRADAS,SAÍDAS
EVELIN PIRES DO PRADO,03/08/2026,"12:40:03, 15:37:58","15:33:48, 20:34:21"
```

Múltiplas entradas e saídas na mesma data são preservadas como eventos independentes.

## Banco

Após atualizar o código:

```bash
npx prisma generate
npx prisma db push
```

Não use `--force-reset` em uma base com dados de produção.

## Render

O `render.yaml` mantém o deploy com PostgreSQL gerenciado. Configure `AUTH_URL` e uma senha administrativa forte no ambiente de produção.

## Arquitetura

- `src/app`: páginas e APIs.
- `src/actions`: operações server-side.
- `src/lib`: autenticação, banco, cálculo, jornada, custos e leitor XLSX.
- `src/components`: formulários e interface.
- `prisma`: modelo persistente e seed.
