# Karayeban Frontend

Next.js 16 (App Router) + shadcn/ui.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_API_URL` is inlined at build time (`NEXT_PUBLIC_*`). Set the same value in Coolify and mark it *Available at Buildtime*.

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_API_URL` is inlined at image build time. Override it:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com docker compose up --build
```

## Adding UI components

```bash
npx shadcn@latest add button
```

Components land in `components/ui` and are imported as `@/components/ui/button`.

## Deploy on Coolify

Pushes to `test` run [`.github/workflows/deploy-ci.yml`](./.github/workflows/deploy-ci.yml): the Docker image must build, then the Coolify webhook is called. Pull requests run [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (Docker build only).

1. Point a Coolify resource at this repo and the `test` branch.
2. Use **Dockerfile** or **Docker Compose** as the build pack (`docker-compose.yml`).
3. Set **`NEXT_PUBLIC_API_URL`** as a Docker build argument and mark it *Available at Buildtime*.
4. Set GitHub secrets `COOLIFY_TOKEN` and `COOLIFY_WEBHOOK`. Optional: repository variable `NEXT_PUBLIC_API_URL` for CI image builds.
5. Expose port `3000`.
