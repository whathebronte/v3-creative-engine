# Firebase Configuration

**Project:** Template Stamper
**Firebase Project ID:** template-stamper-d7045
**Created:** 2026-01-28

---

## Firebase Console

**Project URL:** https://console.firebase.google.com/project/template-stamper-d7045

---

## Configuration Details

### Web App Configuration

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBJ5kJ1AcO1SqkFG4_7jKI_O0nT-Ia8zyk",
  authDomain: "template-stamper-d7045.firebaseapp.com",
  projectId: "template-stamper-d7045",
  storageBucket: "template-stamper-d7045.firebasestorage.app",
  messagingSenderId: "846225698038",
  appId: "1:846225698038:web:cc4f803bdb9e356a2450d7"
};
```

### Environment Variables

All sensitive configuration is stored in `.env` file (not committed to git).
See `.env.example` for template.

---

## Services Enabled

- [x] Firebase Hosting
- [x] Cloud Firestore
- [x] Cloud Storage
- [x] Cloud Functions
- [ ] Authentication (to be enabled in launch phase)
- [ ] Analytics (not needed)

---

## Firebase CLI Setup

### Initialize Firebase in Repository

```bash
cd /Users/ivs/template-stamper
firebase login
firebase use template-stamper-d7045
firebase init
```

### Select Services
- Hosting
- Functions
- Firestore
- Storage

---

## Storage Bucket Structure

```
gs://template-stamper-d7045.firebasestorage.app/
├── assets/
│   └── {jobId}/
│       ├── original/
│       └── preprocessed/
├── videos/
│   └── {jobId}/
│       └── output.mp4
├── templates/
│   └── {templateId}/
│       └── {version}/
└── temp/
```

---

## Firestore Collections

- `templates` - Template definitions
- `jobs` - Video generation jobs
- `assets` - Asset metadata

---

## Security

**IMPORTANT:** Never commit `.env` file to git. The `.gitignore` file is configured to exclude it.

API keys and configuration stored in:
- `.env` (local development) - NOT committed
- Firebase Console → Project Settings (production)
- GitHub Secrets (CI/CD) - to be configured

---

## Access Control

### Development Phase
- No authentication required
- Open access for testing

### Launch Phase
- Firebase Authentication enabled
- Role-based access control
- Security rules enforced

---

**Last Updated:** 2026-01-28
