# Cloud Functions Structure

This directory contains all Cloud Functions for the V3 Creative Engine ecosystem.

## Directory Structure

```
functions/src/
├── index.js                          # Main entry point - exports all functions
├── creative-generator/               # YTM Creative Generator functions
├── agent-collective/                 # YTM Agent Collective functions
├── template-stamper/                 # Template Stamper functions
├── shorts-intel-hub/                 # Shorts Intel Hub functions
├── shorts-brain/                     # Shorts Brain functions
├── campaign-learnings/               # Campaign Learnings functions (future)
├── shared/                           # Shared utilities across tools
└── general-context/                  # General context and shared helpers
```

## Tool-Specific Functions

### Creative Generator
- `processJob` - Firestore trigger for job processing
- `createTestJob` - HTTP callable for test job creation
- `regenerateJob` - HTTP callable for job regeneration
- `upscaleJob` - HTTP callable for image upscaling
- `imageToVideoJob` - HTTP callable for image-to-video conversion
- `expandImageJob` - HTTP callable for image expansion
- `iterateJob` - HTTP callable for creating variations
- `importPrompt` - HTTP endpoint for MCP bridge
- `callGeminiAgent` - HTTP callable for Gemini API
- `pollVideoOperations` - PubSub trigger for video operation polling
- `downloadAsset` - HTTP endpoint for asset downloading

### Shorts Intel Hub
- `shortsIntelApi` - Express API for weekly topics
- `shortsIntelWeeklyRefresh` - Scheduled job for refreshing data

### Template Stamper
- `tsGetTemplates` - Get all templates
- `tsGetTemplate` - Get single template
- `tsCreateJob` - Create rendering job
- `tsGetJob` - Get job status
- `tsGetJobHistory` - Get job history
- `tsReceiveAssets` - MCP bridge for receiving assets
- `tsPreprocessAsset` - Preprocess assets before rendering
- `tsTriggerRemotionRender` - Firestore trigger for rendering

## General Context
- `gemini.js` - Shared Gemini API helper functions

## Notes
- Functions prefixed with `ts` are Template Stamper functions to avoid naming conflicts
- ES Module functions use wrapper files (e.g., `shorts-intel-hub-wrapper.js`, `template-stamper-wrapper.js`)
