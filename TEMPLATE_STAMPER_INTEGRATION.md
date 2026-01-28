# Template Stamper Integration Guide

**Date:** January 28, 2026
**Status:** ✅ Ready for Template Stamper Development

## Overview

This document describes the MCP bridge from **YTM Creative Generator** to **Template Stamper** for transferring finalized creative assets (images and videos) to the branding/template application.

## Architecture

```
┌─────────────────────────┐
│  YTM Creative Generator │
│  - Generate Assets      │
│  - Save to Gallery      │
│  - Select Assets        │
└────────────┬────────────┘
             │ MCP Bridge
             │ (Firestore)
             ▼
┌─────────────────────────┐
│ template_stamper_       │
│ transfers (Collection)  │
│  - Pending Transfers    │
│  - Country-separated    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Template Stamper      │
│   - Apply Branding      │
│   - Create Final Asset  │
└─────────────────────────┘
```

## Features Implemented

### 1. Multi-Select Gallery
- ✅ Checkboxes on all gallery items
- ✅ Visual selection state (red border + glow)
- ✅ Selection persists while browsing
- ✅ Clear selection when switching countries

### 2. Send to Template Stamper Button
- ✅ Appears in gallery footer when assets selected
- ✅ Shows count of selected assets
- ✅ Styled with red gradient matching app theme

### 3. Transfer Confirmation Modal
- ✅ Shows list of selected assets
- ✅ Displays asset type (image/video), format, prompt preview
- ✅ Confirm/Cancel actions

### 4. Firestore Transfer Collection
- ✅ Creates documents in `template_stamper_transfers` collection
- ✅ Country-based separation (matches Creative Generator)
- ✅ Complete asset metadata included

### 5. Security
- ✅ Firestore rules allow create/read/update/delete
- ✅ Open access for now (Template Stamper needs to read)
- 🔒 TODO: Add authentication in production

## Firestore Schema

### Collection: `template_stamper_transfers`

```javascript
{
  // Auto-generated transfer ID
  id: "auto-generated-id",

  // Country/market this transfer belongs to
  country: "korea" | "japan" | "indonesia" | "india",

  // Array of assets to transfer
  assets: [
    {
      url: "https://storage.googleapis.com/.../image.jpg",
      type: "image" | "video",
      format: "jpeg" | "mp4",
      aspectRatio: "9:16" | "16:9" | "1:1" | "4:3",
      prompt: "Original generation prompt",
      assetId: "original-job-id",
      savedAt: timestamp
    },
    // ... more assets
  ],

  // Count of assets for quick reference
  assetCount: 3,

  // Transfer status
  status: "pending" | "processing" | "complete" | "error",

  // Timestamps
  createdAt: timestamp,
  processedAt: timestamp | null,

  // Template Stamper URL (will be set when app is built)
  templateStamperUrl: null | "https://..."
}
```

## User Flow

### From Creative Generator Side:

1. **User generates/uploads assets** → Saved to gallery
2. **User clicks checkboxes** → Assets added to selection
3. **"Send to Template Stamper" button appears** → Shows count
4. **User clicks button** → Confirmation modal opens
5. **User confirms** → Assets written to Firestore
6. **Success toast** → "3 asset(s) sent to Template Stamper queue"
7. **Selection cleared** → Ready for next batch

### From Template Stamper Side (To Be Built):

1. **Listen to Firestore** → Query `template_stamper_transfers` where `status == 'pending'` and `country == currentCountry`
2. **Display transfers** → Show pending asset batches
3. **User selects transfer** → Load assets into Template Stamper
4. **Apply branding** → Use templates specific to country
5. **Update status** → Mark transfer as 'complete'
6. **Output final asset** → Ready for publishing

## Template Stamper Integration Code

When building Template Stamper, use this code to read transfers:

```javascript
// Initialize Firebase (use same project: v3-creative-engine)
const firebaseConfig = {
  apiKey: "AIzaSyBwtQBAZ_IewB2TYCkew3ctzB4HMs9Gyn0",
  authDomain: "v3-creative-engine.firebaseapp.com",
  projectId: "v3-creative-engine",
  storageBucket: "v3-creative-engine.firebasestorage.app",
  messagingSenderId: "964100659393",
  appId: "1:964100659393:web:bc6aa41fce9a8770d55c40"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Listen for pending transfers for current country
let currentCountry = 'korea'; // Set based on user's country

db.collection('template_stamper_transfers')
  .where('country', '==', currentCountry)
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .onSnapshot((snapshot) => {
    const transfers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${transfers.length} pending transfers`);
    displayTransfers(transfers);
  });

// When processing a transfer
async function processTransfer(transferId) {
  const transferRef = db.collection('template_stamper_transfers').doc(transferId);

  // Update status to processing
  await transferRef.update({
    status: 'processing',
    processedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // ... apply branding logic ...

  // Mark as complete
  await transferRef.update({
    status: 'complete'
  });
}
```

## Asset Format Specifications

### Images
- **Format:** JPEG
- **Aspect Ratios:** 9:16, 16:9, 1:1, 4:3
- **Source:** Cloud Storage URLs (publicly accessible)

### Videos
- **Format:** MP4
- **Aspect Ratios:** 9:16, 16:9
- **Source:** Cloud Storage URLs (publicly accessible)
- **Note:** Generated via Gemini API Veo 3.1

## Country/Market Separation

Each country has its own:
- ✅ Gallery assets
- ✅ Transfer queue
- ✅ Templates (to be defined in Template Stamper)

**Countries:**
- 🇰🇷 Korea
- 🇯🇵 Japan
- 🇮🇩 Indonesia
- 🇮🇳 India

## Files Modified

### Frontend
- `public/index.html` - Added checkbox UI, button, modal
- `public/script.js` - Added selection logic, transfer functions
- `public/style.css` - Added checkbox, button, modal styles

### Backend
- `firestore.rules` - Added security rules for transfers collection
- `firestore.indexes.json` - Already has country indexes

## Testing the Integration

### 1. Test Transfer Creation

```bash
# Open Creative Generator
open https://v3-creative-engine.web.app/

# 1. Select a country (e.g., Korea)
# 2. Generate or upload some assets
# 3. Save them to gallery
# 4. Check the checkboxes
# 5. Click "Send to Template Stamper"
# 6. Confirm in modal
```

### 2. Verify in Firebase Console

```bash
# Open Firebase Console
open https://console.firebase.google.com/project/v3-creative-engine/firestore

# Navigate to: template_stamper_transfers collection
# You should see documents with:
# - country: "korea"
# - status: "pending"
# - assets: [array of assets]
```

### 3. Read from Template Stamper (Test Query)

```javascript
// Test in browser console
db.collection('template_stamper_transfers')
  .where('country', '==', 'korea')
  .where('status', '==', 'pending')
  .get()
  .then(snapshot => {
    console.log(`Found ${snapshot.size} pending transfers`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Transfer ${doc.id}:`, data.assetCount, 'assets');
    });
  });
```

## Next Steps

### For Template Stamper Development:

1. **Create Template Stamper App**
   - Use same Firebase project (v3-creative-engine)
   - Deploy to separate hosting site

2. **Read Transfers**
   - Query `template_stamper_transfers` collection
   - Filter by country and status

3. **Display Assets**
   - Show image/video previews
   - Group by transfer batch

4. **Apply Branding**
   - Country-specific templates
   - Overlay logos, text, borders
   - Export final branded assets

5. **Update Status**
   - Mark transfers as 'complete'
   - Track processing history

6. **Provide Template Stamper URL**
   - Once deployed, add URL to transfer documents
   - Optional: Direct link from Creative Generator

## Future Enhancements

- [ ] Add "Open in Template Stamper" button (once URL available)
- [ ] Show transfer history/status
- [ ] Add bulk selection (Select All)
- [ ] Add transfer preview before sending
- [ ] Add authentication & user-specific transfers
- [ ] Add transfer analytics/logging
- [ ] Add automatic cleanup of old transfers

## Support

For questions or issues:
- Check Firebase Console for transfer documents
- Review Firestore rules if permissions errors
- Verify country filters match exactly

---

**Status:** ✅ MCP Bridge Complete - Ready for Template Stamper Development
