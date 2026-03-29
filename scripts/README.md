# scripts/

Utility shell scripts for maintenance operations.

| Script | Purpose |
|---|---|
| `backup-firestore.sh` | Export Firestore data to Cloud Storage |
| `backup-cloud-storage.sh` | Backup Cloud Storage bucket contents |
| `phase1-preparation.sh` | One-time Phase 1 setup script (historical reference) |

## Running Backups

```bash
# Backup Firestore
bash scripts/backup-firestore.sh

# Backup Cloud Storage
bash scripts/backup-cloud-storage.sh
```

Requires `gcloud` CLI authenticated with the `v3-creative-engine` project.
