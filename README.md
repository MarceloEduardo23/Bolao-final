# 🏆 Copa Palpite 2026

Bolão da Copa do Mundo 2026 — app mobile-first com Next.js, Neon PostgreSQL e JWT.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind + shadcn/ui |
| Backend | Next.js API Routes (server-side) |
| Banco | Neon PostgreSQL (serverless) |
| Auth | JWT com `jose` + bcrypt |
| Deploy | Vercel |

---

## Setup local (5 minutos)

### 1. Clone e instale

```bash
git clone <repo>
cd copa-palpite
pnpm install   # ou npm install
```

### 2. Crie o banco no Neon

1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita
2. Crie um novo projeto: **"copa-palpite"**
3. Copie a **Connection string** (formato: `postgresql://...`)

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o `.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="gere-um-segredo-forte-aqui"
```

Para gerar o JWT_SECRET:
```bash
openssl rand -base64 32
```

### 4. Popule o banco

```bash
npm run seed
```

Isso vai:
- Criar as tabelas (`users`, `matches`, `predictions`)
- Inserir o admin: `admin@bolao.com` / `admin123`
- Inserir todos os **48 jogos da fase de grupos** da Copa 2026

### 5. Rode

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Deploy na Vercel

1. Faça push para o GitHub
2. Na Vercel, importe o repositório
3. Adicione as variáveis de ambiente:
   - `DATABASE_URL` (a mesma do Neon)
   - `JWT_SECRET` (o mesmo segredo gerado)
4. Deploy!

> O Neon tem plano gratuito generoso — 0.5 GB de storage, perfeito para o bolão com amigos.

---

## Funcionalidades

### Usuários
- ✅ Cadastro e login com e-mail/senha
- ✅ JWT com cookie httpOnly + localStorage
- ✅ Perfil com foto (base64), nome e senha
- ✅ Logout

### Jogos
- ✅ Lista de todos os 48 jogos da fase de grupos (dados reais)
- ✅ Tabs: Hoje / Próximos / Anteriores
- ✅ Bandeiras com flagcdn

### Palpites
- ✅ Palpite por jogo (uma única vez)
- ✅ Bloqueio automático no kickoff
- ✅ Placar exato = 3 pts, vencedor = 1 pt

### Classificação
- ✅ Leaderboard calculado no banco (SQL)
- ✅ Pódio visual (1º, 2º, 3º)
- ✅ Destaque do usuário logado

### Admin
- ✅ Editar resultado e horário de qualquer jogo
- ✅ Marcar jogo como encerrado
- ✅ Listar e deletar usuários

---

## Estrutura das API Routes

```
/api/auth/register   POST  — cadastro
/api/auth/login      POST  — login
/api/auth/logout     POST  — logout
/api/auth/me         GET   — usuário atual

/api/matches         GET   — listar jogos
/api/matches         PATCH — editar jogo (admin)

/api/predictions     GET   — palpites do usuário logado
/api/predictions     POST  — registrar palpite

/api/leaderboard     GET   — classificação geral

/api/users           GET   — listar usuários (admin)
/api/users           PATCH — atualizar perfil próprio
/api/users/[id]      DELETE — deletar usuário (admin)
```

---

## Scripts

```bash
npm run dev      # servidor local
npm run build    # build de produção
npm run seed     # popula o banco com schema + admin + jogos
```
