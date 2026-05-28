# Deploy full-stack (API online + Frontend conectado)

Arquitetura final:

- **Frontend** -> Vercel (ja publicado a partir deste repo)
- **API (Node/Express)** -> Render (Web Service gratuito)
- **MySQL** -> provedor gerenciado gratuito (Railway, Aiven, TiDB, etc.)

O codigo ja esta pronto. So faltam acoes que exigem login na sua conta.
Siga na ordem: **1) Banco -> 2) API -> 3) Frontend**.

---

## 1) Banco de dados MySQL gratuito

Escolha **um** provedor. Recomendados:

### Opcao A - Railway (mais simples, sem SSL)
1. Acesse https://railway.app e entre com o GitHub.
2. **New Project** -> **Provision MySQL**.
3. Abra o servico MySQL -> aba **Variables / Connect** e anote:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
4. No Render (passo 2) use:
   - `DB_HOST` = MYSQLHOST
   - `DB_PORT` = MYSQLPORT
   - `DB_USER` = MYSQLUSER
   - `DB_PASSWORD` = MYSQLPASSWORD
   - `DB_NAME` = `cabgateway` (o app cria sozinho; o Railway permite)
   - `DB_SSL` = `false`

### Opcao B - Aiven (gratis permanente, exige SSL)
1. Acesse https://aiven.io -> crie um servico **MySQL** no plano Free.
2. Anote Host, Port, User (`avnadmin`), Password e Database (`defaultdb`).
3. No Render use:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` conforme o painel
   - `DB_NAME` = `defaultdb` (Aiven nao deixa criar outro database)
   - `DB_SSL` = `true`

> O backend tolera bancos que nao permitem criar database: ele apenas usa o
> `DB_NAME` informado e cria as tabelas dentro dele.

---

## 2) API no Render

1. Acesse https://render.com e entre com o GitHub.
2. **New** -> **Blueprint** e selecione o repo `BMainig/vercelCabGateway` (branch `Frontend`).
   - O Render le o `render.yaml` e ja cria o servico `cabgateway-api`.
3. Em **Environment**, preencha as variaveis marcadas (`DB_HOST`, `DB_USER`,
   `DB_PASSWORD`, e ajuste `DB_NAME`/`DB_SSL` conforme o provedor escolhido).
   - Deixe `FRONTEND_URL` em branco por enquanto (preenche no passo 3).
   - `JWT_SECRET` ja e gerado automaticamente.
4. Clique em **Apply / Deploy**. Quando terminar, copie a URL publica, algo como:
   `https://cabgateway-api.onrender.com`
5. Teste no navegador: abrir essa URL deve retornar
   `{"success":true,"message":"CabGateway Backend running"}`.

> Plano free do Render hiberna apos ~15 min sem uso; a 1a chamada depois disso
> pode levar ~50s para "acordar". Normal para teste.

---

## 3) Conectar o Frontend (Vercel)

1. No painel da Vercel, abra o projeto -> **Settings -> Environment Variables**.
2. Configure (Production):
   - `VITE_API_BASE_URL` = URL da API do Render (ex.: `https://cabgateway-api.onrender.com`)
   - `VITE_USE_AUTH_MOCK` = `false`
3. **Redeploy** o projeto (Deployments -> ... -> Redeploy) para aplicar.
4. Copie a URL final da Vercel (ex.: `https://seu-projeto.vercel.app`).

### Liberar o CORS da API para o front
5. Volte ao Render -> servico `cabgateway-api` -> **Environment**:
   - `FRONTEND_URL` = URL da Vercel (pode ter varias separadas por virgula)
6. Salve (o Render redeploya sozinho).

---

## 4) Validar

- Acesse a URL da Vercel.
- Faca login com `admin` / `admin123` (usuario padrao criado pela API).
- Se der erro de login/CORS, confira:
  - `VITE_API_BASE_URL` na Vercel aponta para a API certa (sem `/` no final).
  - `FRONTEND_URL` no Render bate exatamente com a URL da Vercel.
  - As credenciais do banco (`DB_*`) e o `DB_SSL` corretos para o provedor.

## Resumo das variaveis

| Servico | Variavel | Valor |
|---|---|---|
| Render (API) | DB_HOST / DB_PORT / DB_USER / DB_PASSWORD | do provedor MySQL |
| Render (API) | DB_NAME | `cabgateway` (Railway) ou `defaultdb` (Aiven) |
| Render (API) | DB_SSL | `false` (Railway) ou `true` (Aiven/TiDB) |
| Render (API) | FRONTEND_URL | URL da Vercel |
| Vercel (front) | VITE_API_BASE_URL | URL da API no Render |
| Vercel (front) | VITE_USE_AUTH_MOCK | `false` |
