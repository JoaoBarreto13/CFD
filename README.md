# Ceifadora – Convocatórias

<p align="center">
  <img src="public/ceifadora.jpeg" width="100%" height="200"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/Shadcn_UI-000000?style=for-the-badge"/>
</p>

Aplicação web para organizar convocações de vôlei (treinos e amistosos), controlar confirmações de presença e compartilhar um link público para resposta rápida.

O projeto utiliza **React + Vite** no frontend e **Supabase** como backend (Auth, Postgres e RLS).

---

# Sumário

- Objetivo do sistema
- Funcionalidades
- Fluxo de uso
- Rotas da aplicação
- Stack tecnológica
- Estrutura do projeto
- Modelo de dados
- Pré-requisitos
- Variáveis de ambiente
- Execução local
- Scripts disponíveis
- Banco de dados e migrations
- Deploy
- Comportamentos técnicos relevantes
- Testes recomendados
- Melhorias futuras

---

# Objetivo do sistema

O sistema foi criado para grupos ou times que precisam organizar convocações de forma simples e rápida.

Principais necessidades atendidas:

- Criar convocações com **data, hora, local e número de vagas**
- Compartilhar um **link público para resposta**
- Acompanhar **quem confirmou presença**
- Receber **notificações de confirmação**
- Manter **histórico de eventos passados**

---

# Funcionalidades

## Autenticação

- Login com email e senha
- Cadastro com nome de exibição
- Recuperação de senha por email
- Acesso anônimo (modo convidado)

## Convocatórias

- Criar convocação com:
  - tipo
  - data
  - hora
  - local
  - link do Google Maps
  - número de vagas

- Listar próximas convocações
- Visualizar detalhes da convocação
- Editar ou excluir convocação (apenas o criador)

---

## Confirmação de presença (RSVP)

Participantes podem responder:

- Vou
- Não vou

Características:

- Pode responder logado ou como convidado
- Convidados informam nome para identificação
- Prevenção de respostas duplicadas

---

## Compartilhamento público

Cada evento possui um **token único (`share_token`)**

Formato do link:

```
/e/:token
```

Compartilhamento utiliza:

- Web Share API
- Clipboard fallback

---

## Notificações

- Criador do evento recebe notificações de confirmação
- Notificações são **agregadas por evento**
- Tela de notificações com marcação de itens como lidos

---

## Histórico

Eventos passados aparecem em ordem mais recente primeiro.

Mostra:

- número de confirmados
- número de ausências

---

# Fluxo de uso

1. Entre no app com conta ou como convidado
2. Crie uma convocação na aba **Criar**
3. Compartilhe o link público do evento
4. Participantes respondem no link `/e/:token`
5. Acompanhe respostas na página do evento
6. Após a data, o evento vai para **Histórico**

---

# Rotas da aplicação

| Rota | Descrição |
|-----|-----|
| `/auth` | login, cadastro, recuperação e acesso convidado |
| `/auth/callback` | callback de autenticação |
| `/` | lista de próximos eventos |
| `/criar` | criação de evento |
| `/evento/:id` | detalhe do evento |
| `/historico` | eventos passados |
| `/notificacoes` | central de notificações |
| `/e/:token` | página pública para resposta |

---

# Stack tecnológica

## Frontend

- React 18
- TypeScript
- Vite 5
- React Router
- TanStack React Query
- Tailwind CSS
- shadcn/ui
- Radix UI
- Framer Motion
- date-fns

---

## Backend

- Supabase Auth
- Supabase Postgres
- Row Level Security (RLS)

---

## Qualidade e testes

- ESLint
- Vitest
- Testing Library
- Playwright (configuração básica)

---

# Estrutura do projeto

```
src/
  pages/
  hooks/
  components/
  integrations/
  lib/
supabase/
  migrations/
```

Descrição:

- **pages** → telas da aplicação
- **hooks** → lógica de autenticação e dados
- **components** → componentes reutilizáveis
- **integrations/supabase** → cliente Supabase
- **lib** → utilitários
- **supabase/migrations** → schema SQL e RLS

---

# Modelo de dados (Supabase)

Principais tabelas:

- `events`
- `event_responses`
- `notifications`
- `profiles`

Regras importantes:

- `events.share_token` é único
- respostas exigem identificação (`user_id` ou `guest_name`)
- índice único previne duplicidade
- apenas o dono edita ou exclui eventos
- políticas **RLS** controlam acesso

---

# Pré-requisitos

- Node.js 20+
- npm 10+
- Projeto Supabase configurado

---

# Variáveis de ambiente

Crie um `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_APP_URL=http://localhost:5173
```

Observações:

- `VITE_APP_URL` é opcional em produção
- o app usa `window.location.origin` em produção

---

# Execução local

Instalar dependências:

```
npm install
```

Rodar projeto:

```
npm run dev
```

Abrir:

```
http://localhost:5173
```

---

# Banco de dados e migrations

As migrations estão em:

```
supabase/migrations
```

Para configurar um projeto novo:

1. Criar projeto no Supabase
2. Executar migrations
3. Validar políticas RLS
4. Configurar Auth URLs

---

# Deploy

## Vercel

Variáveis no ambiente:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_APP_URL
```

Configuração no Supabase Auth:

- Site URL → domínio final
- Redirect URLs
  - `/auth/callback`
  - `/auth`

Validar:

- login
- criação de evento
- link público `/e/:token`
- navegação direta

---

# Comportamentos técnicos relevantes

- Colunas `DATE` tratadas localmente para evitar erro de timezone
- Links públicos usam domínio atual em produção
- Notificações são agregadas por evento

---
