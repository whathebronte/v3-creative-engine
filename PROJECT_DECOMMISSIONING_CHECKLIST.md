# Project Decommissioning Checklist

**Purpose:** Clean up unused Firebase/GCP projects after consolidation
**Created:** February 12, 2026
**Execute After:** Successful migration and 90-day grace period

---

## Overview

After consolidating all Shorts Automation tools into `v3-creative-engine`, the following Firebase/GCP projects will become **obsolete** and can be safely deleted to free up project quota space.

**Grace Period:** Keep projects in read-only mode for **90 days** after migration completion to ensure no issues arise.

---

## Projects to Decommission

### Shorts Automation Tools (To Be Deleted After Migration)

#### 1. shorts-intel-hub-5c45f
- **Display Name:** Shorts intel hub
- **Project ID:** `shorts-intel-hub-5c45f`
- **Project Number:** 236064788835
- **Current URL:** https://shorts-intel-hub-5c45f.web.app/
- **Resources:**
  - Firebase Hosting
  - Cloud Functions (multiple)
  - Cloud SQL (PostgreSQL with pgvector)
  - Cloud Storage
  - Cloud Scheduler
- **Migration Status:** To be migrated to v3-creative-engine
- **Can Delete After:** Migration complete + 90 days

**⚠️ Important:** Cloud SQL database must be backed up before deletion

---

#### 2. template-stamper-d7045
- **Display Name:** Template Stamper
- **Project ID:** `template-stamper-d7045`
- **Project Number:** 846225698038
- **Current URL:** https://template-stamper-d7045.web.app/
- **Resources:**
  - Firebase Hosting
  - Cloud Functions
  - Cloud Firestore
  - Cloud Storage
  - AWS Remotion Lambda (external, not deleted with Firebase project)
- **Migration Status:** To be migrated to v3-creative-engine
- **Can Delete After:** Migration complete + 90 days

**⚠️ Important:** AWS resources (Remotion Lambda) must be managed separately

---

#### 3. apac-shorts-brain-v2
- **Display Name:** apac-shorts-brain-v2
- **Project ID:** `apac-shorts-brain-v2`
- **Project Number:** 175190990004
- **Current URL:** https://apac-shorts-brain-v2.web.app/
- **Resources:**
  - Firebase Hosting
  - Cloud Firestore (if any)
  - Cloud Storage (minimal)
- **Migration Status:** To be migrated to v3-creative-engine
- **Can Delete After:** Migration complete + 90 days

---

#### 4. ytm-agent-collective-f4f71
- **Display Name:** YTM-agent-collective
- **Project ID:** `ytm-agent-collective-f4f71`
- **Project Number:** 644032265524
- **Current URL:** https://ytm-agent-collective-f4f71.web.app/ (if used)
- **Status:** ⚠️ **VERIFY IF STILL IN USE**
- **Notes:**
  - Agent Collective is currently hosted in `v3-creative-engine`
  - This project may be a legacy/duplicate
  - Check if any production traffic still goes here
- **Can Delete After:** Verification + Migration complete + 90 days

---

### Other Projects (Unrelated to Shorts Automation)

These projects are **NOT part of Shorts Automation** and should be **kept** or evaluated separately:

#### Keep These Projects:

1. **v3-creative-engine** ✅ **PRIMARY** (keep forever - target project)
   - Project ID: `v3-creative-engine`
   - Project Number: 964100659393
   - All tools will be consolidated here

2. **americano-5129c** (Americano app - unrelated)
   - Project ID: `americano-5129c`
   - Project Number: 840567599111
   - Status: Keep (separate project)

3. **my-budget-manager-484809** (Budget manager - unrelated)
   - Project ID: `my-budget-manager-484809`
   - Project Number: 1003049336775
   - Status: Keep (separate project)

4. **walktober-2025** (Walktober app - unrelated)
   - Project ID: `walktober-2025`
   - Project Number: 803134690939
   - Status: Keep (separate project)

5. **gen-lang-client-0216121577** (Gemini API project)
   - Project ID: `gen-lang-client-0216121577`
   - Project Number: 495292349914
   - Status: Keep (API access project)

6. **gusdicemarco-enabled-with-rag** (RAG agent framework)
   - Project ID: `gusdicemarco-enabled-with-rag`
   - Project Number: 293490080698
   - Status: Keep (agent framework)

7. **weareout** (WeAreOut app - unrelated)
   - Project ID: `weareout`
   - Project Number: 149836750364
   - Status: Keep (separate project)

#### Evaluate These Projects:

8. **shorts-intel-hub** (No suffix - legacy?)
   - Project ID: `shorts-intel-hub`
   - Project Number: 376739160963
   - Status: ⚠️ **VERIFY IF DUPLICATE**
   - Notes: May be a legacy version of `shorts-intel-hub-5c45f`
   - Check if any resources or data exist here
   - **Action:** Verify, then likely delete

---

## Decommissioning Timeline

### Phase 1: Pre-Decommissioning (During Migration)

**Week Before Migration:**
1. ✅ Identify all projects to decommission
2. ✅ Document all resources in each project
3. ✅ Create this decommissioning checklist
4. ✅ Communicate timeline to stakeholders

**During Migration:**
1. ✅ Back up all data from projects (Firestore, Cloud SQL, Storage)
2. ✅ Test backups (verify they can be restored)
3. ✅ Document all secrets and API keys
4. ✅ Migrate resources to v3-creative-engine

---

### Phase 2: Grace Period (90 Days After Migration)

**Immediately After Migration (Week 1):**
1. ⏳ Set projects to read-only mode (disable writes)
2. ⏳ Add redirect rules from old URLs to new URLs
3. ⏳ Add shutdown banners to old URLs
4. ⏳ Monitor traffic to old URLs

**30 Days After Migration:**
1. ⏳ Review traffic logs (ensure no one using old URLs)
2. ⏳ Check for any unexpected errors
3. ⏳ Verify all data accessible in v3-creative-engine

**60 Days After Migration:**
1. ⏳ Final verification of new system
2. ⏳ Confirm no production dependencies on old projects
3. ⏳ Get stakeholder sign-off for deletion

**90 Days After Migration:**
1. ⏳ Final backup of all projects (archival)
2. ⏳ Execute deletion (see Phase 3)

---

### Phase 3: Deletion (After 90-Day Grace Period)

**Target Date:** June 19, 2026 (90 days after March 19, 2026)

Execute deletion in this order:

#### Step 1: Final Verification
```bash
# Check for any active resources
gcloud services list --enabled --project=shorts-intel-hub-5c45f
gcloud services list --enabled --project=template-stamper-d7045
gcloud services list --enabled --project=apac-shorts-brain-v2
gcloud services list --enabled --project=ytm-agent-collective-f4f71

# Check for any active Cloud Functions
gcloud functions list --project=shorts-intel-hub-5c45f
gcloud functions list --project=template-stamper-d7045

# Check for any Cloud SQL instances
gcloud sql instances list --project=shorts-intel-hub-5c45f

# Check for any Cloud Storage buckets
gsutil ls -p shorts-intel-hub-5c45f
gsutil ls -p template-stamper-d7045
gsutil ls -p apac-shorts-brain-v2
```

#### Step 2: Final Archival Backup
```bash
# Export Firestore data (if not already done)
gcloud firestore export gs://[BACKUP_BUCKET]/final-archive-[PROJECT_ID] --project=[PROJECT_ID]

# Export Cloud SQL (Shorts Intel Hub only)
gcloud sql export sql shorts-intel-hub-instance gs://[BACKUP_BUCKET]/cloud-sql-final-backup.sql \
  --database=[DB_NAME] \
  --project=shorts-intel-hub-5c45f

# Archive Cloud Storage buckets
gsutil -m cp -r gs://[PROJECT_BUCKET]/* gs://[ARCHIVE_BUCKET]/[PROJECT_ID]/
```

#### Step 3: Disable Services (One Last Time)
```bash
# Disable Cloud Functions
gcloud functions delete [FUNCTION_NAME] --project=[PROJECT_ID] --quiet

# Disable Cloud Scheduler
gcloud scheduler jobs delete [JOB_NAME] --project=[PROJECT_ID] --quiet

# Delete Cloud SQL instances
gcloud sql instances delete [INSTANCE_NAME] --project=shorts-intel-hub-5c45f --quiet
```

#### Step 4: Delete Firebase Resources
```bash
# Disable Firebase Hosting
firebase hosting:disable --project=[PROJECT_ID]

# Note: Cannot delete Firestore database - must delete entire project
```

#### Step 5: Delete Projects (Firebase Console)

**Manual Steps (Firebase Console):**

For each project to delete:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project (e.g., `shorts-intel-hub-5c45f`)
3. Click gear icon → Project Settings
4. Scroll to bottom → "Delete project"
5. Type project ID to confirm
6. Click "Delete project"

**Projects to delete:**
- ✅ `shorts-intel-hub-5c45f`
- ✅ `template-stamper-d7045`
- ✅ `apac-shorts-brain-v2`
- ⚠️ `ytm-agent-collective-f4f71` (after verification)
- ⚠️ `shorts-intel-hub` (no suffix - after verification)

#### Step 6: Delete GCP Projects (If Not Auto-Deleted)

If projects still exist after Firebase deletion:

```bash
# Delete GCP projects
gcloud projects delete shorts-intel-hub-5c45f
gcloud projects delete template-stamper-d7045
gcloud projects delete apac-shorts-brain-v2
gcloud projects delete ytm-agent-collective-f4f71
gcloud projects delete shorts-intel-hub
```

Confirm each deletion when prompted.

#### Step 7: Verify Deletion

```bash
# List remaining projects
firebase projects:list
gcloud projects list

# Verify deleted projects are gone
gcloud projects describe shorts-intel-hub-5c45f
# Should return: ERROR: Project not found
```

---

## Pre-Deletion Checklist

Before deleting any project, verify:

### Data Verification
- [ ] All Firestore data migrated to v3-creative-engine
- [ ] All Cloud Storage files migrated
- [ ] All Cloud SQL data backed up (Shorts Intel Hub)
- [ ] All secrets and API keys documented
- [ ] All Cloud Functions code backed up in Git

### Traffic Verification
- [ ] No traffic to old Firebase Hosting URLs (check logs)
- [ ] No API calls to old Cloud Functions (check logs)
- [ ] No database connections to Cloud SQL (if applicable)
- [ ] All external integrations updated to new URLs

### Stakeholder Verification
- [ ] All team members notified of deletion
- [ ] All users transitioned to new URLs
- [ ] No complaints or issues reported in 90 days
- [ ] Sign-off from project owner (Ivan Ho)

### Backup Verification
- [ ] Final archival backups created
- [ ] Backups stored in secure location (separate project)
- [ ] Backups tested (can be restored if needed)
- [ ] Backup retention policy set (e.g., 2 years)

### Billing Verification
- [ ] No active billing in old projects
- [ ] All charges stopped
- [ ] Billing account updated to v3-creative-engine only

---

## Resource Impact by Project

### shorts-intel-hub-5c45f

**Resources to Delete:**
- Cloud Functions: ~6 functions (ingestion, processing, ranking, scheduler, API, MCP)
- Cloud SQL: 1 PostgreSQL instance with pgvector
- Cloud Scheduler: 1 job (weekly refresh)
- Cloud Storage: 1 bucket (agency uploads)
- Firebase Hosting: 1 site
- Firestore: Collections (if any)

**Estimated Savings:**
- Cloud SQL: ~$10/month
- Cloud Functions: ~$2/month
- Other: <$1/month
- **Total: ~$13/month ($156/year)**

---

### template-stamper-d7045

**Resources to Delete:**
- Cloud Functions: ~4 functions (MCP receive, template management, job management, Remotion)
- Cloud Storage: 1 bucket (input assets, output videos)
- Firebase Hosting: 1 site
- Firestore: Collections (templates, jobs, transfers)

**⚠️ NOT Deleted (External):**
- AWS Remotion Lambda functions (manage separately)
- AWS S3 buckets (manage separately)

**Estimated Savings:**
- Cloud Functions: ~$1/month
- Storage: ~$2/month
- Other: <$1/month
- **Total: ~$4/month ($48/year)**
- **Note:** AWS costs remain (~$10/month)

---

### apac-shorts-brain-v2

**Resources to Delete:**
- Firebase Hosting: 1 site
- Cloud Storage: 1 bucket (minimal)
- Firestore: Collections (if any)

**Estimated Savings:**
- Hosting: <$1/month
- Storage: <$1/month
- **Total: ~$1/month ($12/year)**

---

### ytm-agent-collective-f4f71 (if deleted)

**Resources to Delete:**
- Firebase Hosting: 1 site (if active)
- Firestore: Collections (if any)

**Estimated Savings:**
- Hosting: <$1/month
- **Total: <$1/month (<$12/year)**

---

## Total Project Quota Freed

**Google Cloud Project Quota:**
- Default quota: 12 projects per billing account
- After deletion: **4-5 projects freed** (depending on verification)

**Firebase Project Quota:**
- No hard limit, but cleaner organization

---

## AWS Resources (Separate Cleanup)

**Template Stamper uses AWS Remotion Lambda** - these must be managed separately:

### AWS Resources to Keep (For Now)
- Remotion Lambda functions in `us-east-1`
- S3 buckets for Remotion rendering
- IAM roles and policies
- CloudWatch logs

**Note:** After migration, these AWS resources will still be used by Template Stamper (now in v3-creative-engine). Do NOT delete unless you're decommissioning Template Stamper entirely.

### If Decommissioning Remotion Lambda in Future:
```bash
# List Remotion Lambda resources
npx remotion lambda sites ls
npx remotion lambda functions ls

# Delete Remotion Lambda resources
npx remotion lambda sites rm [SITE_NAME]
npx remotion lambda functions rm [FUNCTION_NAME]

# Delete S3 buckets
aws s3 rb s3://[BUCKET_NAME] --force
```

---

## Post-Deletion Verification

After all projects deleted, verify:

1. **Firebase Console**
   - Only `v3-creative-engine` and unrelated projects remain
   - No orphaned projects

2. **GCP Console**
   - Projects list is clean
   - No unexpected charges
   - Billing consolidated to v3-creative-engine

3. **DNS/URLs**
   - Old URLs return 404 or redirect to new URLs
   - No broken links in documentation

4. **Git Repositories**
   - Old repos archived (read-only or deleted)
   - New consolidated repo is primary

5. **Cost Tracking**
   - Monthly costs reflect only v3-creative-engine
   - No charges from old projects

---

## Archive Storage

Keep final backups in a separate GCP project for long-term archival:

**Recommended:** Create a dedicated archive project:
- **Project Name:** `shorts-automation-archive`
- **Purpose:** Long-term backup storage only
- **Storage:** Cloud Storage (Coldline or Archive class)
- **Retention:** 2 years minimum
- **Cost:** ~$1-2/month

**Backup Structure:**
```
gs://shorts-automation-archive/
├── 2026-06-19-final-decommission/
│   ├── shorts-intel-hub-5c45f/
│   │   ├── firestore-export/
│   │   ├── cloud-sql-backup.sql
│   │   ├── cloud-storage/
│   │   └── cloud-functions-code/
│   ├── template-stamper-d7045/
│   │   ├── firestore-export/
│   │   ├── cloud-storage/
│   │   └── cloud-functions-code/
│   ├── apac-shorts-brain-v2/
│   │   ├── firestore-export/
│   │   └── cloud-storage/
│   └── metadata.json
└── documentation/
    ├── CONSOLIDATION_PLAN.md
    ├── PROJECT_DECOMMISSIONING_CHECKLIST.md
    └── migration-logs/
```

---

## Emergency Rollback After Deletion

If you need to restore a deleted project (within 30-day recovery window):

```bash
# List recently deleted projects
gcloud projects list --filter="lifecycleState:DELETE_REQUESTED"

# Undelete a project (within 30 days)
gcloud projects undelete [PROJECT_ID]
```

**Note:** After 30 days, projects are permanently deleted and cannot be recovered.

---

## Contact Information

**Project Owner:** Ivan Ho (ivho@google.com)
**Decommission Approval:** Ivan Ho
**Execution Date:** June 19, 2026 (90 days post-migration)
**Status:** Pending migration completion

---

## Summary Table

| Project ID | Status | Delete After | Estimated Savings | Notes |
|------------|--------|--------------|-------------------|-------|
| `shorts-intel-hub-5c45f` | To Delete | June 19, 2026 | $156/year | Backup Cloud SQL first |
| `template-stamper-d7045` | To Delete | June 19, 2026 | $48/year | AWS resources remain |
| `apac-shorts-brain-v2` | To Delete | June 19, 2026 | $12/year | Minimal resources |
| `ytm-agent-collective-f4f71` | Verify First | TBD | <$12/year | Check if still in use |
| `shorts-intel-hub` (no suffix) | Verify First | TBD | $0 | Likely empty/legacy |
| `v3-creative-engine` | ✅ **KEEP** | Never | N/A | Primary project |
| All other projects | ✅ **KEEP** | N/A | N/A | Unrelated projects |

**Total Freed Project Quota:** 4-5 projects
**Total Annual Savings:** ~$216-228/year (minimal - not the main benefit)
**Main Benefit:** Cleaner organization, freed project slots

---

**Document Version:** 1.0
**Created:** February 12, 2026
**Last Updated:** February 12, 2026
**Execute Date:** June 19, 2026
