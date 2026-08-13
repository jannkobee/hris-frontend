# base

## Project setup

```
# yarn
yarn

# npm
npm install

# pnpm
pnpm install

# bun
bun install
```

### Compiles and hot-reloads for development

```
# yarn
yarn dev

# npm
npm run dev

# pnpm
pnpm dev

# bun
pnpm run dev
```

### Compiles and minifies for production

```
# yarn
yarn build

# npm
npm run build

# pnpm
pnpm build

# bun
pnpm run build
```

### Lints and fixes files

```
# yarn
yarn lint

# npm
npm run lint

# pnpm
pnpm lint

# bun
pnpm run lint
```

### Customize configuration

See [Configuration Reference](https://vitejs.dev/config/).

## Environment

Copy `.env.example` to `.env` when running the frontend directly. `VITE_API_URL` controls the backend API endpoint used by the compiled application.

```env
VITE_API_URL=http://localhost:8000/backend/api/v1
```

## Docker

The complete application stack is defined in `../hris-backend/docker-compose.yml`. From the backend directory, run:

```bash
docker compose up --build -d
```

The frontend Docker image runs the production build and serves it through Nginx at `http://localhost:3000`. Client-side routes fall back to `index.html`, so refreshing routes such as `/workplace-hub` works correctly.

## Workplace Hub

The Workplace Hub page provides room reservations, recurring and daily meetings, attendees, agendas, minutes, decisions, private attachments, and action-item tracking. Its navigation and actions follow the Workplace Hub permissions returned by the backend.
