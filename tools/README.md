# tools/

Source code for the React/Vite apps in this monorepo. Each tool builds its output directly into `../../public/<tool-name>/` for Firebase Hosting.

## Tools

| Directory | Stack | Build output | Dev port |
|---|---|---|---|
| `template-stamper/` | React + TypeScript + Vite + Tailwind + Remotion | `public/template-stamper/` | 3000 |
| `shorts-intel-hub/` | React + TypeScript + Vite + shadcn/ui | `public/shorts-intel-hub/` | 3001 |
| `shorts-brain/` | React + Vite + Tailwind | `public/shorts-brain/` | 3001 |

## Building

```bash
# Build all React apps
cd tools/template-stamper && npm run build
cd tools/shorts-intel-hub/frontend && npm run build
cd tools/shorts-brain && npm run build
```

## Local Dev

```bash
cd tools/template-stamper && npm run dev
cd tools/shorts-intel-hub/frontend && npm run dev
cd tools/shorts-brain && npm run dev
```

## Backend Functions

Template Stamper and Shorts Intel Hub each have a `functions/` or `backend/functions/` subdirectory with the original function source. These are **manually synced copies** of what lives in `../../functions/src/<tool-name>/`.

- **Canonical deployed source:** `../../functions/src/<tool-name>/`
- **Tools source:** kept for reference / history, but may lag behind

Always apply backend fixes to `../../functions/src/<tool-name>/` first.

## Stale Directory

`tools/public/` — leftover build output from when `shorts-intel-hub/frontend/vite.config.ts` pointed to the wrong output directory. The config was fixed; this directory is safe to delete.
