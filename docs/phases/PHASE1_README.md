# Phase 1: Preparation - Quick Start Guide

**Created:** February 12, 2026
**Status:** Ready to Execute

---

## 🎯 Goal

Complete all preparation tasks before migrating tools to the consolidated platform.

---

## 📋 What This Phase Does

1. **Documents environment variables** from all projects
2. **Backs up Firestore data** to Cloud Storage
3. **Inventories Cloud Storage files** from all projects
4. **Clones repositories** to temporary migration locations
5. **Creates directory structure** for consolidated project
6. **Tests Firebase/gcloud CLI** permissions
7. **Generates completion report**

---

## 🚀 Quick Start

### Option 1: Run Everything (Recommended)

Run the master script to execute all Phase 1 tasks:

```bash
cd /Users/ivs/shorts-automation
./scripts/phase1-preparation.sh
```

**Time Estimate:** 10-15 minutes (interactive)

---

### Option 2: Run Individual Scripts

If you prefer to run tasks separately:

#### 1. Document Environment Variables
```bash
./scripts/document-env-vars.sh
```
**Output:** `_backups/env-vars-[timestamp].md`

#### 2. Backup Firestore
```bash
./scripts/backup-firestore.sh
```
**Output:** Async exports to Cloud Storage

#### 3. Backup Cloud Storage
```bash
./scripts/backup-cloud-storage.sh
```
**Output:** File lists in `_backups/storage/[timestamp]/`

---

## 📂 Directory Structure Created

After running Phase 1:

```
shorts-automation/
├── _backups/                    # All backup files
│   ├── env-vars-*.md           # Environment variables
│   ├── firestore/              # Firestore export logs
│   └── storage/                # Storage file lists
│
├── _migrate/                    # Copied repositories
│   ├── shorts-intel-hub/
│   ├── template-stamper/
│   └── shorts-brain/
│
├── tools/                       # Source code (empty, ready for migration)
│   ├── creative-generator/
│   ├── agent-collective/
│   ├── template-stamper/
│   ├── shorts-intel-hub/
│   ├── shorts-brain/
│   └── campaign-learnings/
│
├── public/                      # Built output (existing + new structure)
│   ├── creative-generator/
│   ├── agent-collective/
│   ├── template-stamper/
│   ├── shorts-intel-hub/
│   ├── shorts-brain/
│   └── campaign-learnings/
│
├── functions/                   # Cloud Functions
│   └── src/
│       ├── creative-generator/  # Existing functions
│       ├── agent-collective/    # Existing functions
│       ├── template-stamper/    # Ready for new functions
│       ├── shorts-intel-hub/    # Ready for new functions
│       ├── shorts-brain/        # Ready for new functions
│       ├── campaign-learnings/  # Ready for new functions
│       └── shared/              # Shared utilities
│
├── docs/                        # Documentation
│   ├── migration/               # Migration docs
│   │   ├── CONSOLIDATION_PLAN.md
│   │   ├── PROJECT_DECOMMISSIONING_CHECKLIST.md
│   │   └── MIGRATION_SUMMARY.md
│   ├── cost-estimates/
│   │   └── COST_ESTIMATE_2026.md
│   ├── architecture/            # Ready for new docs
│   ├── planning/                # Ready for new docs
│   └── api/                     # Ready for new docs
│
├── database/                    # Database schemas
│   ├── cloud-sql/              # Cloud SQL schemas
│   └── firestore/              # Firestore docs
│
├── scripts/                     # Utility scripts
│   ├── phase1-preparation.sh   # Master script
│   ├── backup-firestore.sh
│   ├── backup-cloud-storage.sh
│   └── document-env-vars.sh
│
├── firebase.json               # Existing config
├── firestore.rules             # Existing rules
├── storage.rules               # Existing rules
└── .firebaserc                 # Existing project ref
```

---

## ✅ Success Criteria

Phase 1 is complete when:

1. ✅ All scripts executed without critical errors
2. ✅ Environment variables documented
3. ✅ Firestore exports initiated (check Cloud Console)
4. ✅ Cloud Storage files inventoried
5. ✅ Repositories copied to `_migrate/`
6. ✅ Directory structure created
7. ✅ Firebase/gcloud CLI working
8. ✅ Completion report generated

---

## 🔍 Verification Steps

After running Phase 1:

### 1. Check Environment Variables Documentation
```bash
cat _backups/env-vars-*.md
```

### 2. Verify Firestore Exports
```bash
# Check export status
gcloud firestore operations list --project=v3-creative-engine
gcloud firestore operations list --project=shorts-intel-hub-5c45f
gcloud firestore operations list --project=template-stamper-d7045
gcloud firestore operations list --project=apac-shorts-brain-v2
```

### 3. Check Cloud Storage Backups
```bash
# Review file lists
ls -lh _backups/storage/*/
cat _backups/storage/*/*/file-list.txt
```

### 4. Verify Repositories Copied
```bash
ls -la _migrate/
```

### 5. Check Directory Structure
```bash
tree -L 2 tools/
tree -L 2 public/
tree -L 3 functions/
```

---

## ⚠️ Important Notes

### Firestore Exports are Async
- Exports may take 5-15 minutes to complete
- Check status in Cloud Console: https://console.firebase.google.com/
- Or use `gcloud firestore operations list`

### Cloud Storage Files
- Files remain in original Cloud Storage buckets (safe)
- Scripts only create inventories (file lists)
- Local downloads are optional (can skip to save time/space)

### Secrets & API Keys
- Environment variables doc contains sensitive data
- Keep `_backups/env-vars-*.md` secure
- Move to Google Secret Manager before migration

---

## 🚧 Troubleshooting

### "Permission denied" errors
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Firebase CLI not logged in
```bash
firebase login
```

### gcloud CLI not authenticated
```bash
gcloud auth login
gcloud config set project v3-creative-engine
```

### Firestore export fails
- Check if project has Firestore enabled
- Verify Cloud Storage bucket exists
- Some projects may have no Firestore data (normal)

---

## 📋 Next Steps

After Phase 1 completes successfully:

### Immediate Actions:
1. ✅ Review completion report
2. ⏳ Verify Firestore exports completed
3. ⏳ Review environment variables document
4. ⏳ Move secrets to Google Secret Manager (see below)
5. ⏳ Commit current state to Git

### Move Secrets to Google Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=v3-creative-engine

# Create secrets (example)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --project=v3-creative-engine

# Grant Cloud Functions access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:v3-creative-engine@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=v3-creative-engine
```

### Commit to Git

```bash
cd /Users/ivs/shorts-automation
git add .
git commit -m "Phase 1: Preparation complete - directory structure and backups"
git push
```

---

## 🎯 Ready for Phase 2?

Once Phase 1 is complete and verified, you're ready for:

**Phase 2: Shorts Intel Hub Migration** (Week 2)

See: `docs/migration/CONSOLIDATION_PLAN.md` - Phase 2 section

---

**Questions or Issues?**

Contact: Ivan Ho (ivho@google.com)

---

**Last Updated:** February 12, 2026
