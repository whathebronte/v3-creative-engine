# Vertex AI Quota Increase Guide

## Issue Identified

Your Vertex AI API is **correctly enabled and working**, but you're hitting the default quota limit:

```
Error: Quota exceeded for aiplatform.googleapis.com/generate_content_requests_per_minute_per_project_per_base_model
with base model: imagen-3.0-generate
```

This means the API is working, but you need to request higher quotas to generate images.

## Current Status

✅ Vertex AI API is enabled
✅ Billing is enabled
✅ IAM permissions are correct
✅ Code is calling the API successfully
❌ Quota limit is too low (0 or very low default)

## Solution: Request Quota Increase

### Step 1: Access Quotas Page

Visit the Vertex AI quotas page:
https://console.cloud.google.com/iam-admin/quotas?project=v3-creative-engine&pageState=(%22allQuotasTable%22:(%22f%22:%22%255B%257B_22k_22_3A_22Service_22_2C_22t_22_3A13_2C_22v_22_3A_22_5C_22Vertex%2520AI%2520API_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22aiplatform.googleapis.com_22%257D%255D%22))

Or manually:
1. Go to: https://console.cloud.google.com/iam-admin/quotas?project=v3-creative-engine
2. Filter by service: "Vertex AI API"

### Step 2: Find Imagen Quotas

Look for these specific quotas:

1. **Generate content requests per minute per project per base model**
   - Current: 0 or very low
   - Needed: At least 60 (1 request per second)

2. **Online prediction requests per base model per minute per region**
   - Current: May be 0
   - Needed: At least 60

### Step 3: Request Quota Increase

For each quota:

1. **Check the checkbox** next to the quota name
2. Click **"EDIT QUOTAS"** button at the top
3. In the form that appears:
   - **New limit**: Enter **60** (for 60 requests per minute)
   - **Request description**:
     ```
     Requesting quota increase for Imagen 3 image generation for YTM Creative Generator project.
     Need to generate marketing visuals for YouTube Music campaigns.
     Estimated usage: 5-10 generations per hour during testing, up to 100/day during active use.
     ```
4. Click **"NEXT"**
5. Verify your contact information
6. Click **"SUBMIT REQUEST"**

### Step 4: Alternative - Request via Direct Link

Use this direct link to request "Generate content requests" quota:

https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=v3-creative-engine

Then:
1. Search for: "generate_content_requests_per_minute"
2. Click on the quota
3. Click "EDIT QUOTA"
4. Request increase to **60**

### Step 5: Wait for Approval

- **Approval time**: Usually 1-2 business days, sometimes instant
- **Check status**: You'll receive an email when approved
- **Track request**: https://console.cloud.google.com/iam-admin/quotas?project=v3-creative-engine

## Temporary Workaround

While waiting for quota approval, the system is already set up to:
- ✅ Automatically fall back to placeholder images
- ✅ Mark jobs as complete so the UI still works
- ✅ Log the error for debugging

So you can still test the full workflow with placeholders!

## What to Request

**Recommended Quotas for Testing:**

| Quota Name | Current | Request | Reason |
|------------|---------|---------|--------|
| Generate content requests per minute per base model | 0 | 60 | 1 request/second for testing |
| Online prediction requests per minute | 0 | 60 | API rate limit |

**For Production (Request Later):**

| Quota Name | Request | Reason |
|------------|---------|--------|
| Generate content requests per minute | 300 | 5 requests/second |
| Daily requests | 10,000 | Support full day usage |

## Testing After Approval

Once approved:

1. **Wait 5-10 minutes** for quota to propagate
2. **Test with simple prompt**:
   - Open: https://v3-creative-engine.web.app/
   - Enter: "A sunset over mountains"
   - Click "Generate 1"
3. **Monitor logs**: `firebase functions:log --only processJob`
4. **Look for**: "VertexAI Initialized" and successful generation (no 429 error)

## Expected Success Log

When quota is approved, you should see:

```
[VertexAI] Initialized with project: v3-creative-engine, location: us-central1
[VertexAI] Generating image with Imagen 3: "your prompt"
[VertexAI] Request parameters: {...}
[JobProcessor] Uploading image to Cloud Storage
[JobProcessor] Job completed in ~30000ms
```

## Common Questions

**Q: How much does quota increase cost?**
A: Quota increase is free. You only pay for actual API usage (~$0.02-0.04 per image).

**Q: Can I get instant approval?**
A: Sometimes yes, especially for small increases. Try requesting 60 first, may be instant.

**Q: What if request is denied?**
A: Very rare for reasonable requests. If denied, reduce requested amount or provide more project details.

**Q: How do I check current quota?**
A: Visit: https://console.cloud.google.com/iam-admin/quotas?project=v3-creative-engine
Filter for "Vertex AI API" and "imagen"

## Alternative: Use Different Model

If quota approval takes too long, you could also try:

1. **Imagen 2** (may have different quota)
2. **Different region** (try `us-west1` or `europe-west4`)
3. **Different Google Cloud project** (fresh project may have different defaults)

But the recommended approach is to request quota increase for your current setup.

---

**Next Steps:**
1. Request quota increase (steps above)
2. Wait for approval (1-2 days typically)
3. Test generation
4. Start creating actual marketing visuals!

Your setup is perfect - you just need Google to approve the quota increase!
