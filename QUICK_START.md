# Quick Start: Phase 2 Backend Integration

**Status:** ✅ Code Complete - Ready for GCP Setup

---

## What's Done

✅ Vertex AI SDK installed
✅ Imagen 3 integration complete
✅ Veo integration complete
✅ Cloud Storage upload complete
✅ Documentation created

---

## What You Need to Do (5 Minutes)

### 1. Enable APIs (1 min)

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

### 2. Grant Permissions (1 min)

**Use Firebase default service account (easiest):**

```bash
gcloud projects add-iam-policy-binding v3-creative-engine \
  --member="serviceAccount:v3-creative-engine@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 3. Configure Functions (1 min)

```bash
firebase functions:config:set vertex.project_id="v3-creative-engine"
```

### 4. Deploy (2 min)

```bash
firebase deploy --only functions
```

### 5. Test (30 sec)

Open your app and create an image/video job!

---

## Cost

~$18/month for 100 generations (50 images + 50 videos)

Set budget alerts: https://console.cloud.google.com/billing/budgets

---

## Questions?

1. **What's my GCP project ID?**
   → Run: `gcloud config get-value project`

2. **How do I check if it's working?**
   → Watch logs: `firebase functions:log --follow`
   → Look for: `[VertexAI] Initialized with project: ...`

3. **What if I get errors?**
   → See `/docs/VERTEX_AI_SETUP.md` for troubleshooting

4. **Can I test without GCP setup?**
   → Yes! Deploy now, it will use placeholders until you configure GCP

---

## Files Changed

- `/functions/src/gemini.js` - Vertex AI integration
- `/functions/src/jobProcessor.js` - Storage upload
- `/functions/package.json` - New dependencies

---

## Documentation

- **Full Setup Guide:** `/docs/VERTEX_AI_SETUP.md`
- **Implementation Details:** `/docs/IMPLEMENTATION_SUMMARY.md`
- **Complete Summary:** `/PHASE2_BACKEND_COMPLETE.md`

---

## Ready to Deploy!

```bash
cd /Users/ivs/v3-creative-engine
firebase deploy --only functions
```

**Marco** - Backend Specialist 🚀
