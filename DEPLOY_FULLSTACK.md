# CabGateway online (frontend + API)

## Visao geral

| Parte | Onde | Exemplo |
|-------|------|---------|
| Frontend | Vercel | `https://vercel-cab-gateway.vercel.app` |
| API | Render | `https://cabgateway-api.onrender.com` |
| MySQL | Railway | host do plugin MySQL |

Login: `admin` / `admin123`

## 1. MySQL (Railway)

1. [railway.app](https://railway.app) → **New Project** → **Provision MySQL**
2. Anote host, porta, usuario, senha e banco.

## 2. API (Render)

1. [render.com](https://render.com) → **New** → **Blueprint**
2. Repo: `BMainig/vercelCabGateway`, branch `Frontend`
3. Preencha no servico `cabgateway-api`:

| Variavel | Valor |
|----------|--------|
| `DB_HOST` | host MySQL |
| `DB_PORT` | `3306` |
| `DB_USER` | usuario |
| `DB_PASSWORD` | senha |
| `DB_NAME` | `cabgateway` |
| `FRONTEND_URL` | URL do site Vercel |
| `DISABLE_IMPORT_SCHEDULER` | `true` |

4. Teste: `https://SUA-API.onrender.com/` → JSON OK
5. (Opcional) Rode `backend/data/seed-pedidos.sql` no MySQL.

## 3. Frontend (Vercel)

**Settings** → **Environment Variables** (Production):

| Nome | Valor |
|------|--------|
| `VITE_API_BASE_URL` | `https://SUA-API.onrender.com` |
| `VITE_USE_AUTH_MOCK` | `false` |

**Redeploy** obrigatorio apos salvar.

## Checklist

- [ ] API responde em `/`
- [ ] Login sem `failed to fetch`
- [ ] Pedidos carregam na Home
- [ ] `FRONTEND_URL` na API = URL exata do Vercel
