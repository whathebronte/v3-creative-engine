# Shorts Automation Consolidation - Quick Summary

**Created:** February 12, 2026
**Status:** Planning Complete, Ready to Execute

---

## 🎯 Goal

Consolidate all 6 Shorts Automation tools into **one unified platform** under `v3-creative-engine.web.app`.

---

## 📦 What's Being Consolidated

| # | Tool | Current Project | Current URL | Migration Order |
|---|------|----------------|-------------|-----------------|
| 1 | **Shorts Intel Hub** | shorts-intel-hub-5c45f | https://shorts-intel-hub-5c45f.web.app/ | Phase 2 (Week 2) |
| 2 | **APAC Shorts Brain** | apac-shorts-brain-v2 | https://apac-shorts-brain-v2.web.app/ | Phase 3 (Week 3) |
| 3 | **Agent Collective** | v3-creative-engine ✅ | Already in v3-creative-engine | Phase 4 (Week 4) - Reorganize |
| 4 | **Creative Generator** | v3-creative-engine ✅ | Already in v3-creative-engine | Phase 4 (Week 4) - Reorganize |
| 5 | **Template Stamper** | template-stamper-d7045 | https://template-stamper-d7045.web.app/ | **Phase 6 (Week 6-7) - DEFERRED** |
| 6 | **Campaign Learnings** | (not built yet) | N/A | Future |

---

## ⏱️ Timeline

| Phase | When | What | Status |
|-------|------|------|--------|
| **Phase 1** | Week 1 (Feb 12-19) | Preparation, backups, setup | ⏳ Ready to start |
| **Phase 2** | Week 2 (Feb 19-26) | Migrate Shorts Intel Hub | ⏳ Pending |
| **Phase 3** | Week 3 (Feb 26-Mar 5) | Migrate APAC Shorts Brain | ⏳ Pending |
| **Phase 4** | Week 4 (Mar 5-12) | Reorganize Agent Collective + Creative Generator | ⏳ Pending |
| **Phase 5** | Week 5 (Mar 12-19) | Cleanup & optimization | ⏳ Pending |
| **Phase 6** | Week 6-7 (Mar 19-Apr 2) | **Template Stamper (AFTER AWS→GCP migration)** | ⏳ Waiting |
| **Phase 7** | After Phase 6 | Final cleanup | ⏳ Pending |
| **Decommission** | +90 days (Jun 19) | Delete old Firebase projects | ⏳ Future |

**Target Completion:**
- **Phases 1-5:** March 19, 2026
- **Phase 6 (Template Stamper):** April 2, 2026

---

## 🚀 New URL Structure

After consolidation, all tools will be under `v3-creative-engine.web.app`:

```
https://v3-creative-engine.web.app/
├── /                            → Hub landing page
├── /hub.html                    → Automation hub dashboard
├── /shorts-intel-hub/           → Shorts Intel Hub (NEW)
├── /shorts-brain/               → APAC Shorts Brain (NEW)
├── /creative-generator/         → YTM Creative Generator (MOVED)
├── /agent-collective/           → YTM Agent Collective (MOVED)
├── /template-stamper/           → YTM Template Stamper (DEFERRED)
└── /campaign-learnings/         → Campaign Learnings (FUTURE)
```

Old URLs will **redirect** (301) to new URLs.

---

## 📊 Cost Impact

| Category | Before | After | Change |
|----------|--------|-------|--------|
| **Vertex AI** | $29,524/year | $29,524/year | No change |
| **Infrastructure** | $338/year | $440/year | +$102/year |
| **Total** | $29,862/year | $29,964/year | **+$102/year (+0.3%)** |

**Main Benefit:** Not cost savings, but **unified billing** and **easier management**.

---

## 🗂️ Git Repository Structure

**Before:** 6 separate Git repos
**After:** 1 consolidated repo at `/Users/ivs/shorts-automation/`

```
shorts-automation/                    # Single unified repository
├── tools/                            # Individual tool source code
│   ├── creative-generator/
│   ├── agent-collective/
│   ├── template-stamper/            # DEFERRED
│   ├── shorts-intel-hub/
│   ├── shorts-brain/
│   └── campaign-learnings/
├── public/                           # Firebase Hosting (built output)
│   ├── creative-generator/
│   ├── agent-collective/
│   ├── template-stamper/            # DEFERRED
│   ├── shorts-intel-hub/
│   ├── shorts-brain/
│   └── campaign-learnings/
├── functions/                        # Consolidated Cloud Functions
│   └── src/
│       ├── creative-generator/
│       ├── agent-collective/
│       ├── template-stamper/        # DEFERRED
│       ├── shorts-intel-hub/
│       ├── shorts-brain/
│       └── campaign-learnings/
└── docs/                            # All documentation
    ├── CONSOLIDATION_PLAN.md        ✅
    ├── PROJECT_DECOMMISSIONING_CHECKLIST.md  ✅
    ├── COST_ESTIMATE_2026.md        ✅
    └── MIGRATION_SUMMARY.md         ✅ (this file)
```

---

## 🔥 Firebase/GCP Projects

### Keep Forever
- ✅ **v3-creative-engine** (Primary - all tools consolidate here)

### Delete After 90 Days (June 19, 2026)
- ❌ shorts-intel-hub-5c45f
- ❌ template-stamper-d7045
- ❌ apac-shorts-brain-v2
- ⚠️ ytm-agent-collective-f4f71 (verify first)
- ⚠️ shorts-intel-hub (no suffix - verify first)

**Result:** Free up 4-5 project slots for future projects

---

## ⚠️ Special Note: Template Stamper

**Why Deferred?**

Template Stamper is **currently migrating from AWS to Google Cloud** (Remotion Lambda → Google Cloud Run/Functions).

To avoid migration complexity:
1. **First:** Complete AWS → Google Cloud migration for Template Stamper
2. **Then:** Migrate Template Stamper into consolidated v3-creative-engine

**Prerequisites for Template Stamper Migration:**
- ✅ Remotion fully running on Google Cloud (no AWS)
- ✅ No AWS Lambda functions
- ✅ No AWS S3 buckets
- ✅ Stable in production for 2+ weeks

**Estimated Timeline:**
- AWS→GCP migration: 2-3 weeks
- Consolidation migration: 1-2 weeks
- **Total:** Phase 6 completes by April 2, 2026

---

## 📋 Next Steps (This Week)

### Immediate Actions
1. ✅ Review and approve consolidation plan
2. ⏳ Create backups of all Firebase projects
3. ⏳ Export all Firestore data
4. ⏳ Document all environment variables and secrets
5. ⏳ Set up parent directory structure at `/Users/ivs/shorts-automation/`

### Week 1 (Phase 1: Preparation)
1. Clone all repositories to temporary locations
2. Set up Git subtree strategy
3. Create consolidated directory structure
4. Audit all Cloud Functions
5. Test migration strategy with one tool
6. Create staging environment (optional)

---

## 📚 Documentation

All detailed documentation available in:

1. **CONSOLIDATION_PLAN.md** - Complete migration plan with step-by-step instructions
2. **PROJECT_DECOMMISSIONING_CHECKLIST.md** - Firebase/GCP cleanup checklist
3. **COST_ESTIMATE_2026.md** - Detailed cost analysis
4. **MIGRATION_SUMMARY.md** - This quick summary

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ All tools hosted under v3-creative-engine.web.app
2. ✅ All tools fully functional at new URLs
3. ✅ All Cloud Functions migrated and working
4. ✅ All Firestore data accessible
5. ✅ All Cloud Storage files migrated
6. ✅ MCP bridges working between tools
7. ✅ No data loss
8. ✅ Performance equal or better than baseline
9. ✅ Old URLs redirect to new URLs
10. ✅ Single Git repository
11. ✅ Unified billing
12. ✅ No critical bugs

---

## 🆘 Rollback Plan

If migration fails:
1. Restore old Firebase projects from backup
2. Revert DNS/URL changes
3. Switch back to old function endpoints
4. Restore Firestore from backup
5. Notify users

**Rollback Triggers:**
- Critical functionality broken >2 hours
- Data loss or corruption
- Performance degradation >50%
- Multiple user-facing bugs

---

## 📞 Contact

**Project Owner:** Ivan Ho (ivho@google.com)
**Start Date:** February 12, 2026
**Target Completion:** April 2, 2026 (with Template Stamper)
**Intermediate Completion:** March 19, 2026 (without Template Stamper)

---

**Last Updated:** February 12, 2026
