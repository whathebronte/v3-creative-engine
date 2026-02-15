#!/bin/bash

# Template Stamper - Setup Daily Backup Script
# Run this once to install the automated daily backup at 10pm

set -e

PLIST_SOURCE="/Users/ivs/template-stamper/scripts/com.template-stamper.daily-backup.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.template-stamper.daily-backup.plist"

echo "=== Setting up Template Stamper Daily Backup ==="

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Copy plist to LaunchAgents
echo "Installing launch agent..."
cp "$PLIST_SOURCE" "$PLIST_DEST"

# Unload if already loaded (in case reinstalling)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load the launch agent
echo "Loading launch agent..."
launchctl load "$PLIST_DEST"

echo ""
echo "✅ Daily backup setup complete!"
echo ""
echo "The backup script will run daily at 10:00 PM (22:00)"
echo "Logs will be saved to: /Users/ivs/template-stamper/scripts/backup.log"
echo ""
echo "To check status: launchctl list | grep template-stamper"
echo "To uninstall: launchctl unload $PLIST_DEST && rm $PLIST_DEST"
echo "To run manually: /Users/ivs/template-stamper/scripts/daily-backup.sh"
