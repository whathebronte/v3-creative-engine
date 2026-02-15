# Phase 2: Template Stamper App - Implementation Plan

**Created:** 2026-01-29
**Status:** Ready for Prioritization
**Estimated Total Time:** 10-12 days

---

## Overview

Phase 2 transforms Template Stamper from infrastructure to a fully functional web application with a polished UI based on Agent Collective design system. This plan breaks down the work into prioritized, modular components.

---

## Module Breakdown

### 🎨 Module 1: Core UI Components (FOUNDATION)
**Priority:** 🔴 **CRITICAL** - Required for all other modules
**Estimated Time:** 1.5 days
**Dependencies:** None

#### What It Delivers:
- Reusable component library matching Agent Collective design
- Consistent UI elements across the entire app
- Foundation for rapid feature development

#### Components to Build:
```
/src/components/ui/
├── Button.tsx              # Primary, secondary variants
├── Card.tsx                # Panel/card container
├── StatusIndicator.tsx     # Online/offline/status dots
├── ToggleSwitch.tsx        # Enable/disable toggles
├── Select.tsx              # Dropdown selects
├── UploadArea.tsx          # Drag-drop upload zone
├── ListItem.tsx            # List items with icons
├── ProgressBar.tsx         # Progress indicators
├── Input.tsx               # Text inputs
└── Badge.tsx               # Status badges
```

#### Acceptance Criteria:
- [ ] All components match Agent Collective visual design
- [ ] TypeScript interfaces for all props
- [ ] Dark theme with red accents
- [ ] Hover states and transitions
- [ ] Accessible (ARIA labels, keyboard navigation)

---

### 📐 Module 2: Three-Column Layout (FOUNDATION)
**Priority:** 🔴 **CRITICAL** - Required for all pages
**Estimated Time:** 1 day
**Dependencies:** Module 1

#### What It Delivers:
- App-wide three-column layout structure
- Responsive breakpoints
- Navigation system
- Header with branding

#### Files to Create/Update:
```
/src/layouts/
├── AppLayout.tsx           # Main three-column grid
├── LeftSidebar.tsx         # Control panel sidebar
├── MainContent.tsx         # Center content area
└── RightSidebar.tsx        # Info/setup sidebar

/src/components/
├── Header.tsx              # Top navigation bar
└── Navigation.tsx          # Nav links
```

#### Layout Structure:
```
┌─────────────────────────────────────────────────┐
│  Header (Full Width)                            │
├─────────┬───────────────────────┬───────────────┤
│ Left    │  Main Content         │ Right Sidebar │
│ Sidebar │  (Flexible)           │ (300-350px)   │
│ (250px) │                       │               │
└─────────┴───────────────────────┴───────────────┘
```

#### Acceptance Criteria:
- [ ] Three-column grid working on desktop
- [ ] Responsive collapse on mobile/tablet
- [ ] Header with logo and "Open YTM" button
- [ ] Smooth transitions between pages

---

### 📚 Module 3: Template Gallery Page
**Priority:** 🟡 **HIGH** - Core feature for template selection
**Estimated Time:** 2 days
**Dependencies:** Modules 1, 2

#### What It Delivers:
- Browse all available templates
- Template cards with preview images
- Real-time data from Firestore
- Template details view
- Search and filter

#### Features:
1. **Template Gallery View:**
   - Grid of template cards
   - Preview thumbnail
   - Template name, version, duration
   - Slot count indicator
   - Active/inactive status

2. **Template Detail Modal:**
   - Full template information
   - List of content slots
   - Preview video (if available)
   - "Use Template" button

3. **Firestore Integration:**
   - Real-time listener on `templates` collection
   - Filter by status (active only)
   - Sort by creation date

#### Files to Create:
```
/src/pages/
└── TemplatesPage.tsx       # Main gallery view

/src/components/templates/
├── TemplateCard.tsx        # Individual template card
├── TemplateDetail.tsx      # Modal with full details
├── TemplateGrid.tsx        # Grid layout
└── TemplateSearch.tsx      # Search/filter bar

/src/hooks/
└── useTemplates.ts         # Firestore hook for templates
```

#### Acceptance Criteria:
- [ ] Display all active templates from Firestore
- [ ] Real-time updates when templates added/removed
- [ ] Click template to view details
- [ ] "Use Template" button navigates to Generate page
- [ ] Empty state when no templates available

---

### 🎬 Module 4: Video Generation Page
**Priority:** 🔴 **CRITICAL** - Core user workflow
**Estimated Time:** 3 days
**Dependencies:** Modules 1, 2, 3

#### What It Delivers:
- Complete video generation workflow
- Asset upload and slot mapping
- Job creation and submission
- Real-time generation progress

#### Features:

**Left Sidebar:**
- Market selector dropdown (Japan, Korea, etc.)
- Active template display
- Clear/reset button

**Main Content:**
1. **Template Selection State:**
   - "Select a template to begin" prompt
   - Quick access to Template Gallery

2. **Asset Upload State:**
   - Drag-drop upload areas for each slot
   - Preview uploaded assets
   - Slot labeling (gridImage1, gridImage2, etc.)
   - File validation (JPEG/MPEG, 100MB limit)

3. **Ready to Generate State:**
   - Review all mapped assets
   - Template preview
   - "Generate Video" button

4. **Generating State:**
   - Progress indicator
   - Status updates (Queued → Preprocessing → Rendering → Complete)
   - Estimated time remaining

**Right Sidebar:**
- Template info
- Slot requirements
- Asset guidelines

#### Files to Create:
```
/src/pages/
└── GeneratePage.tsx        # Main generation workflow

/src/components/generate/
├── TemplateSelector.tsx    # Select template UI
├── AssetUploader.tsx       # Drag-drop uploader
├── AssetSlotMapper.tsx     # Map assets to slots
├── AssetPreview.tsx        # Preview uploaded assets
├── GenerateButton.tsx      # Submit job button
└── GenerationProgress.tsx  # Progress tracking

/src/hooks/
├── useAssetUpload.ts       # Handle file uploads
├── useJobCreate.ts         # Create jobs via API
└── useJobStatus.ts         # Track job progress
```

#### Acceptance Criteria:
- [ ] Select template from gallery
- [ ] Upload assets via drag-drop or click
- [ ] Map assets to template slots
- [ ] Validate asset types and sizes
- [ ] Create job in Firestore
- [ ] Track generation progress in real-time
- [ ] Display success/error messages

---

### 📊 Module 5: Job Dashboard Page
**Priority:** 🟡 **HIGH** - User needs to track and download videos
**Estimated Time:** 2 days
**Dependencies:** Modules 1, 2

#### What It Delivers:
- View all job history
- Real-time job status updates
- Download completed videos
- Retry failed jobs
- Filter and search jobs

#### Features:

**Job List:**
- Table view with columns:
  - Job ID
  - Template name
  - Status (badge with color)
  - Created date
  - Progress (%)
  - Actions (download, retry, delete)

**Job Status Colors:**
- 🟡 Queued: Yellow
- 🔵 Preprocessing: Blue
- 🟣 Rendering: Purple
- 🟢 Completed: Green
- 🔴 Failed: Red

**Filters:**
- All jobs
- Completed only
- Failed only
- In Progress

**Real-time Updates:**
- Firestore listeners update status automatically
- Progress bars update in real-time

#### Files to Create:
```
/src/pages/
└── JobsPage.tsx            # Main dashboard

/src/components/jobs/
├── JobTable.tsx            # Table view of jobs
├── JobRow.tsx              # Individual job row
├── JobFilters.tsx          # Filter controls
├── JobActions.tsx          # Download/retry buttons
└── VideoPlayer.tsx         # Preview video modal

/src/hooks/
├── useJobs.ts              # Firestore hook for jobs
└── useVideoDownload.ts     # Download video from Storage
```

#### Acceptance Criteria:
- [ ] Display all jobs from Firestore
- [ ] Real-time status updates
- [ ] Filter by status
- [ ] Download completed videos
- [ ] Retry failed jobs
- [ ] Delete jobs
- [ ] Empty state when no jobs
- [ ] Pagination for large job lists

---

### 🏠 Module 6: Home Page (POLISH)
**Priority:** 🟢 **MEDIUM** - Nice to have, not critical
**Estimated Time:** 0.5 days
**Dependencies:** Modules 1, 2

#### What It Delivers:
- Landing page with project overview
- Quick stats dashboard
- Getting started guide
- Quick actions

#### Features:
- Hero section with description
- Stats cards:
  - Total videos generated
  - Templates available
  - Active jobs
- Quick action buttons:
  - "Create Video" → Generate page
  - "View Templates" → Templates page
  - "View Jobs" → Jobs page
- Recent activity feed

#### Files to Update:
```
/src/pages/
└── HomePage.tsx            # Enhanced home page

/src/components/home/
├── StatsCard.tsx           # Statistics display
├── QuickActions.tsx        # Action buttons
└── RecentActivity.tsx      # Activity feed
```

#### Acceptance Criteria:
- [ ] Display real statistics from Firestore
- [ ] Quick navigation to main features
- [ ] Recent jobs list
- [ ] Matches Agent Collective design

---

### 🔧 Module 7: Template Management (ADMIN)
**Priority:** 🟢 **LOW** - Admin-only, can be manual initially
**Estimated Time:** 2 days
**Dependencies:** Modules 1, 2

#### What It Delivers:
- Upload new templates
- Edit template metadata
- Activate/deactivate templates
- Template versioning

#### Features:
1. **Template Upload:**
   - Upload template package (zip)
   - Enter metadata (name, version, slots)
   - Upload preview image
   - Deploy to S3 via Remotion

2. **Template Editor:**
   - Edit name, description
   - Update slot definitions
   - Change status (active/inactive)

3. **Template Versions:**
   - View version history
   - Rollback to previous version

#### Files to Create:
```
/src/pages/
└── TemplateManagementPage.tsx  # Admin page

/src/components/admin/
├── TemplateUploader.tsx    # Upload new template
├── TemplateEditor.tsx      # Edit template
├── SlotEditor.tsx          # Define slots
└── TemplateVersions.tsx    # Version history

/src/hooks/
└── useTemplateUpload.ts    # Upload to Storage + Firestore
```

#### Acceptance Criteria:
- [ ] Upload template package
- [ ] Create Firestore record
- [ ] Edit template metadata
- [ ] Activate/deactivate templates
- [ ] View version history

**Note:** This can be done manually via Firebase Console initially.

---

### 🔌 Module 8: YTM Integration UI (MCP)
**Priority:** 🟡 **HIGH** - Key integration feature
**Estimated Time:** 1 day
**Dependencies:** Modules 1, 2

#### What It Delivers:
- MCP bridge status indicator
- Manual "Send to Generator" button
- Asset transfer history
- Connection health monitoring

#### Features:

**Left Sidebar Addition:**
- MCP Bridge section
- Connection status (online/offline)
- "Send to YTM Generator" button
- Last sync time

**MCP History:**
- List of asset transfers
- Source (YTM Creative Generator)
- Assets received
- Timestamp

#### Files to Create:
```
/src/components/mcp/
├── MCPStatus.tsx           # Connection status
├── MCPBridgeButton.tsx     # Send to generator
└── MCPHistory.tsx          # Transfer history

/src/hooks/
└── useMCPStatus.ts         # Check MCP health
```

#### Acceptance Criteria:
- [ ] Display MCP connection status
- [ ] Button to trigger asset sync
- [ ] View recent asset transfers
- [ ] Error handling for failed transfers

---

## Priority Matrix

| Priority | Modules | Description |
|----------|---------|-------------|
| 🔴 **P0 - Critical** | 1, 2, 4 | Must have for MVP: Components, Layout, Generate |
| 🟡 **P1 - High** | 3, 5, 8 | Core features: Templates, Jobs, MCP |
| 🟢 **P2 - Medium** | 6 | Polish: Home page |
| ⚪ **P3 - Low** | 7 | Admin: Template Management (manual initially) |

---

## Recommended Implementation Sequence

### Option A: MVP First (Fastest to Working App)
**Goal:** Get basic video generation working ASAP

1. **Week 1:**
   - Module 1: Core UI Components (1.5 days)
   - Module 2: Layout (1 day)
   - Module 4: Generate Page (3 days)
   - **Result:** Can generate videos by manually entering data

2. **Week 2:**
   - Module 3: Template Gallery (2 days)
   - Module 5: Job Dashboard (2 days)
   - Module 8: MCP Integration (1 day)
   - **Result:** Full working app with templates and job tracking

3. **Polish:**
   - Module 6: Home Page (0.5 days)
   - Module 7: Template Management (optional, 2 days)

**Total Time:** 8-10 days to full featured app

---

### Option B: Feature Complete (Most Polished)
**Goal:** Build everything properly from the start

1. **Foundation (3 days):**
   - Module 1: Components
   - Module 2: Layout
   - Module 6: Home Page

2. **Core Features (7 days):**
   - Module 3: Template Gallery
   - Module 4: Generate Page
   - Module 5: Job Dashboard
   - Module 8: MCP Integration

3. **Admin (2 days):**
   - Module 7: Template Management

**Total Time:** 12 days to completion

---

### Option C: Iterative (User-Driven)
**Goal:** Build based on immediate user needs

**You choose the order!** Pick modules based on:
- What you need to test first
- What users will use most
- What's blocking other work

---

## Implementation Details

### State Management Strategy
```typescript
// Use React Context for global state
/src/contexts/
├── TemplateContext.tsx     # Selected template
├── AssetContext.tsx        # Uploaded assets
└── JobContext.tsx          # Current job status
```

### Firestore Hooks Pattern
```typescript
// Example: useTemplates.ts
export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'templates'),
            where('status', '==', 'active')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTemplates(data);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { templates, loading };
}
```

### Asset Upload Pattern
```typescript
// Upload to Firebase Storage
async function uploadAsset(file: File, projectId: string) {
  const storage = getStorage();
  const storageRef = ref(storage,
    `assets/${projectId}/original/${file.name}`);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return url;
}
```

---

## Testing Checklist

After each module:
- [ ] Visual match with Agent Collective design
- [ ] Responsive on mobile/tablet/desktop
- [ ] Firestore real-time updates working
- [ ] Error handling for network issues
- [ ] Loading states for async operations
- [ ] Accessibility (keyboard nav, screen readers)

---

## Deployment Strategy

### Continuous Deployment:
```bash
# After each module completion
npm run build
firebase deploy --only hosting

# Test at:
# https://template-stamper-d7045.web.app
```

### Staged Rollout:
1. Deploy to Firebase Hosting
2. Test with sample data
3. Create first real template
4. Test end-to-end flow
5. Enable for 1 market
6. Monitor for 1 week
7. Roll out to all 4 markets

---

## Dependencies & Prerequisites

### Before Starting Phase 2:
- [x] Phase 1 complete (✅ Done!)
- [x] Tailwind config updated
- [x] lucide-react installed
- [ ] First Remotion template created and deployed
- [ ] Sample data in Firestore (templates, jobs)

### For Each Module:
- React functional components
- TypeScript strict mode
- Tailwind CSS utility classes
- Firebase SDK (Firestore, Storage, Functions)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Firestore real-time issues | Low | High | Implement offline support, error boundaries |
| Asset upload failures | Medium | Medium | Retry logic, progress indicators, validation |
| Remotion Lambda delays | Low | Medium | Clear progress messaging, set expectations |
| Design inconsistencies | Medium | Low | Component library, design system enforcement |
| Mobile responsiveness | Medium | Medium | Test on actual devices, use responsive breakpoints |

---

## Success Metrics

**Phase 2 Complete When:**
- [ ] All P0 and P1 modules implemented
- [ ] Can create video end-to-end via UI
- [ ] All pages match Agent Collective design
- [ ] Real-time job tracking working
- [ ] MCP bridge integration functional
- [ ] Deployed to Firebase Hosting
- [ ] No TypeScript errors
- [ ] Responsive on all screen sizes

---

## Next Steps

**You Choose:**

1. **Prioritize modules** - Tell me which order to implement
2. **Start with MVP (Option A)** - Get working app fastest
3. **Go feature complete (Option B)** - Build everything properly
4. **Pick specific module** - Start with one module you need most

**What's your priority?**

---

**Created:** 2026-01-29
**Status:** Ready for Implementation
**Total Estimated Time:** 10-12 days
