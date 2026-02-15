# Template Stamper

**Professional automation tool for creating vertical video advertisements at scale**

---

## Project Overview

Template Stamper automates the creation of branded vertical video ads by combining consistent branding templates with variable content assets (images and videos). The system enables one-click batch generation to scale video production efficiently.

### Key Features
- 🎬 One-click batch video generation
- 🎨 Consistent branding across all videos
- 📦 Template management system
- 🔄 Integration with YTM Creative Generator via MCP bridge
- ⚡ Fast rendering (1-2 minutes per 17-second video)
- 📊 Job tracking and history

### Target Scale
- **4 markets** supported
- **16 videos per market per month** (64 total videos/month)
- **8 template variations** over the year

---

## Architecture

**Hybrid Serverless Architecture:**
- **Frontend & Backend:** Firebase (Google Cloud)
- **Video Rendering:** Remotion Lambda (AWS)
- **Database:** Firestore
- **Storage:** Firebase Storage

See [Technical Design Document](docs/architecture/technical-design-document.md) for detailed architecture.

---

## Documentation

### Planning Documents
- **[Build Requirements Document](docs/planning/build-requirements-document.md)** - Complete functional and non-functional requirements
- **[Technical Design Document](docs/architecture/technical-design-document.md)** - Detailed system architecture and component design

### Decision Records
- **[Alternative Options Analysis](docs/decisions/alternative-options-analysis.md)** - Evaluation of alternative approaches and why they were not chosen

### Daily Progress
- See `docs/progress/` for daily development logs and discussions (auto-backed up at 10pm daily)

---

## Project Status

**Current Phase:** Planning Complete, Ready for Development

**Timeline:**
- **Phase 1:** Core Infrastructure (Week 1-2)
- **Phase 2:** Template Stamper App (Week 2-3)
- **Phase 3:** First Template (Week 3-4)
- **Phase 4:** YTM Integration (Week 4)

**Total Estimated Time:** 4-5 weeks

---

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS
- Firebase SDK

### Backend
- Firebase Cloud Functions (Node.js 18)
- Express.js
- TypeScript

### Rendering
- Remotion (React-based video framework)
- Remotion Lambda (AWS)
- FFmpeg (bundled)

### Infrastructure
- Firebase Hosting, Functions, Firestore, Storage
- AWS Lambda (Remotion rendering only)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI
- AWS CLI (for Remotion Lambda setup)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/ivanivanho-work/template-stamper.git
cd template-stamper

# Install dependencies (once project is set up)
npm install

# Set up Firebase
firebase login
firebase init

# Set up Remotion Lambda
npx remotion lambda regions enable us-east-1
npx remotion lambda functions deploy
```

### Development

```bash
# Run frontend dev server
npm run dev

# Deploy to Firebase
npm run deploy

# Run tests
npm test
```

---

## Project Structure

```
template-stamper/
├── docs/                          # Documentation
│   ├── planning/                  # Requirements and planning
│   ├── architecture/              # Technical design
│   ├── decisions/                 # Decision records
│   └── progress/                  # Daily logs (auto-generated)
├── src/                           # Frontend source code
│   ├── components/                # React components
│   ├── pages/                     # Page components
│   ├── hooks/                     # Custom hooks
│   └── utils/                     # Utility functions
├── functions/                     # Firebase Cloud Functions
│   ├── src/
│   │   ├── api/                   # API endpoints
│   │   ├── jobs/                  # Job processing
│   │   ├── mcp/                   # MCP bridge
│   │   └── remotion/              # Remotion integration
│   └── package.json
├── templates/                     # Remotion templates
│   └── veo-shorts-v1/            # Example template
│       ├── src/
│       │   ├── compositions/      # Template components
│       │   └── assets/            # Static assets (logos, SVGs)
│       └── package.json
├── firebase.json                  # Firebase configuration
├── .firebaserc                    # Firebase project settings
└── package.json                   # Root dependencies
```

---

## Key Concepts

### Templates
Templates are React/Remotion components that define the structure and branding of videos. They contain:
- **Static branding elements:** Logos, UI mockups, typography
- **Variable content slots:** Positions where user images/videos are inserted
- **Timing and animations:** Sequence of screens and transitions

### Jobs
A job represents a video generation request. It includes:
- Template selection
- Asset mappings (which images/videos go in which slots)
- Status tracking (queued, rendering, completed, failed)
- Output video URL

### MCP Bridge
Model Context Protocol bridge enabling bidirectional communication between Template Stamper and YTM Creative Generator for seamless asset transfer.

---

## API Endpoints

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get template details
- `POST /api/templates/upload` - Upload new template

### Assets
- `POST /api/assets/upload` - Upload assets manually
- `POST /api/assets/mcp-receive` - Receive assets via MCP bridge

### Jobs
- `POST /api/jobs/create` - Create single video job
- `POST /api/jobs/batch-create` - Create batch of jobs
- `GET /api/jobs/:id` - Get job status
- `GET /api/jobs/:id/video` - Download generated video
- `GET /api/jobs/history` - List job history

---

## Development Guidelines

### Code Style
- TypeScript strict mode
- Functional React components
- ESLint + Prettier for formatting
- Comprehensive error handling

### Git Workflow
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Commit Messages
```
type(scope): brief description

Types: feat, fix, docs, refactor, test, chore
```

### Testing
- Unit tests for utilities and hooks
- Integration tests for API endpoints
- E2E tests for critical user flows
- Target: 80% coverage

---

## Costs

**Estimated Monthly Operational Cost: $15**

- Firebase (hosting, functions, storage, DB): ~$5/month
- Remotion Lambda (AWS): ~$10/month
- Cost per video: ~$0.15

---

## Support & Resources

### Documentation
- [Remotion Documentation](https://www.remotion.dev/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)

### Issues
- Report bugs: [GitHub Issues](https://github.com/ivanivanho-work/template-stamper/issues)
- Feature requests: [GitHub Discussions](https://github.com/ivanivanho-work/template-stamper/discussions)

---

## License

[Add license information]

---

## Contributors

[Add contributor information]

---

**Last Updated:** 2026-01-28
