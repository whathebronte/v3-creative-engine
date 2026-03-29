# public/

Firebase Hosting root. Everything here is deployed as static files to `v3-creative-engine.web.app`.

**Do not edit built files directly.** The React apps in this directory are build outputs — edit their source in `tools/` and rebuild.

## Contents

| Directory | Type | Edit where? |
|---|---|---|
| `hub.html` | Vanilla HTML — the hub/landing page | Edit directly |
| `creative-generator/` | Vanilla HTML/CSS/JS app | Edit directly |
| `agent-collective/` | Single-file vanilla HTML app | Edit directly |
| `shorts-brain/` | React build output | Edit in `../../tools/shorts-brain/` then `npm run build` |
| `shorts-intel-hub/` | React/TypeScript build output | Edit in `../../tools/shorts-intel-hub/frontend/` then `npm run build` |
| `template-stamper/` | React/TypeScript build output | Edit in `../../tools/template-stamper/` then `npm run build` |

## Deploy

```bash
firebase deploy --only hosting
```
