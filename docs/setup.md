# Setup do IFC Jornada

## Requisitos

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ ou Docker

## 1. Banco de dados

Opcao com Docker:

```powershell
docker compose up -d
```

Opcao manual:

1. Crie um banco chamado `ifc_jornada`.
2. Garanta um usuario com permissao de leitura e escrita.
3. Ajuste a variavel `DATABASE_URL` antes de iniciar a API.

Validacao confirmada neste ambiente com:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/ifc_jornada
```

Exemplo:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ifc_jornada
```

## 2. Backend

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Fallback local sem PostgreSQL:

```powershell
cd backend
$env:DATABASE_URL='sqlite:///./dev.db'
python -m uvicorn app.main:app --reload
```

API local: `http://127.0.0.1:8000`

## 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend local: `http://127.0.0.1:5173`

## 4. Credenciais iniciais

- Usuario: `admin`
- Senha: `admin123`

Variaveis opcionais:

- `IFC_JORNADA_ADMIN_USERNAME`
- `IFC_JORNADA_ADMIN_PASSWORD`
- `IFC_JORNADA_ADMIN_DISPLAY_NAME`

## 5. Fluxo minimo de validacao

1. Acesse o frontend.
2. Entre com o usuario admin.
3. Confirme o dashboard carregado.
4. Teste a importacao de uma planilha `CSV`, `XLSX` ou `ODS`.
5. Edite uma funcionaria e confira o reflexo no resumo mensal.

## 6. Observacoes

- O seed inicial vindo da planilha publica tolera falha de rede.
- O sistema considera a competencia do dia 1 ao ultimo dia do mes.
- Sabados podem receber compensacao.
- Domingos e outros dias sem expediente sao configuraveis.
- Feriados zeram a carga prevista do dia.
- O backend foi validado neste workspace com PostgreSQL 16 local, login do admin e carregamento do dashboard autenticado.

## 7. Deploy no Render

O arquivo [render.yaml](../render.yaml) prepara o projeto para deploy com PostgreSQL gerenciado e persistente.

Para atender a exigencia de manter os dados sem expiracao automatica, o banco no blueprint fica em plano pago. O banco gratis do Render expira e pode ser removido pela plataforma.

Servicos previstos:

- `ifc-jornada-api`: backend FastAPI
- `ifc-jornada-frontend`: frontend Vue como static site
- `ifc-jornada-db`: banco PostgreSQL gerenciado

Fluxo sugerido:

1. Publique o repositório no GitHub.
2. No Render, escolha New + Blueprint.
3. Selecione o repositório e confirme o uso do [render.yaml](../render.yaml).
4. Informe uma senha forte em `IFC_JORNADA_ADMIN_PASSWORD`.
5. Conclua o deploy e teste `GET /api/health` no backend publicado.

Variaveis relevantes:

- Backend: [backend/.env.example](../backend/.env.example)
- Frontend: [frontend/.env.example](../frontend/.env.example)

Atencao operacional:

- Banco permanente exige plano pago e backup periodico; nao use o banco gratis se a informacao nao puder expirar.
- A fonte oficial configurada com caminho local como `C:/...csv` nao pode ser lida no Render.
- Para sincronizacao automatica em producao, use uma URL publica de CSV/XLSX/ODS acessivel pelo servidor.
