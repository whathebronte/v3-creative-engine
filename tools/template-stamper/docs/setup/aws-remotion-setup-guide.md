# AWS & Remotion Lambda Setup Guide

**Project:** Template Stamper
**Purpose:** Complete Option B - Set up AWS and Remotion Lambda for video rendering
**Estimated Time:** 30-60 minutes

---

## Overview

This guide walks you through setting up AWS and deploying Remotion Lambda for Template Stamper's video rendering pipeline. Once complete, the system will be able to render videos in 1-2 minutes using AWS Lambda.

**What You'll Set Up:**
- AWS account (if needed)
- IAM user with programmatic access
- AWS credentials configuration
- Remotion Lambda deployment

---

## Prerequisites

- [ ] AWS account (or ability to create one)
- [ ] Credit card for AWS (free tier available, ~$10/month expected cost)
- [ ] Terminal access
- [ ] Template Stamper repository cloned

---

## Step 1: AWS Account Setup

### 1.1 Create or Access AWS Account

**If you already have an AWS account:**
- Skip to Step 1.2

**If you need to create an account:**

1. Visit https://aws.amazon.com
2. Click **"Create an AWS Account"**
3. Fill in:
   - Email address
   - Password
   - AWS account name (e.g., "Template Stamper")
4. Choose **Personal** account type
5. Enter billing information (credit card required)
6. Verify your phone number
7. Select **Basic Support - Free** plan
8. Complete sign-up

**Expected time:** 10-15 minutes

### 1.2 Sign in to AWS Console

1. Go to https://console.aws.amazon.com
2. Sign in with root account or IAM user

---

## Step 2: Create IAM User for Remotion

**Why IAM User?**
Using an IAM user (not root account) is a security best practice. This user will have programmatic access for Remotion Lambda.

### 2.1 Navigate to IAM

1. In AWS Console, search for **"IAM"** in the top search bar
2. Click **"IAM"** (Identity and Access Management)

### 2.2 Create New User

1. In left sidebar, click **"Users"**
2. Click **"Create user"** button (orange)
3. **User details:**
   - User name: `remotion-lambda`
   - ✅ Check: **"Provide user access to the AWS Management Console - optional"** (optional)
   - Click **"Next"**

### 2.3 Set Permissions

**Choose:** "Attach policies directly"

**Select these policies:**
- ✅ **AWSLambda_FullAccess**
- ✅ **AmazonS3FullAccess**
- ✅ **IAMFullAccess** (needed for Remotion to create roles)
- ✅ **CloudWatchLogsFullAccess** (for logging)

**Search and select each policy, then click "Next"**

### 2.4 Review and Create

1. Review the user details
2. Click **"Create user"**
3. ✅ User created successfully!

---

## Step 3: Get Access Keys

### 3.1 Create Access Key

1. Click on the newly created user: `remotion-lambda`
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"** section
4. Click **"Create access key"**

### 3.2 Choose Use Case

Select: **"Command Line Interface (CLI)"**
- ✅ Check the confirmation box
- Click **"Next"**

### 3.3 Add Description (Optional)

- Description tag: "Template Stamper Remotion Lambda"
- Click **"Create access key"**

### 3.4 **IMPORTANT: Save Your Credentials**

You will see:
```
Access key ID: AKIAXXXXXXXXXXXXXXXX
Secret access key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ CRITICAL:**
- **Download .csv file** (click "Download .csv file" button)
- **Copy both keys** to a secure location
- **You cannot view the secret key again after leaving this page**

**Save these for Step 4!**

Click **"Done"** when you've saved them.

---

## Step 4: Configure AWS Credentials in Project

### 4.1 Add Credentials to .env File

Open `/Users/ivs/template-stamper/.env` and add:

```bash
# AWS Configuration (from IAM user access keys)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# Remotion Lambda Configuration
REMOTION_FUNCTION_NAME=remotion-render-main
REMOTION_REGION=us-east-1
```

**Replace the X's with your actual credentials from Step 3.4**

### 4.2 Verify .env is in .gitignore

Check that `.gitignore` includes `.env`:

```bash
cat /Users/ivs/template-stamper/.gitignore | grep ".env"
```

You should see:
```
.env
.env.local
.env.*.local
```

✅ This ensures your credentials are never committed to git.

### 4.3 Configure AWS CLI (Optional but Recommended)

If you don't have AWS CLI installed:

```bash
# Install AWS CLI (macOS)
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

Configure AWS CLI:

```bash
aws configure
```

Enter:
- **AWS Access Key ID:** [Your access key from Step 3.4]
- **AWS Secret Access Key:** [Your secret key from Step 3.4]
- **Default region name:** `us-east-1`
- **Default output format:** `json`

This saves credentials to `~/.aws/credentials` (separate from project .env).

---

## Step 5: Install Remotion Lambda

### 5.1 Install Remotion CLI Globally

```bash
npm install -g remotion
```

**Verify installation:**
```bash
remotion --version
```

Should output version number (e.g., `4.0.x`)

### 5.2 Install @remotion/lambda Package

```bash
cd /Users/ivs/template-stamper/functions
npm install @remotion/lambda
```

This adds Remotion Lambda SDK to your Firebase Functions.

---

## Step 6: Enable Lambda Region

Remotion Lambda needs to enable the region you want to use.

```bash
npx remotion lambda regions enable us-east-1
```

**You should see:**
```
✅ Region us-east-1 enabled successfully
```

**Why us-east-1?**
- Fastest, most reliable AWS region
- Closest to Firebase (better for asset transfer)
- Lowest costs

---

## Step 7: Deploy Remotion Lambda Function

### 7.1 Deploy Function to AWS

```bash
npx remotion lambda functions deploy
```

**This will:**
1. Create a Lambda function in your AWS account
2. Upload Remotion runtime code
3. Configure execution role and permissions
4. Set up CloudWatch logging

**Expected output:**
```
Deploying Remotion Lambda function...
✅ Function deployed: remotion-render-main
✅ Function ARN: arn:aws:lambda:us-east-1:123456789012:function:remotion-render-main
✅ Memory: 2048 MB
✅ Timeout: 900 seconds (15 minutes)
```

**This takes 2-3 minutes.**

### 7.2 Verify Deployment

Check in AWS Console:
1. Go to **Lambda** service in AWS Console
2. You should see function: `remotion-render-main`
3. Click on it to view details

---

## Step 8: Test Remotion Lambda

### 8.1 Create a Simple Test Template

Create `/Users/ivs/template-stamper/templates/test-template`:

```bash
mkdir -p /Users/ivs/template-stamper/templates/test-template
cd /Users/ivs/template-stamper/templates/test-template
npm init -y
npm install react remotion
```

Create `src/index.tsx`:

```tsx
import { Composition } from 'remotion';
import { TestVideo } from './TestVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TestVideo"
      component={TestVideo}
      durationInFrames={120}
      fps={24}
      width={720}
      height={1280}
    />
  );
};
```

Create `src/TestVideo.tsx`:

```tsx
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const TestVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1 style={{ color: '#ef4444', fontSize: 48 }}>
        Template Stamper Test
      </h1>
      <p style={{ color: 'white', fontSize: 24 }}>
        Frame: {frame}
      </p>
    </AbsoluteFill>
  );
};
```

### 8.2 Deploy Test Template to Lambda

```bash
cd /Users/ivs/template-stamper/templates/test-template
npx remotion lambda sites create src/index.tsx --site-name=test-template
```

**Expected output:**
```
✅ Site deployed to S3
✅ URL: https://remotion-lambda-xyz.s3.amazonaws.com/sites/test-template
✅ Site ID: test-template-abc123
```

**Save the Site ID for testing.**

### 8.3 Trigger Test Render

```bash
npx remotion lambda render test-template-abc123 TestVideo
```

**This will:**
1. Trigger Lambda render
2. Show progress (0-100%)
3. Upload video to S3
4. Provide download URL

**Expected output:**
```
Rendering TestVideo...
Progress: 100%
✅ Video rendered successfully!
✅ S3 URL: https://remotion-renders-xyz.s3.amazonaws.com/renders/test-video.mp4
✅ Render time: 23 seconds
```

**Download and view the test video to verify it works!**

---

## Step 9: Configure Firebase Functions with Remotion

Now that Remotion Lambda is deployed, integrate it with Firebase Functions.

### 9.1 Update triggerRender.ts

I'll implement the Remotion Lambda integration in the next step.

**File:** `/Users/ivs/template-stamper/functions/src/jobs/triggerRender.ts`

### 9.2 Update renderComplete.ts

I'll implement the S3 to Firebase Storage transfer.

**File:** `/Users/ivs/template-stamper/functions/src/jobs/renderComplete.ts`

---

## Step 10: Verify Setup

### Checklist

- [ ] AWS account created/accessed
- [ ] IAM user `remotion-lambda` created
- [ ] Access keys saved securely
- [ ] AWS credentials added to `.env` file
- [ ] Remotion CLI installed globally
- [ ] @remotion/lambda package installed in functions
- [ ] Lambda region `us-east-1` enabled
- [ ] Remotion Lambda function deployed to AWS
- [ ] Test template deployed and rendered successfully

If all checked ✅, you're ready for Step 9-10!

---

## Costs & Billing

### Expected Monthly Costs

**For 64 videos/month (17 seconds each):**

| Service | Usage | Cost |
|---------|-------|------|
| Lambda Compute | ~2 mins per video × 64 = 128 mins | ~$2.50 |
| Lambda Invocations | 64 renders | ~$0.01 |
| S3 Storage (temp) | Minimal (files deleted after transfer) | ~$0.10 |
| S3 Data Transfer | Minimal (in-region) | ~$0.50 |
| CloudWatch Logs | 64 renders | ~$0.20 |
| **Total AWS** | | **~$3.50/month** |
| Firebase (Storage, Functions, etc.) | | **~$5/month** |
| **Grand Total** | | **~$8.50/month** |

**Free Tier (First 12 months):**
- Lambda: 1M requests + 400,000 GB-seconds free
- S3: 5GB storage + 20,000 GET requests free
- **Your usage likely stays within free tier!**

### Cost Monitoring

**Set up billing alerts:**
1. Go to **AWS Billing Dashboard**
2. Click **"Billing preferences"**
3. ✅ Enable: **"Receive Free Tier Usage Alerts"**
4. ✅ Enable: **"Receive Billing Alerts"**
5. Set alert threshold: **$10/month**

---

## Troubleshooting

### Issue: "Access Denied" Error

**Solution:**
- Verify IAM user has correct policies attached
- Check AWS credentials in `.env` are correct
- Run `aws sts get-caller-identity` to verify credentials work

### Issue: Lambda Function Not Found

**Solution:**
- Verify region is `us-east-1` in all configs
- Redeploy: `npx remotion lambda functions deploy --force`

### Issue: Render Takes Too Long (>5 minutes)

**Solution:**
- Check video length (should be ~17 seconds)
- Verify Lambda memory is 2048 MB or higher
- Check asset sizes (optimize large images/videos)

### Issue: Cost Exceeds Expected

**Solution:**
- Check for failed renders (you still get charged)
- Verify S3 lifecycle policies delete temp files
- Review CloudWatch logs for errors

---

## Security Best Practices

### ✅ Do's

- ✅ Use IAM user (not root account)
- ✅ Store credentials in `.env` (not in code)
- ✅ Keep `.env` in `.gitignore`
- ✅ Rotate access keys every 90 days
- ✅ Enable MFA on AWS account
- ✅ Review CloudWatch logs regularly

### ❌ Don'ts

- ❌ Never commit `.env` to git
- ❌ Never share AWS credentials publicly
- ❌ Don't use root account for daily operations
- ❌ Don't grant more permissions than needed

---

## Next Steps

Once this setup is complete:

1. ✅ I'll implement Remotion integration in Firebase Functions
2. ✅ Test end-to-end video generation pipeline
3. ✅ Deploy complete Phase 1 to Firebase
4. ✅ Move to Phase 2: Template Stamper App UI

**Total Phase 1 Progress After AWS Setup:** 100% 🎉

---

## Support Resources

**AWS Documentation:**
- IAM User Guide: https://docs.aws.amazon.com/IAM/latest/UserGuide/
- Lambda Documentation: https://docs.aws.amazon.com/lambda/

**Remotion Documentation:**
- Remotion Lambda: https://www.remotion.dev/docs/lambda
- Getting Started: https://www.remotion.dev/docs/lambda/setup

**If You Get Stuck:**
- AWS Support: https://console.aws.amazon.com/support/
- Remotion Discord: https://remotion.dev/discord

---

**Created:** 2026-01-29
**Last Updated:** 2026-01-29
**Status:** Ready for execution
