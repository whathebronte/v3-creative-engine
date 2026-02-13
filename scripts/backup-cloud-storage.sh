#!/bin/bash

# Cloud Storage Backup Script for Phase 1 Migration
# Created: February 12, 2026
# Purpose: Backup all Cloud Storage files from all projects before migration

set -e  # Exit on error

BACKUP_DIR="/Users/ivs/shorts-automation/_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "==================================================="
echo "Cloud Storage Backup Script"
echo "==================================================="
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory structure
mkdir -p "$BACKUP_DIR/storage/$TIMESTAMP"

# List of projects to backup
declare -A PROJECTS=(
    ["v3-creative-engine"]="v3-creative-engine.firebasestorage.app"
    ["shorts-intel-hub-5c45f"]="shorts-intel-hub-5c45f.appspot.com"
    ["template-stamper-d7045"]="template-stamper-d7045.firebasestorage.app"
    ["apac-shorts-brain-v2"]="apac-shorts-brain-v2.appspot.com"
)

echo "Projects to backup:"
for project in "${!PROJECTS[@]}"; do
    echo "  - $project (gs://${PROJECTS[$project]})"
done
echo ""

# Backup each project
for project in "${!PROJECTS[@]}"; do
    bucket="${PROJECTS[$project]}"

    echo "---------------------------------------------------"
    echo "Backing up project: $project"
    echo "Bucket: gs://$bucket"
    echo "---------------------------------------------------"

    # Create project-specific backup directory
    PROJECT_BACKUP_DIR="$BACKUP_DIR/storage/$TIMESTAMP/$project"
    mkdir -p "$PROJECT_BACKUP_DIR"

    # Check if bucket exists
    if gsutil ls -p "$project" | grep -q "gs://$bucket"; then
        echo "✅ Bucket exists: gs://$bucket"

        # Get bucket size
        echo "Calculating bucket size..."
        gsutil du -s "gs://$bucket" | tee "$PROJECT_BACKUP_DIR/size.txt" || echo "Could not calculate size"

        # List all files
        echo "Listing all files..."
        gsutil ls -r "gs://$bucket/**" > "$PROJECT_BACKUP_DIR/file-list.txt" 2>&1 || {
            echo "⚠️  Warning: Could not list files"
        }

        FILE_COUNT=$(wc -l < "$PROJECT_BACKUP_DIR/file-list.txt" | tr -d ' ')
        echo "Total files: $FILE_COUNT"

        # Skip local download (files are safe in Cloud Storage)
        echo "⏭️  Skipping local download (files remain safely in Cloud Storage)"

    else
        echo "⚠️  Bucket not found: gs://$bucket"
        echo "This may be normal if project has no storage"
    fi

    echo ""
done

echo "==================================================="
echo "Backup Process Summary"
echo "==================================================="
echo "Backup location: $BACKUP_DIR/storage/$TIMESTAMP"
echo ""
echo "File lists saved to: **/file-list.txt"
echo "Bucket sizes saved to: **/size.txt"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. Files remain in Cloud Storage buckets (safe)"
echo "2. Local downloads are optional (for offline backup)"
echo "3. Review file-list.txt to see what was backed up"
echo ""
echo "Backup script completed at: $(date)"
echo "==================================================="
