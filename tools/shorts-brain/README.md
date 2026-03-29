# Shorts Brain

React + Vite app for campaign performance memory — weekly snapshots of campaign data persisted to Firestore.

**Live:** https://v3-creative-engine.web.app/shorts-brain/

## Stack

- React (JSX)
- Vite
- Tailwind CSS
- Firebase (Firestore for snapshots)

## Development

```bash
npm install
npm run dev      # Dev server at http://localhost:3001
```

## Build

```bash
npm run build    # Output → ../../public/shorts-brain/
```

Then deploy:
```bash
cd ../.. && firebase deploy --only hosting
```

## Backend Functions

Cloud Functions for snapshot persistence are in `../../functions/src/shorts-brain/memory.js`:
- `sbSaveSnapshot` — save a weekly campaign snapshot
- `sbLoadSnapshots` — load historical snapshots
- `sbDeleteSnapshot` — delete a snapshot

## Key Files

| File | Purpose |
|---|---|
| `src/App.jsx` | Main application component |
| `src/firebase.js` | Firebase client config |
| `vite.config.js` | Build config (output: `../../public/shorts-brain/`) |
