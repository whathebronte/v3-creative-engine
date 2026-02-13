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

# Create markdown file
cat > "$OUTPUT_FILE" << 'HEADER'
# Environment Variables & Secrets Documentation

**Created:** $(date)
**Purpose:** Document all environment variables before migration

⚠️ **SECURITY WARNING:** This file contains sensitive information. Keep secure!

---

HEADER

echo "Documenting environment variables..."

# Document v3-creative-engine
cat >> "$OUTPUT_FILE" << 'EOF'
## v3-creative-engine

### Firebase Config
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

### Environment Variables
EOF

# Check for .env files in v3-creative-engine
if [ -f "/Users/ivs/v3-creative-engine/functions/.env" ]; then
    echo "Found .env in v3-creative-engine/functions"
    cat >> "$OUTPUT_FILE" << 'EOF'
**Functions .env:**
```
EOF
    cat "/Users/ivs/v3-creative-engine/functions/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
else
    echo "No .env found in v3-creative-engine/functions" | tee -a "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Document template-stamper
cat >> "$OUTPUT_FILE" << 'EOF'

---

## template-stamper-d7045

### Firebase Config
EOF

# Check for Firebase config in template-stamper
if [ -f "/Users/ivs/template-stamper/.firebaserc" ]; then
    echo "```json" >> "$OUTPUT_FILE"
    cat "/Users/ivs/template-stamper/.firebaserc" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Check for .env files in template-stamper
if [ -f "/Users/ivs/template-stamper/.env" ]; then
    echo "Found .env in template-stamper"
    cat >> "$OUTPUT_FILE" << 'EOF'
**Root .env:**
```
EOF
    cat "/Users/ivs/template-stamper/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

if [ -f "/Users/ivs/template-stamper/functions/.env" ]; then
    echo "Found .env in template-stamper/functions"
    cat >> "$OUTPUT_FILE" << 'EOF'
**Functions .env:**
```
EOF
    cat "/Users/ivs/template-stamper/functions/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Document AWS credentials (if any)
cat >> "$OUTPUT_FILE" << 'EOF'

### AWS Credentials (Remotion Lambda)

⚠️ **NOTE:** Template Stamper currently uses AWS. After AWS→GCP migration, these will no longer be needed.

Check these locations:
- Template Stamper `.env` files
- AWS credentials file: `~/.aws/credentials`
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

EOF

# Document shorts-intel-hub
cat >> "$OUTPUT_FILE" << 'EOF'

---

## shorts-intel-hub-5c45f

### Firebase Config
EOF

if [ -f "/Users/ivs/shorts-intel-hub/.firebaserc" ]; then
    echo "```json" >> "$OUTPUT_FILE"
    cat "/Users/ivs/shorts-intel-hub/.firebaserc" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Check for .env files
if [ -f "/Users/ivs/shorts-intel-hub/backend/functions/.env" ]; then
    echo "Found .env in shorts-intel-hub/backend/functions"
    cat >> "$OUTPUT_FILE" << 'EOF'
**Functions .env:**
```
EOF
    cat "/Users/ivs/shorts-intel-hub/backend/functions/.env" >> "$OUTPUT_FILE" 2>/dev/null || echo "(empty or not readable)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << 'EOF'

### Cloud SQL Connection

Check for Cloud SQL credentials:
- Connection string format: `PROJECT:REGION:INSTANCE`
- Database credentials
- SSL certificates (if used)

EOF

# Document apac-shorts-brain
cat >> "$OUTPUT_FILE" << 'EOF'

---

## apac-shorts-brain-v2

### Firebase Config
EOF

if [ -f "/Users/ivs/APAC-Shorts-Brain/.firebaserc" ]; then
    echo "```json" >> "$OUTPUT_FILE"
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

# Add instructions
# Add instructions template
cat "$BACKUP_DIR/.doc-template.txt" >> "$OUTPUT_FILE"

# Add timestamp and status
{
echo "**Last Updated:** $(date)"
echo "**Status:** Review and verify all credentials listed above"
} >> "$OUTPUT_FILE"


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
