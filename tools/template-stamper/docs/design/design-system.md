# Template Stamper - Design System

**Based on:** YTM Agent Collective
**Reference:** `/design/agent-collective-reference.png`
**Created:** 2026-01-29

---

## Design Philosophy

Template Stamper follows the same visual language as YTM Agent Collective to maintain consistency across the APAC Shorts Automation tool family. The design emphasizes:

- **Dark, professional interface** for extended use
- **Red accent color** for primary actions and branding
- **Three-column layout** for efficient workflow
- **Icon-driven navigation** for quick recognition
- **Clear status indicators** for system feedback

---

## Color Palette

### Background Colors
```css
--bg-primary: #0a0a0a;           /* Main background */
--bg-secondary: #1a1a1a;         /* Panels, cards */
--bg-tertiary: #2a2a2a;          /* Hover states */
--bg-input: #1f1f1f;             /* Form inputs */
```

### Text Colors
```css
--text-primary: #ffffff;         /* Primary text */
--text-secondary: #a0a0a0;       /* Secondary text, labels */
--text-tertiary: #6b6b6b;        /* Disabled, hints */
--text-accent: #ef4444;          /* Links, highlights */
```

### Accent Colors
```css
--accent-red: #ef4444;           /* Primary actions, branding */
--accent-red-hover: #dc2626;     /* Button hover states */
--accent-red-light: #fca5a5;     /* Status indicators */

--status-online: #10b981;        /* Green - online/success */
--status-offline: #6b7280;       /* Gray - offline/disabled */
--status-warning: #f59e0b;       /* Yellow - warnings */
```

### Border Colors
```css
--border-subtle: #2a2a2a;        /* Subtle panel borders */
--border-input: #3a3a3a;         /* Input borders */
--border-focus: #ef4444;         /* Focused elements */
--border-dashed: #4a4a4a;        /* Dashed upload areas */
```

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px - Labels, hints */
--text-sm: 0.875rem;     /* 14px - Body text */
--text-base: 1rem;       /* 16px - Default */
--text-lg: 1.125rem;     /* 18px - Subheadings */
--text-xl: 1.25rem;      /* 20px - Section headers */
--text-2xl: 1.5rem;      /* 24px - Page titles */
--text-3xl: 1.875rem;    /* 30px - Hero text */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Text Styles

**Section Headers:**
```css
.section-header {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
```

**Page Titles:**
```css
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}
```

---

## Layout Structure

### Three-Column Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Full Width)                                        │
├─────────┬───────────────────────────┬───────────────────────┤
│         │                           │                       │
│  Left   │     Main Content          │    Right Sidebar     │
│ Sidebar │      (Flexible)           │     (300-350px)      │
│ (250px) │                           │                       │
│         │                           │                       │
└─────────┴───────────────────────────┴───────────────────────┘
```

**Implementation:**
```css
.app-layout {
  display: grid;
  grid-template-columns: 250px 1fr 320px;
  height: 100vh;
  background: var(--bg-primary);
}

.left-sidebar {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
}

.main-content {
  background: var(--bg-primary);
  overflow-y: auto;
}

.right-sidebar {
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-subtle);
  overflow-y: auto;
}
```

### Spacing System
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 48px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

---

## Components

### Primary Button (Red)

**Usage:** Main actions (e.g., "Send to Generator", "Generate Video")

```tsx
<button className="btn-primary">
  <RocketIcon className="w-4 h-4" />
  Open YTM Creative Generator
</button>
```

```css
.btn-primary {
  background: var(--accent-red);
  color: white;
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--accent-red-hover);
}
```

### Secondary Button (Dark)

**Usage:** Secondary actions (e.g., "Clear Chat", "Save to Archive")

```css
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #3a3a3a;
}
```

### Card/Panel

**Usage:** Content containers (e.g., "Agent Setup", "Template Gallery")

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
}

.card-header {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}
```

### Status Indicator

**Usage:** Online/Offline status, job status

```tsx
<div className="status-indicator">
  <span className="status-dot status-online"></span>
  <span className="status-text">Online</span>
</div>
```

```css
.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-online {
  background: var(--status-online);
}

.status-offline {
  background: var(--status-offline);
}

.status-text {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Toggle Switch

**Usage:** Enable/disable agents, templates

```tsx
<label className="toggle-switch">
  <input type="checkbox" />
  <span className="toggle-slider"></span>
</label>
```

```css
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--accent-red);
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
```

### Dropdown Select

**Usage:** Market selection, template selection

```css
.select {
  width: 100%;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: var(--text-sm);
  appearance: none;
  background-image: url("data:image/svg+xml...");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.select:focus {
  outline: none;
  border-color: var(--border-focus);
}
```

### File Upload Area (Dashed Border)

**Usage:** Asset upload, template upload

```tsx
<div className="upload-area">
  <FolderIcon className="upload-icon" />
  <p className="upload-text">Drop files here or click to upload</p>
  <p className="upload-hint">Supports: PDF, DOCX, PPTX, XLSX</p>
</div>
```

```css
.upload-area {
  border: 2px dashed var(--border-dashed);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--accent-red);
  background: rgba(239, 68, 68, 0.05);
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
  margin: 0 auto var(--space-md);
}

.upload-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

### List Item with Icon

**Usage:** Active agents, templates, jobs

```tsx
<div className="list-item">
  <div className="list-item-icon">📊</div>
  <span className="list-item-text">Marketing Manager</span>
  <ToggleSwitch />
</div>
```

```css
.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.list-item:hover {
  background: var(--bg-tertiary);
}

.list-item-icon {
  width: 24px;
  height: 24px;
  font-size: 16px;
}

.list-item-text {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-primary);
}
```

### Section Divider

**Usage:** Separate sections in sidebar

```css
.section-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--space-xl) 0;
}
```

---

## Template Stamper Specific Layouts

### Left Sidebar: Control Panel

**Sections:**
1. **Market Selector** (dropdown)
2. **Active Templates** (list with toggles)
3. **Actions** (buttons)
4. **MCP Bridge** (integration button)
5. **Job History** (dropdown)

```tsx
<aside className="left-sidebar">
  {/* Market Selector */}
  <section>
    <h3 className="section-header">Market</h3>
    <select className="select">
      <option>Japan</option>
      <option>Korea</option>
      <option>Australia</option>
      <option>New Zealand</option>
    </select>
  </section>

  {/* Active Templates */}
  <section>
    <h3 className="section-header">Active Templates</h3>
    <div className="list-item">
      <span className="list-item-icon">🎬</span>
      <span className="list-item-text">Veo Shorts v1</span>
      <ToggleSwitch />
    </div>
  </section>

  {/* Actions */}
  <section>
    <h3 className="section-header">Actions</h3>
    <button className="btn-secondary">
      <TrashIcon /> Clear Selection
    </button>
  </section>

  {/* MCP Bridge */}
  <section>
    <h3 className="section-header">MCP Bridge</h3>
    <button className="btn-primary">
      <RocketIcon /> Send to Generator
    </button>
  </section>
</aside>
```

### Main Content: Video Generation Workspace

**States:**
- Empty state (template selection prompt)
- Asset upload state
- Generation in progress
- Video preview

```tsx
<main className="main-content">
  <div className="workspace">
    <div className="workspace-header">
      <h1 className="page-title">Generate Video</h1>
      <StatusIndicator status="ready" />
    </div>

    <div className="workspace-content">
      {/* Template selection, asset upload, preview */}
    </div>
  </div>
</main>
```

### Right Sidebar: Template Setup

**Sections:**
1. **Selected Template Info**
2. **Asset Slot Mapping** (drag-drop areas)
3. **Generation Options**
4. **Status Feed**

```tsx
<aside className="right-sidebar">
  <section>
    <h3 className="section-header">Template Setup</h3>
    <div className="card">
      <h4 className="card-header">Veo on Shorts v1</h4>
      <p className="text-secondary">8 content slots • 17 seconds</p>
    </div>
  </section>

  <section>
    <h3 className="section-header">Asset Slots</h3>
    <div className="upload-area">
      <FolderIcon />
      <p>Drop files here or click to upload</p>
    </div>
  </section>
</aside>
```

---

## Animation & Interactions

### Transitions
```css
/* Standard transition for interactive elements */
transition: all 0.2s ease-in-out;

/* Hover states */
transition: background 0.2s, transform 0.2s;

/* Focus states */
transition: border-color 0.2s, box-shadow 0.2s;
```

### Button Hover Effects
```css
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
```

### Loading States
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Progress Indicators
```tsx
<div className="progress-bar">
  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
</div>
```

```css
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-red);
  transition: width 0.3s ease;
}
```

---

## Responsive Breakpoints

```css
/* Mobile: Single column */
@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .left-sidebar,
  .right-sidebar {
    display: none; /* Show in drawer/modal on mobile */
  }
}

/* Tablet: Two columns */
@media (min-width: 769px) and (max-width: 1024px) {
  .app-layout {
    grid-template-columns: 250px 1fr;
  }

  .right-sidebar {
    display: none;
  }
}

/* Desktop: Three columns */
@media (min-width: 1025px) {
  .app-layout {
    grid-template-columns: 250px 1fr 320px;
  }
}
```

---

## Icon System

**Recommended:** Use [Lucide React](https://lucide.dev) (same as Agent Collective appears to use)

```bash
npm install lucide-react
```

**Common Icons:**
```tsx
import {
  Rocket,        // Launch/Send actions
  Trash2,        // Delete/Clear
  FolderOpen,    // File upload
  Settings,      // Configuration
  Check,         // Success
  X,             // Close/Error
  Play,          // Generate/Start
  Download,      // Download output
  Upload,        // Upload assets
  Eye,           // Preview
  Clock,         // Job history/time
  AlertCircle,   // Warnings
} from 'lucide-react';
```

---

## Accessibility

### Focus States
```css
*:focus {
  outline: 2px solid var(--accent-red);
  outline-offset: 2px;
}
```

### Screen Reader Text
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### ARIA Labels
```tsx
<button aria-label="Send to Generator">
  <RocketIcon />
</button>

<div role="status" aria-live="polite">
  Job completed
</div>
```

---

## Implementation Checklist for Phase 2

When building the Template Stamper UX:

- [ ] Update Tailwind config with custom colors from this guide
- [ ] Install lucide-react for icons
- [ ] Implement three-column layout grid
- [ ] Create reusable component library:
  - [ ] Button (primary, secondary)
  - [ ] Card/Panel
  - [ ] StatusIndicator
  - [ ] ToggleSwitch
  - [ ] Select/Dropdown
  - [ ] UploadArea
  - [ ] ListItem
  - [ ] ProgressBar
- [ ] Update existing pages (HomePage, TemplatesPage, etc.) with new design
- [ ] Add animations and transitions
- [ ] Test responsive layouts
- [ ] Ensure accessibility compliance

---

## Design References

**Agent Collective Screenshot:** `/design/agent-collective-reference.png`

**Key Design Principles:**
1. **Dark theme** for reduced eye strain during extended use
2. **Red accent** for brand consistency and primary actions
3. **Icon-driven** for quick visual recognition
4. **Three-column layout** for efficient workflow
5. **Subtle borders** to define sections without visual clutter
6. **Status indicators** for real-time feedback

---

**Last Updated:** 2026-01-29
**For Phase:** Phase 2 (Template Stamper App UI Development)
