## Ceifadora - Convocatórias

Este projeto é uma aplicação frontend construída com Vite, React, TypeScript, Tailwind CSS e shadcn-ui.

### Requisitos

- Node.js e npm instalados 

### Como rodar o projeto localmente

```sh
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

### Tecnologias

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

### Build para produção

```sh
npm run build
```

### Deploy (Vercel + Supabase)

Para links de confirmação de email e links públicos funcionarem em produção:

1. Defina no Vercel a variável `VITE_APP_URL` com a URL final do app.
2. No Supabase Auth, configure:
	- `Site URL`: URL final do app (ex.: `https://seu-app.vercel.app`)
	- `Redirect URLs`: inclua `https://seu-app.vercel.app/auth/callback` e `https://seu-app.vercel.app/auth`
3. Garanta que o projeto tenha rewrite de SPA no `vercel.json` para direcionar rotas para `index.html`.
