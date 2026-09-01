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

## Adding UI components

```bash
npx shadcn@latest add button
```

Components land in `components/ui` and are imported as `@/components/ui/button`.

## Deploy on Coolify

Pushes to `test` trigger [`.github/workflows/deploy-ci.yml`](./.github/workflows/deploy-ci.yml), which calls the Coolify webhook.

1. Point a Coolify resource at this repo and the `test` branch.
2. Set **`NEXT_PUBLIC_API_URL`** and mark it *Available at Buildtime*.
3. Set GitHub secrets `COOLIFY_TOKEN` and `COOLIFY_WEBHOOK`.
4. Expose the port Coolify uses for `next start` (usually `3000`).
