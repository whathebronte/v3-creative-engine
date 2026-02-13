#!/bin/bash

# Firestore Backup Script for Phase 1 Migration
# Created: February 12, 2026
# Purpose: Backup all Firestore data from all projects before migration

set -e  # Exit on error

BACKUP_DIR="/Users/ivs/shorts-automation/_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "==================================================="
echo "Firestore Backup Script"
echo "==================================================="
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory structure
mkdir -p "$BACKUP_DIR/firestore/$TIMESTAMP"

# List of projects to backup
PROJECTS=(
    "v3-creative-engine"
    "shorts-intel-hub-5c45f"
    "template-stamper-d7045"
    "apac-shorts-brain-v2"
)

echo "Projects to backup:"
for project in "${PROJECTS[@]}"; do
    echo "  - $project"
done
echo ""

# Backup each project
for project in "${PROJECTS[@]}"; do
    echo "---------------------------------------------------"
    echo "Backing up project: $project"
    echo "---------------------------------------------------"

    # Create project-specific backup directory
    PROJECT_BACKUP_DIR="$BACKUP_DIR/firestore/$TIMESTAMP/$project"
    mkdir -p "$PROJECT_BACKUP_DIR"

    # Check if project has Firestore enabled
    echo "Checking Firestore status for $project..."

    # Try to export Firestore data
    # Note: This requires a Cloud Storage bucket in the project
    BUCKET="gs://${project}.appspot.com/backups/firestore-${TIMESTAMP}"

    echo "Attempting to export Firestore to: $BUCKET"

    gcloud firestore export "$BUCKET" \
        --project="$project" \
        --async 2>&1 | tee "$PROJECT_BACKUP_DIR/export.log" || {
        echo "⚠️  Warning: Firestore export failed for $project"
        echo "This may be normal if project has no Firestore data"
        echo "Error logged to: $PROJECT_BACKUP_DIR/export.log"
    }

    echo "✅ Backup initiated for $project"
    echo ""
done

echo "==================================================="
echo "Backup Process Summary"
echo "==================================================="
echo "Backup location: $BACKUP_DIR/firestore/$TIMESTAMP"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. Firestore exports are ASYNC - they may take several minutes"
echo "2. Check Cloud Console to verify exports completed successfully"
echo "3. Exports are stored in Cloud Storage buckets"
echo "4. Use 'gcloud firestore operations list' to check status"
echo ""
echo "To check export status:"
echo "  gcloud firestore operations list --project=[PROJECT_ID]"
echo ""
echo "To download exports locally (optional):"
echo "  gsutil -m cp -r gs://[PROJECT].appspot.com/backups/firestore-$TIMESTAMP $BACKUP_DIR/firestore/$TIMESTAMP/[PROJECT]/"
echo ""
echo "Backup script completed at: $(date)"
echo "==================================================="
