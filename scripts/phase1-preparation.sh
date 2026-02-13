#!/bin/bash

# Phase 1: Preparation Master Script
# Created: February 12, 2026
# Purpose: Execute all Phase 1 preparation tasks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================================="
echo "Phase 1: Preparation - Shorts Automation Consolidation"
echo "======================================================="
echo "Project Root: $PROJECT_ROOT"
echo "Start Time: $(date)"
echo ""

# Step 1: Document environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Documenting Environment Variables & Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/document-env-vars.sh"
echo ""

# Step 2: Backup Firestore data
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Backing Up Firestore Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Initiating async exports to Cloud Storage..."
"$SCRIPT_DIR/backup-firestore.sh"
echo ""

# Step 3: Backup Cloud Storage
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Backing Up Cloud Storage Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Listing files from all Cloud Storage buckets..."
"$SCRIPT_DIR/backup-cloud-storage.sh"
echo ""

# Step 4: Clone repositories
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Cloning Repositories to Migration Directory"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/_migrate"

# Clone or copy each repository
echo "Cloning shorts-intel-hub..."
if [ ! -d "shorts-intel-hub" ]; then
    cp -r /Users/ivs/shorts-intel-hub ./shorts-intel-hub
    echo "✅ Copied shorts-intel-hub"
else
    echo "⏭️  shorts-intel-hub already exists"
fi

echo "Cloning template-stamper..."
if [ ! -d "template-stamper" ]; then
    cp -r /Users/ivs/template-stamper ./template-stamper
    echo "✅ Copied template-stamper"
else
    echo "⏭️  template-stamper already exists"
fi

echo "Cloning APAC-Shorts-Brain..."
if [ ! -d "shorts-brain" ]; then
    cp -r /Users/ivs/APAC-Shorts-Brain ./shorts-brain
    echo "✅ Copied APAC-Shorts-Brain"
else
    echo "⏭️  shorts-brain already exists"
fi

echo ""

# Step 5: Create consolidated directory structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Creating Consolidated Directory Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT"

# Create tool directories
mkdir -p tools/{creative-generator,agent-collective,template-stamper,shorts-intel-hub,shorts-brain,campaign-learnings}
echo "✅ Created tools/ directories"

# Create public directories (for built output)
mkdir -p public/{creative-generator,agent-collective,template-stamper,shorts-intel-hub,shorts-brain,campaign-learnings}
echo "✅ Created public/ directories"

# Create functions directories
mkdir -p functions/src/{creative-generator,agent-collective,template-stamper,shorts-intel-hub,shorts-brain,campaign-learnings,shared}
echo "✅ Created functions/ directories"

# Create docs directories
mkdir -p docs/{architecture,planning,api,cost-estimates,migration}
echo "✅ Created docs/ directories"

# Create database directories
mkdir -p database/{cloud-sql,firestore}
echo "✅ Created database/ directories"

# Move existing docs to new structure
echo "Moving existing documentation..."
mv CONSOLIDATION_PLAN.md docs/migration/ 2>/dev/null || echo "  (already moved)"
mv PROJECT_DECOMMISSIONING_CHECKLIST.md docs/migration/ 2>/dev/null || echo "  (already moved)"
mv MIGRATION_SUMMARY.md docs/migration/ 2>/dev/null || echo "  (already moved)"
mv COST_ESTIMATE_2026.md docs/cost-estimates/ 2>/dev/null || echo "  (already moved)"

echo ""

# Step 6: Test Firebase CLI
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Testing Firebase CLI & Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Testing Firebase login..."
firebase login --no-localhost 2>&1 | head -5 || echo "⚠️  Already logged in or error"

echo ""
echo "Listing Firebase projects..."
firebase projects:list

echo ""
echo "Testing gcloud CLI..."
gcloud auth list

echo ""

# Step 7: Create Phase 1 completion report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Creating Phase 1 Completion Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REPORT_FILE="$PROJECT_ROOT/_backups/phase1-completion-$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Phase 1: Preparation - Completion Report

**Date:** $(date)
**Status:** Complete

## Tasks Completed

- [x] Environment variables documented
- [x] Firestore backups initiated
- [x] Cloud Storage files inventoried
- [x] Repositories cloned to _migrate/
- [x] Consolidated directory structure created
- [x] Firebase CLI tested
- [x] Google Cloud CLI tested

## Backup Locations

- **Environment Variables:** \`_backups/env-vars-*.md\`
- **Firestore Exports:** Cloud Storage (check Firebase Console)
- **Cloud Storage Lists:** \`_backups/storage/*/file-list.txt\`
- **Repository Copies:** \`_migrate/\`

## Directory Structure

\`\`\`
shorts-automation/
├── _backups/           ✅ Backup files
├── _migrate/           ✅ Repository copies
├── tools/              ✅ Source code directories
├── public/             ✅ Built output directories
├── functions/          ✅ Cloud Functions (existing + new structure)
├── docs/               ✅ Documentation
├── database/           ✅ Schema files
└── scripts/            ✅ Utility scripts
\`\`\`

## Next Steps

Ready to proceed to **Phase 2: Shorts Intel Hub Migration**

### Before Starting Phase 2:

1. ✅ Review environment variables document
2. ⏳ Verify Firestore exports completed (check Cloud Console)
3. ⏳ Move secrets to Google Secret Manager
4. ⏳ Review consolidated directory structure
5. ⏳ Commit current state to Git

### Commands to Verify Backups:

\`\`\`bash
# Check Firestore export status
gcloud firestore operations list --project=v3-creative-engine
gcloud firestore operations list --project=shorts-intel-hub-5c45f
gcloud firestore operations list --project=template-stamper-d7045
gcloud firestore operations list --project=apac-shorts-brain-v2

# Check Cloud Storage backups
ls -lh _backups/storage/*/

# Review environment variables
cat _backups/env-vars-*.md
\`\`\`

---

**Phase 1 Completed:** $(date)
**Ready for Phase 2:** Yes
EOF

echo "✅ Phase 1 completion report: $REPORT_FILE"
echo ""

# Summary
echo "======================================================="
echo "Phase 1: Preparation - COMPLETE ✅"
echo "======================================================="
echo ""
echo "Summary:"
echo "  ✅ Environment variables documented"
echo "  ✅ Backups initiated"
echo "  ✅ Repositories cloned"
echo "  ✅ Directory structure created"
echo "  ✅ CLI tools tested"
echo ""
echo "Completion Report: $REPORT_FILE"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "  1. Review the completion report"
echo "  2. Verify all Firestore exports completed (check Cloud Console)"
echo "  3. Review environment variables document"
echo "  4. Move secrets to Google Secret Manager"
echo "  5. Commit current state to Git"
echo ""
echo "End Time: $(date)"
echo "======================================================="
