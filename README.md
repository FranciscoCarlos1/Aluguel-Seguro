# IFC Jornada

Sistema web para controle mensal de jornada com fechamento do dia 1 ao ultimo dia do mes, cadastro de funcionarias, regras de expediente, feriados e importacao de planilhas.

## Funcionalidades atuais

- Login com perfis `admin` e `operator`
- Cadastro, edicao e inativacao de funcionarias
- Jornada diaria padrao por funcionaria
- Controle diario de entrada, saida, almoco e observacoes
- Configuracao de dias sem expediente
- Cadastro de feriados
- Importacao de arquivos `CSV`, `XLSX` e `ODS`
- Dashboard e resumo mensal

## Estrutura

- `backend`: API FastAPI + SQLAlchemy
- `frontend`: interface Vue 3 + Vite
- `docker-compose.yml`: PostgreSQL local para desenvolvimento

## Banco de dados

O projeto usa PostgreSQL como padrao.

Exemplo de `DATABASE_URL`:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ifc_jornada
```

Se voce estiver sem PostgreSQL no momento, pode iniciar a API em fallback com SQLite apenas para desenvolvimento local:

```powershell
$env:DATABASE_URL='sqlite:///./dev.db'
python -m uvicorn app.main:app --reload
```

## Subir PostgreSQL

Se tiver Docker instalado:

```powershell
docker compose up -d
```

Se ja existir um PostgreSQL local rodando, basta criar o banco `ifc_jornada` e usar a `DATABASE_URL` do arquivo [backend/.env.example](backend/.env.example).

## Rodar backend

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Rodar frontend

```powershell
cd frontend
npm install
npm run dev
```

Para apontar o frontend para outra API:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Credenciais iniciais

- Usuario: `admin`
- Senha: `admin123`

Esses valores podem ser alterados por variavel de ambiente:

- `IFC_JORNADA_ADMIN_USERNAME`
- `IFC_JORNADA_ADMIN_PASSWORD`
- `IFC_JORNADA_ADMIN_DISPLAY_NAME`

## Regras de negocio atuais

- A competencia vai do dia 1 ao ultimo dia do mes
- Sabado pode ser usado para compensacao
- Domingo pode ser marcado como nao expediente
- Feriados zeram a carga prevista do dia
- Horas lancadas em dias sem expediente continuam sendo contabilizadas no saldo

## Fechamento automatico mensal

O backend agora executa a virada mensal automaticamente:

- Fecha periodos anteriores ao mes atual com status `closed`
- Mantem o mes atual com status `open`
- Prepara o mes seguinte com status `planned`
- Gera automaticamente a estrutura de lancamentos para funcionarias ativas no mes atual e no proximo mes
- Nao apaga historico de meses anteriores

Endpoints administrativos:

- `GET /api/rollover/monthly`: consulta e garante o estado atualizado da virada mensal
- `POST /api/rollover/monthly`: forca a execucao da virada mensal sob demanda

## Importacao de planilhas

O importador aceita arquivos com coluna `Data` e blocos por funcionaria, como:

- nome da funcionaria na linha superior
- colunas `Entrada` e `Saida`
- opcionalmente quatro colunas para entrada, saida almoco, retorno almoco e saida final

Formatos suportados:

- `.csv`
- `.xlsx`
- `.ods`

## Status de validacao

- Backend validado com PostgreSQL local real, autenticacao, dashboard, edicao de funcionaria e importacao de `XLSX` e `ODS`
- Frontend validado com `npm run build`

## Deploy no Render com banco persistente

O repositório agora inclui [render.yaml](render.yaml) para subir:

- um web service do backend FastAPI
- um static site do frontend Vue
- um banco PostgreSQL gerenciado pelo Render

Esse PostgreSQL do Render e persistente, entao os dados nao sao apagados a cada deploy.

Passos:

1. Envie este repositório para o GitHub.
2. No Render, crie um Blueprint a partir do repositório.
3. O arquivo [render.yaml](render.yaml) criara o backend, o frontend e o banco `ifc_jornada`.
4. Defina manualmente um valor forte para `IFC_JORNADA_ADMIN_PASSWORD` no serviço `ifc-jornada-api`.
5. Apos o primeiro deploy, acesse o frontend publicado e entre com o usuario admin.

Observacoes importantes para producao:

- A URL da API no frontend vem de `VITE_API_BASE_URL`.
- O backend aceita origens CORS pela variavel `CORS_ALLOWED_ORIGINS`.
- A configuracao atual da fonte oficial usando caminho local do Windows nao funciona no Render. Em producao, use uma URL publica acessivel ou importacao manual pela interface.
