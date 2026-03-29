# Multi-User/Multi-Tenancy Architecture Analysis

**Date:** January 19, 2026
**Applications:** YTM Creative Generator & YTM Agent Collective
**Requirement:** Support 4 concurrent country managers (Korea, Japan, India, Indonesia) with isolated data

---

## Executive Summary

⚠️ **CRITICAL FINDING:** Both applications currently **CANNOT safely support multiple users simultaneously** with proper data isolation.

### Current Status

| Application | Authentication | Data Isolation | Multi-User Ready |
|-------------|----------------|----------------|------------------|
| **Agent Collective** | ❌ None | ⚠️ Country-based only | ❌ **NO** |
| **Creative Generator** | ❌ None | ❌ None | ❌ **NO** |

### Key Issues

1. **No User Authentication** - Anyone can access and modify any country's data
2. **No Access Control** - Firestore rules allow all reads/writes
3. **Data Collision Risk** - Two managers for the same country will overwrite each other
4. **No Audit Trail** - Cannot track who made which changes
5. **Security Vulnerability** - All data is publicly accessible

---

## Detailed Analysis

### Agent Collective

#### Current Architecture

**Data Storage:**
- ✅ Protocols saved per country (`agent_markets/{country}`)
- ✅ Chat archives tagged with country (`chat_archives`)
- ✅ Knowledge files stored per country path (`knowledge/{country}/...`)
- ❌ NO user identification in any document
- ❌ NO user authentication required

**Session Management:**
- Country selection via dropdown (client-side only)
- No tracking of who is using which country
- Pure JavaScript state management
- Anyone can switch to any country at any time

**Multi-User Conflicts:**
```
Scenario: Two Korea managers use the app simultaneously

User 1 (Korea):
- Uploads protocol document
- Modifies marketing protocol
- Saves chat archive

User 2 (Korea):
- Also selects Korea from dropdown
- Modifies same marketing protocol
- OVERWRITES User 1's changes (last write wins)
- Both users see the SAME chat archives
- Cannot distinguish whose work is whose

RESULT: Data corruption and user confusion
```

**Security Rules (CRITICAL ISSUE):**
```javascript
// From firestore.rules
match /agent_markets/{marketId} {
  allow read: if true;   // ❌ ANYONE can read
  allow write: if true;  // ❌ ANYONE can write
}

match /chat_archives/{archiveId} {
  allow read: if true;   // ❌ ANYONE can read
  allow create: if true; // ❌ ANYONE can create
  allow delete: if true; // ❌ ANYONE can delete
}
```

#### What Happens With 4 Concurrent Users

```
9:00 AM - Korea Manager logs in → Selects Korea
9:00 AM - Japan Manager logs in → Selects Japan
9:05 AM - India Manager logs in → Selects India
9:10 AM - Indonesia Manager logs in → Selects Indonesia

✅ Each sees their country's protocols and files
✅ Each can work independently

BUT:

9:15 AM - Second Korea Manager joins → Also selects Korea
❌ Both Korea managers see SAME data
❌ No indication another user is active
❌ Both can edit protocols simultaneously
❌ Last save OVERWRITES previous changes
❌ Chat archives mix together
❌ NO WAY to distinguish users

CRITICAL FAILURE: Cannot support 2+ users per country
```

---

### Creative Generator

#### Current Architecture

**Data Storage:**
- ❌ Jobs collection has NO country field (all jobs global)
- ⚠️ Gallery collection has country field (but not enforced)
- ❌ NO user identification anywhere
- ❌ NO authentication required

**Session Management:**
- Country tabs for UI filtering (client-side only)
- All users receive ALL jobs via realtime listeners
- State is purely client-side
- No server-side country enforcement

**Multi-User Conflicts:**
```
Scenario: Four country managers use generator simultaneously

User 1 (Korea):
- Generates image → Job created in Firestore
- Job has NO country field
- ALL 4 users receive this job via realtime listener
- Appears in everyone's lightbox!

User 2 (Japan):
- Generates video at same time
- Also appears in ALL users' lightboxes

User 3 (India):
- Saves asset to gallery
- Tagged with "india" country
- BUT other users can see it if they switch tabs

RESULT: Complete chaos - everyone sees everyone's work
```

**Security Rules (CRITICAL ISSUE):**
```javascript
// From firestore.rules
match /jobs/{jobId} {
  allow read: if true;   // ❌ ANYONE can read ALL jobs
  allow create: if true; // ❌ ANYONE can create jobs
}

match /gallery/{galleryId} {
  allow read: if true;   // ❌ ANYONE can read ALL galleries
  allow delete: if true; // ❌ ANYONE can delete ANY asset
}
```

#### What Happens With 4 Concurrent Users

```
All 4 country managers generate content simultaneously:

Korea: Generates image "K-pop dance trend"
Japan: Generates video "Anime style tutorial"
India: Generates image "Bollywood remix"
Indonesia: Generates video "Jakarta street food"

Current Behavior:
❌ ALL 4 jobs appear in ALL users' lightboxes
❌ Cannot filter by "my jobs" vs "others' jobs"
❌ UI becomes cluttered with other countries' content
❌ Gallery shows all countries' work (despite tab selection)
❌ Anyone can delete anyone else's saved assets

CRITICAL FAILURE: Zero data isolation
```

---

## Required Changes for Multi-User Support

### Phase 1: Critical Fixes (MANDATORY)

#### 1. Add Firebase Authentication

**Goal:** Identify who is using the application

**Implementation:**
```javascript
// Add to both applications
async function initializeAuth() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      // Redirect to login page
      window.location.href = '/login.html';
      return;
    }

    // Get user's assigned country
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();

    state.userId = user.uid;
    state.userEmail = user.email;
    state.assignedCountry = userData.assignedCountry;

    // Initialize app with assigned country
    await initializeApp();
  });
}
```

**Create User Accounts:**
```bash
# Email/Password Authentication
korea@ytm.com → Assigned to "korea"
japan@ytm.com → Assigned to "japan"
india@ytm.com → Assigned to "india"
indonesia@ytm.com → Assigned to "indonesia"
```

#### 2. Create Users Collection

**New Firestore Collection:**
```javascript
// users collection structure
{
  "users": {
    "userId1": {
      "email": "korea@ytm.com",
      "assignedCountry": "korea",
      "role": "country_manager",
      "displayName": "Korea Marketing Team",
      "createdAt": "2026-01-19T10:00:00Z"
    },
    "userId2": {
      "email": "japan@ytm.com",
      "assignedCountry": "japan",
      "role": "country_manager",
      "displayName": "Japan Marketing Team",
      "createdAt": "2026-01-19T10:00:00Z"
    }
    // ... 2 more users
  }
}
```

#### 3. Update Database Schema

**Agent Collective Changes:**

```javascript
// agent_markets - ADD tracking fields
{
  "agent_markets/korea": {
    "marketingProtocol": "...",
    "creativeProtocol": "...",
    "knowledgeFiles": [...],
    "lastEditedBy": "userId1",           // NEW
    "lastEditedByEmail": "korea@ytm.com", // NEW
    "lastEditedAt": timestamp,           // NEW
    "updatedAt": timestamp
  }
}

// chat_archives - ADD user identification
{
  "chat_archives/archive123": {
    "market": "korea",
    "userId": "userId1",                 // NEW
    "userEmail": "korea@ytm.com",        // NEW
    "messages": [...],
    "savedAt": timestamp,
    "name": "Campaign Brief - Jan 19"
  }
}
```

**Creative Generator Changes:**

```javascript
// jobs - ADD country and user fields
{
  "jobs/job123": {
    "type": "image",
    "prompt": "K-pop dance trend",
    "format": "9:16",
    "country": "korea",                  // NEW - CRITICAL
    "userId": "userId1",                 // NEW
    "status": "complete",
    "result": { "url": "..." },
    "createdAt": timestamp
  }
}

// gallery - ADD userId field
{
  "gallery/gallery123": {
    "assetId": "job123",
    "url": "...",
    "country": "korea",
    "userId": "userId1",                 // NEW
    "userEmail": "korea@ytm.com",        // NEW
    "savedAt": timestamp
  }
}
```

#### 4. Update Firestore Security Rules

**New Rules (CRITICAL FOR SECURITY):**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================
    // Helper Functions
    // ========================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserCountry() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedCountry;
    }

    function hasCountryAccess(country) {
      return isAuthenticated() && getUserCountry() == country;
    }

    function isOwnResource() {
      return resource.data.userId == request.auth.uid;
    }

    // ========================================
    // Users Collection
    // ========================================

    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && request.auth.uid == userId;

      // Only admins can create/update users (via Cloud Functions)
      allow write: if false;
    }

    // ========================================
    // Jobs Collection (Creative Generator)
    // ========================================

    match /jobs/{jobId} {
      // Can ONLY read jobs from your assigned country
      allow read: if isAuthenticated() &&
                     resource.data.country == getUserCountry();

      // Can ONLY create jobs for your assigned country
      allow create: if isAuthenticated() &&
                       request.resource.data.country == getUserCountry() &&
                       request.resource.data.userId == request.auth.uid;

      // System updates only (Cloud Functions)
      allow update: if false;
      allow delete: if false;
    }

    // ========================================
    // Gallery Collection (Creative Generator)
    // ========================================

    match /gallery/{galleryId} {
      // Can ONLY read gallery items from your country
      allow read: if isAuthenticated() &&
                     resource.data.country == getUserCountry();

      // Can ONLY create gallery items for your country
      allow create: if isAuthenticated() &&
                      request.resource.data.country == getUserCountry() &&
                      request.resource.data.userId == request.auth.uid;

      // Can ONLY delete your own gallery items
      allow delete: if isAuthenticated() && isOwnResource();

      allow update: if false;
    }

    // ========================================
    // Agent Markets (Agent Collective)
    // ========================================

    match /agent_markets/{marketId} {
      // Can ONLY access your assigned market
      allow read: if hasCountryAccess(marketId);

      // Can ONLY write to your assigned market
      allow write: if hasCountryAccess(marketId) &&
                      request.resource.data.lastEditedBy == request.auth.uid;
    }

    // ========================================
    // Chat Archives (Agent Collective)
    // ========================================

    match /chat_archives/{archiveId} {
      // Can ONLY read archives from your country
      allow read: if isAuthenticated() &&
                     resource.data.market == getUserCountry();

      // Can ONLY create archives for your country
      allow create: if isAuthenticated() &&
                      request.resource.data.market == getUserCountry() &&
                      request.resource.data.userId == request.auth.uid;

      // Can ONLY delete your own archives
      allow delete: if isAuthenticated() && isOwnResource();

      allow update: if false;
    }

    // ========================================
    // Prompt Transfers (Agent Collective → Generator)
    // ========================================

    match /prompt_transfers/{transferId} {
      // Can ONLY read transfers for your country
      allow read: if isAuthenticated() &&
                     resource.data.market == getUserCountry();

      // Can ONLY create transfers for your country
      allow create: if isAuthenticated() &&
                      request.resource.data.market == getUserCountry();

      allow update, delete: if false;
    }
  }
}
```

#### 5. Update Client-Side Code

**Agent Collective - Key Changes:**

```javascript
// 1. Remove country dropdown selector
// 2. Use assigned country from user profile
// 3. Add userId to all writes

async function initializeApp() {
  // Get authenticated user
  const user = firebase.auth().currentUser;

  // Get user profile with assigned country
  const userDoc = await db.collection('users').doc(user.uid).get();
  const assignedCountry = userDoc.data().assignedCountry;

  // Set state
  state.currentMarket = assignedCountry;  // Not user-selectable!
  state.userId = user.uid;
  state.userEmail = user.email;

  // Load market data
  await loadMarketData();

  // Show assigned country (read-only)
  document.getElementById('assignedCountry').textContent =
    assignedCountry.toUpperCase();
}

// Update all writes to include userId
async function saveProtocol(agentType, protocol) {
  await db.collection('agent_markets').doc(state.currentMarket).set({
    [`${agentType}Protocol`]: protocol,
    lastEditedBy: state.userId,           // NEW
    lastEditedByEmail: state.userEmail,   // NEW
    lastEditedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function saveChatArchive() {
  await db.collection('chat_archives').add({
    market: state.currentMarket,
    userId: state.userId,                 // NEW
    userEmail: state.userEmail,           // NEW
    messages: state.currentChatMessages,
    savedAt: firebase.firestore.FieldValue.serverTimestamp(),
    name: generateArchiveName()
  });
}
```

**Creative Generator - Key Changes:**

```javascript
// 1. Remove country tabs
// 2. Use assigned country from user profile
// 3. Add country + userId to all jobs

async function initializeApp() {
  const user = firebase.auth().currentUser;
  const userDoc = await db.collection('users').doc(user.uid).get();
  const assignedCountry = userDoc.data().assignedCountry;

  state.currentCountry = assignedCountry;  // Not user-selectable!
  state.userId = user.uid;

  // Hide country tabs
  document.querySelector('.country-tabs').style.display = 'none';

  // Show assigned country
  document.getElementById('assignedCountry').textContent =
    assignedCountry.toUpperCase();

  setupRealtimeListeners();
}

// Update job creation
async function generateImage() {
  const jobData = {
    type: 'image',
    prompt: state.currentPrompt,
    format: state.currentAspectRatio,
    country: state.currentCountry,        // NEW - CRITICAL
    userId: state.userId,                 // NEW
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const result = await createTestJobFn(jobData);
}

// Update realtime listeners to filter by country
function setupRealtimeListeners() {
  // Jobs - ONLY from my assigned country
  db.collection('jobs')
    .where('country', '==', state.currentCountry)  // NEW - CRITICAL
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot((snapshot) => {
      state.allJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateJobsUI();
    });

  // Gallery - ONLY from my assigned country
  db.collection('gallery')
    .where('country', '==', state.currentCountry)  // NEW - CRITICAL
    .orderBy('savedAt', 'desc')
    .limit(50)
    .onSnapshot((snapshot) => {
      state.savedGallery = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderGallery();
    });
}
```

---

## Migration Steps

### Step 1: Enable Firebase Authentication

1. Go to Firebase Console → Authentication
2. Enable Email/Password sign-in method
3. Create 4 user accounts:

```javascript
// Via Firebase Console or Admin SDK
{
  email: "korea@ytm.com",
  password: "SecurePassword123!"
}
{
  email: "japan@ytm.com",
  password: "SecurePassword123!"
}
{
  email: "india@ytm.com",
  password: "SecurePassword123!"
}
{
  email: "indonesia@ytm.com",
  password: "SecurePassword123!"
}
```

### Step 2: Create Users Collection

```javascript
// Run this script once to create user profiles
const users = [
  { email: 'korea@ytm.com', country: 'korea' },
  { email: 'japan@ytm.com', country: 'japan' },
  { email: 'india@ytm.com', country: 'india' },
  { email: 'indonesia@ytm.com', country: 'indonesia' }
];

for (const user of users) {
  const authUser = await firebase.auth().getUserByEmail(user.email);

  await db.collection('users').doc(authUser.uid).set({
    email: user.email,
    assignedCountry: user.country,
    role: 'country_manager',
    displayName: `${user.country.toUpperCase()} Marketing Team`,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
```

### Step 3: Migrate Existing Data

```javascript
// Add country field to all existing jobs
const jobs = await db.collection('jobs').get();
const batch = db.batch();

jobs.forEach(doc => {
  // You'll need to manually assign countries to existing jobs
  // or delete old jobs
  batch.update(doc.ref, {
    country: 'korea',  // Assign based on your records
    userId: 'unknown'  // Or delete these jobs
  });
});

await batch.commit();
```

### Step 4: Deploy Security Rules

```bash
# Test rules in Firebase Console first!
firebase deploy --only firestore:rules
```

### Step 5: Update Client Code

1. Add authentication initialization to both apps
2. Remove country selectors from UI
3. Update all database writes to include userId
4. Update all queries to filter by country
5. Add logout button

### Step 6: Create Login Page

```html
<!-- /login.html -->
<!DOCTYPE html>
<html>
<head>
  <title>YTM Login</title>
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
</head>
<body>
  <div class="login-container">
    <h1>YTM Creative Platform</h1>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </div>

  <script src="https://www.gstatic.com/firebasejs/9.x/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.x/firebase-auth-compat.js"></script>
  <script>
    // Initialize Firebase
    firebase.initializeApp({ /* config */ });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // Redirect to app
        window.location.href = '/';
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  </script>
</body>
</html>
```

### Step 7: Testing Plan

**Test Matrix:**

| Test | User 1 | User 2 | Expected Result |
|------|--------|--------|-----------------|
| Simultaneous login | Korea | Japan | ✅ Both login successfully |
| Data visibility | Korea | Japan | ✅ Each sees only their country's data |
| Job creation | Korea generates image | Japan generates video | ✅ Neither sees the other's job |
| Gallery save | Korea saves asset | Japan saves asset | ✅ Assets saved to correct country |
| Protocol edit | Korea edits protocol | Japan edits protocol | ✅ Changes isolated per country |
| Cross-country access | Korea tries to read Japan data | - | ❌ Firestore denies access |
| Logout/Login | Korea logs out, Japan logs in | - | ✅ Japan gets Japan data only |
| Concurrent same country | Korea user 1 | Korea user 2 | ⚠️ Both can edit (Phase 2 needed for lock detection) |

---

## Timeline & Effort Estimate

### Phase 1: Critical Fixes (REQUIRED)

**Week 1: Authentication & User Management**
- Day 1-2: Enable Firebase Auth, create user accounts
- Day 3: Build login page
- Day 4-5: Add auth initialization to both apps

**Week 2: Database Schema Updates**
- Day 1-2: Create users collection, migrate data
- Day 3: Update Agent Collective schema
- Day 4-5: Update Creative Generator schema

**Week 3: Security & Code Updates**
- Day 1-2: Write and test Firestore security rules
- Day 3-4: Update Agent Collective client code
- Day 5: Update Creative Generator client code

**Week 4: Testing & Deployment**
- Day 1-3: Test all scenarios with 4 users
- Day 4: Fix any bugs found
- Day 5: Deploy to production

**Total: 4 weeks full-time development**

### Phase 2: Enhanced Features (Optional)

**Week 5: Advanced Features**
- Concurrent edit detection
- Activity audit logging
- Quota management
- Presence indicators

**Total: 1 additional week**

---

## Cost Estimate

### Development Costs
- **Phase 1 (Critical):** 4 weeks × $X/hour = $X
- **Phase 2 (Enhanced):** 1 week × $X/hour = $X

### Firebase Costs (Monthly)
- **Authentication:** Free (4 users)
- **Firestore:**
  - Reads: ~50K/month → ~$0.15
  - Writes: ~10K/month → ~$0.18
  - Storage: ~1GB → ~$0.18
- **Storage:**
  - Files: ~10GB → ~$0.026
  - Downloads: ~10GB → ~$0.12
- **Cloud Functions:**
  - Invocations: ~50K/month → ~$0.20
  - Compute: ~10GB-seconds → ~$0.40

**Total Firebase Costs: ~$1.30/month** (for 4 users, light usage)

---

## Risk Assessment

### Without Fixes (Current State)

| Risk | Likelihood | Impact | Severity |
|------|------------|--------|----------|
| Data corruption from concurrent edits | 🔴 HIGH | 🔴 CRITICAL | 🔴 SEVERE |
| Accidental deletion of other countries' work | 🟡 MEDIUM | 🔴 CRITICAL | 🔴 SEVERE |
| Privacy breach (seeing other countries' data) | 🔴 HIGH | 🔴 HIGH | 🔴 SEVERE |
| Lost work due to overwrites | 🔴 HIGH | 🟡 MEDIUM | 🔴 HIGH |
| Confusion about data ownership | 🔴 HIGH | 🟡 MEDIUM | 🟡 MEDIUM |

### With Phase 1 Fixes

| Risk | Likelihood | Impact | Severity |
|------|------------|--------|----------|
| Data corruption | 🟢 LOW | 🟡 MEDIUM | 🟢 LOW |
| Privacy breach | 🟢 VERY LOW | 🔴 HIGH | 🟢 LOW |
| Lost work | 🟢 LOW | 🟡 MEDIUM | 🟢 LOW |
| Concurrent same-country edits | 🟡 MEDIUM | 🟡 MEDIUM | 🟡 MEDIUM |

### With Phase 2 Enhancements

| Risk | Likelihood | Impact | Severity |
|------|------------|--------|----------|
| Any data issues | 🟢 VERY LOW | 🟢 LOW | 🟢 VERY LOW |

---

## Recommendation

### Immediate Action Required

🚨 **DO NOT deploy these applications for multi-user use in their current state.**

The applications **WILL NOT WORK SAFELY** for 4 country managers without the Phase 1 fixes. Data corruption, overwrites, and privacy breaches are **GUARANTEED** to occur.

### Required Path Forward

1. **Allocate 4 weeks for Phase 1 development**
2. **Budget ~$15,000-25,000 for implementation** (depending on developer rates)
3. **Plan for thorough testing before launch**
4. **Consider Phase 2 enhancements** for production-grade deployment

### Alternative Options

If timeline/budget is constrained:

**Option A: Single-User Mode**
- Deploy to ONE country manager at a time
- Manual coordination between countries
- No development needed
- **Risk:** Inefficient, manual process

**Option B: Separate Deployments**
- Deploy 4 separate Firebase projects (one per country)
- korea.ytm.com, japan.ytm.com, etc.
- Requires 4× hosting costs
- **Risk:** Code duplication, maintenance burden

**Option C: Proceed with Phase 1 fixes (RECOMMENDED)**
- Proper multi-tenancy architecture
- Secure, scalable, production-ready
- One-time investment for long-term benefit

---

## Conclusion

Both YTM applications require **significant architectural changes** to support 4 concurrent country managers with proper data isolation. The Phase 1 fixes are **mandatory** for safe deployment. Without them, data corruption and security breaches are inevitable.

**Estimated Timeline:** 4 weeks
**Recommended Budget:** $15,000-25,000
**Firebase Costs:** ~$1-2/month

**Next Steps:**
1. Review this analysis with stakeholders
2. Approve budget and timeline
3. Begin Phase 1 implementation
4. Test thoroughly before production launch

---

**Document Version:** 1.0
**Last Updated:** January 19, 2026
**Prepared By:** Claude Code Analysis
**Contact:** [Your contact information]
