#!/bin/bash

# Environment Variables Documentation Script
# Created: February 12, 2026
# Purpose: Document all environment variables and secrets from all projects

BACKUP_DIR="/Users/ivs/shorts-automation/_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$BACKUP_DIR/env-vars-$TIMESTAMP.md"

echo "==================================================="
echo "Environment Variables Documentation Script"
echo "==================================================="
echo "Output file: $OUTPUT_FILE"
echo ""

mkdir -p "$BACKUP_DIR"

# Create markdown file header
cat > "$OUTPUT_FILE" << 'HEADER'
# Environment Variables & Secrets Documentation

**Created:** DATE_PLACEHOLDER
**Purpose:** Document all environment variables before migration

⚠️ **SECURITY WARNING:** This file contains sensitive information. Keep secure!

---

HEADER

# Replace placeholder with actual date
sed -i.bak "s/DATE_PLACEHOLDER/$(date)/" "$OUTPUT_FILE" && rm "${OUTPUT_FILE}.bak"

echo "Documenting environment variables..."

# Document v3-creative-engine
echo "" >> "$OUTPUT_FILE"
echo "## v3-creative-engine" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "### Firebase Config" >> "$OUTPUT_FILE"
cat >> "$OUTPUT_FILE" << 'FIREBASECONFIG'
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "964100659393",
  appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};
```
FIREBASECONFIG

echo "" >> "$OUTPUT_FILE"
echo "### Environment Variables" >> "$OUTPUT_FILE"

# Check for .env files in v3-creative-engine
if [ -f "/Users/ivs/v3-creative-engine/functions/.env" ]; then
    echo "Found .env in v3-creative-engine/functions"
    echo "" >> "$OUTPUT_FILE"
    echo "**Functions .env:**" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    cat "/Users/ivs/v3-creative-engine/functions/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
else
    echo "No .env found in v3-creative-engine/functions"
    echo "No .env found in v3-creative-engine/functions" >> "$OUTPUT_FILE"
fi

# Document template-stamper
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## template-stamper-d7045" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "### Firebase Config" >> "$OUTPUT_FILE"

# Check for Firebase config in template-stamper
if [ -f "/Users/ivs/template-stamper/.firebaserc" ]; then
    echo '```json' >> "$OUTPUT_FILE"
    cat "/Users/ivs/template-stamper/.firebaserc" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Check for .env files in template-stamper
if [ -f "/Users/ivs/template-stamper/.env" ]; then
    echo "Found .env in template-stamper"
    echo "**Root .env:**" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    cat "/Users/ivs/template-stamper/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

if [ -f "/Users/ivs/template-stamper/functions/.env" ]; then
    echo "Found .env in template-stamper/functions"
    echo "**Functions .env:**" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    cat "/Users/ivs/template-stamper/functions/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

# Document AWS credentials
echo "" >> "$OUTPUT_FILE"
echo "### AWS Credentials (Remotion Lambda)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "⚠️ **NOTE:** Template Stamper currently uses AWS. After AWS→GCP migration, these will no longer be needed." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Check these locations:" >> "$OUTPUT_FILE"
echo "- Template Stamper \`.env\` files" >> "$OUTPUT_FILE"
echo "- AWS credentials file: \`~/.aws/credentials\`" >> "$OUTPUT_FILE"
echo "- Environment variables: \`AWS_ACCESS_KEY_ID\`, \`AWS_SECRET_ACCESS_KEY\`" >> "$OUTPUT_FILE"

# Document shorts-intel-hub
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## shorts-intel-hub-5c45f" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "### Firebase Config" >> "$OUTPUT_FILE"

if [ -f "/Users/ivs/shorts-intel-hub/.firebaserc" ]; then
    echo '```json' >> "$OUTPUT_FILE"
    cat "/Users/ivs/shorts-intel-hub/.firebaserc" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Check for .env files
if [ -f "/Users/ivs/shorts-intel-hub/backend/functions/.env" ]; then
    echo "Found .env in shorts-intel-hub/backend/functions"
    echo "**Functions .env:**" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    cat "/Users/ivs/shorts-intel-hub/backend/functions/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "### Cloud SQL Connection" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Check for Cloud SQL credentials:" >> "$OUTPUT_FILE"
echo "- Connection string format: \`PROJECT:REGION:INSTANCE\`" >> "$OUTPUT_FILE"
echo "- Database credentials" >> "$OUTPUT_FILE"
echo "- SSL certificates (if used)" >> "$OUTPUT_FILE"

# Document apac-shorts-brain
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## apac-shorts-brain-v2" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "### Firebase Config" >> "$OUTPUT_FILE"

if [ -f "/Users/ivs/APAC-Shorts-Brain/.firebaserc" ]; then
    echo '```json' >> "$OUTPUT_FILE"
    cat "/Users/ivs/APAC-Shorts-Brain/.firebaserc" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

if [ -f "/Users/ivs/APAC-Shorts-Brain/config.js" ]; then
    echo "" >> "$OUTPUT_FILE"
    echo "**config.js:**" >> "$OUTPUT_FILE"
    echo '```javascript' >> "$OUTPUT_FILE"
    cat "/Users/ivs/APAC-Shorts-Brain/config.js" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

# Add instructions from template
cat "$BACKUP_DIR/.doc-template.txt" >> "$OUTPUT_FILE"

# Add timestamp and status
echo "**Last Updated:** $(date)" >> "$OUTPUT_FILE"
echo "**Status:** Review and verify all credentials listed above" >> "$OUTPUT_FILE"

echo "✅ Documentation complete!"
echo ""
echo "Output file: $OUTPUT_FILE"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. Review the generated file"
echo "2. Verify all credentials are documented"
echo "3. KEEP THIS FILE SECURE (contains sensitive data)"
echo "4. Move secrets to Google Secret Manager before migration"
echo ""
