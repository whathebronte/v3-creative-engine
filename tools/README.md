# tools/

Source code for the React/Vite apps in this monorepo. Each tool builds its output directly into `../../public/<tool-name>/` for Firebase Hosting.

## Tools

| Directory | Stack | Build output | Dev port |
|---|---|---|---|
| `template-stamper/` | React + TypeScript + Vite + Tailwind + Remotion | `public/template-stamper/` | 3000 |
| `shorts-intel-hub/frontend/` | React + TypeScript + Vite + shadcn/ui | `public/shorts-intel-hub/` | 3001 |
| `shorts-brain/` | React + Vite + Tailwind | `public/shorts-brain/` | 3001 |
| `creative-generator-v2/` | React + Vite + Tailwind | `public/creative-generator-v2/` | 3002 |

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
cd tools/creative-generator-v2 && npm run dev
```

## Backend Functions

Edit backend code in `../../functions/src/<tool-name>/`. That's the single deployed source.

The old `tools/template-stamper/functions/` and `tools/shorts-intel-hub/backend/` mirrors were moved to `../archive/backend/` in the April 2026 cleanup — they had diverged and nothing imported from them.
