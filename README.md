# Karayeban Frontend

Next.js 16 (App Router) + shadcn/ui. The app is built as a **static export**
(`output: "export"`) and served by nginx.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`NEXT_PUBLIC_API_URL` is baked in at build time (it is a `NEXT_PUBLIC_*` var).
Copy `.env.example` to `.env` for local dev:

```bash
cp .env.example .env
```

## Build

```bash
npm run build      # emits the static site to ./dist
```

## Adding UI components

```bash
npx shadcn@latest add button
```

Components land in `components/ui` and are imported as `@/components/ui/button`.

## Deploy on Coolify

The repo ships a multi-stage [`Dockerfile`](./Dockerfile) that builds the static
export and serves it with `nginxinc/nginx-unprivileged` on port `3000`.

1. Create a new **Dockerfile** (or Docker Compose) resource pointing at this repo.
2. Set the build argument **`NEXT_PUBLIC_API_URL`** and mark it
   *Available at Buildtime* — it must be present during `npm run build`, not just
   at runtime.
3. Expose port `3000`.

Local parity:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com docker compose up --build
```
