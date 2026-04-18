# V3 Creative Engine - Documentation Index

All documentation is organized into subdirectories by topic. Start with the files marked **[START HERE]**.

---

## Quick Navigation

| If you want to... | Go to |
|---|---|
| Understand the project | [README.md](../README.md) **[START HERE]** |
| Onboard a new Claude session | [CLAUDE.md](../CLAUDE.md) **[START HERE]** |
| Understand system architecture | [architecture/TECHNICAL_DESIGN_DOCUMENT.md](architecture/TECHNICAL_DESIGN_DOCUMENT.md) |
| Set up Vertex AI | [guides/VERTEX_AI_SETUP.md](guides/VERTEX_AI_SETUP.md) |
| Review security posture | [security/SECURITY_AUDIT_REPORT.md](security/SECURITY_AUDIT_REPORT.md) |
| Understand the migration history | [migration/MIGRATION_SUMMARY.md](migration/MIGRATION_SUMMARY.md) |
| Revamp Agent Collective | [architecture/AGENT_COLLECTIVE_REVAMP.md](architecture/AGENT_COLLECTIVE_REVAMP.md) |

---

## Directory Structure

```
docs/
├── README.md                          # This file
├── architecture/                      # System design & technical specs
│   ├── TECHNICAL_DESIGN_DOCUMENT.md   # Comprehensive architecture (2600 lines)
│   ├── MULTI_USER_ANALYSIS.md         # Multi-user support analysis
│   ├── MCP_BRIDGE_INTEGRATION.md      # MCP bridge integration docs
│   └── AGENT_COLLECTIVE_REVAMP.md     # Agent Collective revamp integration guide
│
├── guides/                            # Setup & operational guides
│   ├── GETTING_STARTED.md             # Local dev & deployment guide
│   ├── VERTEX_AI_SETUP.md             # Vertex AI (Imagen 3 + Veo) setup
│   ├── VERTEX_AI_SETUP_ORIGINAL.md    # Original Vertex AI guide (reference)
│   ├── VIDEO_SCHEDULER_SETUP.md       # Video scheduler configuration
│   ├── VIDEO_GENERATION_STATUS.md     # Video generation status & troubleshooting
│   └── QUOTA_INCREASE_GUIDE.md        # GCP quota increase process
│
├── phases/                            # Phase planning & completion records
│   ├── implementation-plan.md         # Original 3-phase roadmap
│   ├── PHASE2_PLAN.md                 # Detailed Phase 2 breakdown (700+ lines)
│   ├── PHASE2_QUICKSTART.md           # Phase 2 quick reference
│   ├── PHASE2_BACKEND_COMPLETE.md     # Phase 2 backend completion record
│   ├── PHASE1_README.md               # Phase 1 guide & outcomes
│   ├── PHASE4_5_README.md             # Phase 4 & 5 reorganization guide
│   ├── IMPLEMENTATION_SUMMARY.md      # Implementation completion summary
│   └── YTM_FRONTEND_REBUILD_COMPLETE.md # Frontend rebuild record
│
├── security/                          # Security documentation
│   ├── SECURITY_AUDIT_REPORT.md       # Full security audit findings
│   └── SECURITY_MEASURES.md           # Security controls implemented
│
├── team/                              # Team-specific references
│   └── BACKEND_REQUIREMENTS_FOR_MARCO.md # Backend task list for Marco
│
└── migration/                         # Migration & consolidation records
    ├── CONSOLIDATION_PLAN.md           # Original 47KB consolidation strategy
    ├── MIGRATION_SUMMARY.md            # Migration overview & outcomes
    └── PROJECT_DECOMMISSIONING_CHECKLIST.md # Decommissioning checklist
```

---

## Architecture Overview (Quick Reference)

The V3 Creative Engine is a **Firebase monorepo** consolidating 6 tools:

| Tool | Path | Stack |
|---|---|---|
| Hub | `public/hub.html` | Vanilla HTML |
| Creative Generator | `public/creative-generator/` | Vanilla HTML/JS |
| Agent Collective | `public/agent-collective/` | Vanilla HTML |
| Template Stamper | `public/template-stamper/` + `tools/template-stamper/` | React + Vite + Remotion |
| Shorts Intel Hub | `public/shorts-intel-hub/` + `tools/shorts-intel-hub/` | React + TypeScript |
| Shorts Brain | `public/shorts-brain/` | React |

Backend: All tools share `functions/` (Cloud Functions v2, Node.js 20).

See [architecture/TECHNICAL_DESIGN_DOCUMENT.md](architecture/TECHNICAL_DESIGN_DOCUMENT.md) for full details.
