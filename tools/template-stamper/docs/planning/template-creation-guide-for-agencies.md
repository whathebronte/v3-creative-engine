# Template Creation Guide for Creative Agencies

**Project:** Template Stamper
**Audience:** External Creative Agencies & Designers
**Version:** 1.0
**Date:** 2026-02-04

---

## Table of Contents

1. [Overview](#1-overview)
2. [Template Package Format](#2-template-package-format)
3. [Asset Slot Specification](#3-asset-slot-specification)
4. [Figma Design Guidelines](#4-figma-design-guidelines)
5. [Naming Conventions](#5-naming-conventions)
6. [Technical Constraints](#6-technical-constraints)
7. [Handoff Process](#7-handoff-process)
8. [Reference Example](#8-reference-example)
9. [Quality Checklist](#9-quality-checklist)

---

## 1. Overview

### 1.1 What is a Template?

A **template** in Template Stamper is a branded video structure that:
- Contains **fixed branding elements** (logos, UI mockups, colors, typography)
- Defines **variable content slots** where user images/videos are inserted
- Specifies **timing and animations** for each screen/section
- Outputs a **vertical video** (720x1280px, 9:16 aspect ratio)

### 1.2 Your Role as a Creative Agency

You will provide:
1. **Figma design files** with all screens and branding elements
2. **Exported SVG assets** for logos, UI elements, and graphics
3. **Detailed specification document** defining slot locations and timing
4. **Preview mockup** showing the template in action

Our development team will then:
- Convert your designs into React/Remotion code
- Implement animations and transitions
- Deploy the template to our rendering system

---

## 2. Template Package Format

### 2.1 Deliverables Overview

Your complete template package should include:

```
template-package/
├── 01-figma-files/
│   └── template-name.fig (exported Figma file)
├── 02-assets/
│   ├── logo.svg
│   ├── ui-elements.svg
│   ├── icons/
│   │   ├── icon-1.svg
│   │   └── icon-2.svg
│   └── fonts/ (if custom fonts used)
│       ├── CustomFont-Regular.woff2
│       └── CustomFont-Bold.woff2
├── 03-specification/
│   ├── template-spec.md (detailed specification)
│   ├── asset-slots.json (slot definitions)
│   └── timing-diagram.pdf (visual timing breakdown)
├── 04-reference/
│   ├── preview-mockup.mp4 (animated preview)
│   ├── screen-captures/ (PNG of each screen)
│   │   ├── screen-01-grid.png
│   │   ├── screen-02-prompt.png
│   │   └── screen-03-result.png
│   └── example-assets/ (sample content for testing)
│       ├── example-image-1.jpg
│       └── example-video-1.mp4
└── README.md (package overview)
```

### 2.2 File Format Requirements

| Asset Type | Format | Requirements |
|------------|--------|--------------|
| Vector graphics (logos, UI) | SVG | Outlined text, no embedded images |
| Custom fonts | WOFF2 | Web-optimized, include license |
| Screen mockups | PNG | 720x1280px, 72dpi |
| Preview video | MP4 | H.264, max 2 minutes |
| Example assets | JPEG/MP4 | Match slot constraints |
| Specification | Markdown | UTF-8 encoding |

---

## 3. Asset Slot Specification

### 3.1 What is an Asset Slot?

An **asset slot** is a placeholder in your template where user-provided content (images or videos) will be dynamically inserted during video generation.

### 3.2 Slot Naming Convention

Use this format: `{category}{Type}{Number}`

**Examples:**
- `gridImage1`, `gridImage2`, `gridImage3`
- `selectedImage1`, `selectedImage2`
- `generatedVideo`
- `userPhoto`, `productImage`
- `backgroundVideo`

**Rules:**
- **camelCase** format (first word lowercase, subsequent words capitalized)
- **Descriptive** category (grid, selected, generated, user, product, etc.)
- **Type** included (Image, Video, Text)
- **Numbers** for multiple slots of same type (1-indexed)

### 3.3 Slot Definition Format

For each asset slot in your template, provide this information in `asset-slots.json`:

```json
{
  "slots": [
    {
      "id": "gridImage1",
      "name": "Grid Image 1",
      "type": "image",
      "required": true,
      "description": "First image in the 3x3 grid display",
      "timing": {
        "appearsAt": "0:00",
        "visibleUntil": "0:02.5",
        "durationSeconds": 2.5
      },
      "constraints": {
        "aspectRatio": "1:1",
        "minWidth": 400,
        "minHeight": 400,
        "maxFileSize": 10485760,
        "formats": ["jpeg", "png"]
      },
      "position": {
        "screen": "Grid Screen",
        "location": "Top left corner of 3x3 grid"
      }
    },
    {
      "id": "generatedVideo",
      "name": "AI-Generated Video Result",
      "type": "video",
      "required": true,
      "description": "Main output video from AI generation",
      "timing": {
        "appearsAt": "0:06.25",
        "visibleUntil": "0:15",
        "durationSeconds": 8.75
      },
      "constraints": {
        "aspectRatio": "9:16",
        "minWidth": 720,
        "minHeight": 1280,
        "maxDuration": 15,
        "maxFileSize": 52428800,
        "formats": ["mp4", "mov"]
      },
      "position": {
        "screen": "Result Screen",
        "location": "Full screen display"
      }
    }
  ]
}
```

### 3.4 Slot Types

#### 3.4.1 Image Slots
```json
{
  "type": "image",
  "constraints": {
    "aspectRatio": "1:1" | "16:9" | "9:16" | "4:3",
    "minWidth": 400,
    "minHeight": 400,
    "maxFileSize": 10485760,  // 10MB in bytes
    "formats": ["jpeg", "png", "webp"]
  }
}
```

#### 3.4.2 Video Slots
```json
{
  "type": "video",
  "constraints": {
    "aspectRatio": "9:16" | "16:9" | "1:1",
    "minWidth": 720,
    "minHeight": 1280,
    "maxDuration": 15,        // seconds
    "maxFileSize": 52428800,  // 50MB in bytes
    "formats": ["mp4", "mov", "webm"],
    "codec": "h264"
  }
}
```

#### 3.4.3 Text Slots (Optional)
```json
{
  "type": "text",
  "constraints": {
    "maxLength": 100,         // characters
    "allowedCharacters": "alphanumeric+spaces",
    "fontFamily": "Roboto",
    "fontSize": 24,
    "textAlign": "center"
  }
}
```

---

## 4. Figma Design Guidelines

### 4.1 Artboard Setup

1. **Canvas Size:** 720x1280px (9:16 vertical format)
2. **Frame Rate Reference:** Design for 24fps playback
3. **Screen Organization:** Create separate frames for each screen/section
4. **Naming:** Use clear, sequential names (e.g., "01-Grid-Screen", "02-Prompt-Screen")

### 4.2 Layer Organization

```
Figma File Structure:
📄 Template Name
  📁 00-Cover (overview/description)
  📁 01-Grid-Screen
    📁 Branding (fixed elements)
      - Logo
      - UI Frame
      - Button
    📁 Content-Slots (variable)
      - [SLOT: gridImage1] 1:1 ratio
      - [SLOT: gridImage2] 1:1 ratio
      - ...
    📁 Annotations
      - Timing notes
      - Animation notes
  📁 02-Prompt-Screen
    ...
  📁 03-Result-Screen
    ...
  📁 Assets-Export (all SVGs organized)
```

### 4.3 Asset Slot Markers in Figma

Mark each content slot clearly:

1. **Create a placeholder shape** (rectangle/frame) where content will appear
2. **Name the layer** with the slot ID in brackets: `[SLOT: gridImage1]`
3. **Add constraints** in the layer name or notes: `[SLOT: gridImage1 | 1:1 | 400x400px]`
4. **Use contrasting fill** (bright pink/orange) so slots are easily identifiable
5. **Lock branding layers** to prevent accidental edits

**Example Layer Names:**
```
[SLOT: gridImage1 | image | 1:1 | required]
[SLOT: gridImage2 | image | 1:1 | required]
[SLOT: generatedVideo | video | 9:16 | required | 0-15s]
[SLOT: userPrompt | text | 100 chars | optional]
```

### 4.4 Branding Elements

All fixed branding elements should be:
- **Vector-based** (use shapes, not rasterized images)
- **Outlined text** (convert text to outlines before export)
- **Organized in groups** (e.g., "Logo Group", "UI Elements Group")
- **Properly named** for easy identification during development

### 4.5 Animation Notes

Add text annotations or use Figma comments to specify:
- **Timing:** When elements appear/disappear
- **Transitions:** Fade in/out, slide, scale, etc.
- **Duration:** How long animations take (e.g., "Fade in over 0.5s")
- **Easing:** Linear, ease-in, ease-out, spring

**Example Annotation:**
```
Animation: Grid images fade in
Timing: 0:00 - 0:02
Stagger: Each image delays by 0.1s
Easing: Ease-out
```

---

## 5. Naming Conventions

### 5.1 File Naming

Use kebab-case for all files:

```
✅ GOOD:
- veo-shorts-template.fig
- brand-logo.svg
- ui-elements-screen-1.svg
- example-image-1.jpg

❌ BAD:
- VeoShortsTemplate.fig
- Brand Logo.svg
- ui_elements_screen_1.svg
- Example Image (1).jpg
```

### 5.2 Layer Naming in Figma

Use PascalCase or descriptive names:

```
✅ GOOD:
- BrandLogo
- GridScreen
- PromptInputUI
- [SLOT: gridImage1]

❌ BAD:
- Layer 1
- Rectangle 23
- Group 456
```

### 5.3 Asset Export Naming

When exporting SVGs and other assets:

```
✅ GOOD:
- logo.svg
- ui-frame-grid.svg
- icon-close.svg
- button-done.svg

❌ BAD:
- asset1.svg
- export.svg
- untitled.svg
```

---

## 6. Technical Constraints

### 6.1 Video Output Specifications

All templates must conform to these output specs:

| Parameter | Value |
|-----------|-------|
| Resolution | 720x1280px (9:16 vertical) |
| Frame Rate | 24 fps |
| Format | MP4 (H.264) |
| Duration | Flexible (typically 10-30 seconds) |
| Color Space | sRGB |

### 6.2 Asset Constraints

#### Images:
- **Max file size:** 10MB per image
- **Formats:** JPEG, PNG, WebP
- **Min dimensions:** Match slot aspect ratio requirements
- **Color mode:** RGB (not CMYK)

#### Videos:
- **Max file size:** 50MB per video
- **Max duration:** 15 seconds per slot
- **Formats:** MP4 (H.264), MOV
- **Resolution:** 720x1280px minimum for 9:16 content
- **Frame rate:** 24fps or 30fps

#### Fonts:
- **Format:** WOFF2 preferred, TTF/OTF acceptable
- **License:** Must have web embedding rights
- **File size:** Under 500KB per font file

### 6.3 Performance Considerations

To ensure fast rendering (1-2 minutes per video):

1. **Limit complexity:**
   - Max 8-10 asset slots per template
   - Avoid excessive layering
   - Use simple animations (fade, slide, scale)

2. **Optimize assets:**
   - Compress images before export
   - Keep SVGs simple (avoid gradients/blur effects)
   - Use web-safe fonts when possible

3. **Minimize duration:**
   - Keep total video length under 30 seconds
   - Each screen/section: 2-5 seconds recommended

---

## 7. Handoff Process

### 7.1 Step-by-Step Handoff

#### Step 1: Design Completion
- [ ] All screens designed in Figma
- [ ] Asset slots clearly marked with [SLOT: ...] notation
- [ ] Branding elements finalized and approved
- [ ] Animation notes added

#### Step 2: Export Assets
- [ ] Export all SVG files (logos, UI elements, icons)
- [ ] Export screen mockups as PNG (720x1280px)
- [ ] Export custom fonts (if used)
- [ ] Create example assets for testing

#### Step 3: Documentation
- [ ] Complete `template-spec.md` with detailed description
- [ ] Fill out `asset-slots.json` with all slot definitions
- [ ] Create timing diagram (visual breakdown of screens)
- [ ] Write any special instructions or notes

#### Step 4: Preview & Validation
- [ ] Create animated mockup/preview video (using After Effects, Figma prototype, or similar)
- [ ] Test with example assets to ensure layout works
- [ ] Review with your internal team

#### Step 5: Package & Deliver
- [ ] Organize all files according to package structure (Section 2.1)
- [ ] Zip the complete package
- [ ] Upload to shared drive or delivery platform
- [ ] Notify development team

### 7.2 Review & Feedback Loop

After delivery:
1. **Development Review** (2-3 days): Our team reviews for technical feasibility
2. **Feedback Session:** We may request clarifications or adjustments
3. **Development Sprint** (3-5 days): Conversion to React/Remotion code
4. **Preview Testing:** You review rendered test videos
5. **Final Adjustments:** Minor tweaks if needed
6. **Deployment:** Template goes live in the system

**Total Timeline:** 1-2 weeks from handoff to deployment

---

## 8. Reference Example

### 8.1 Example Template: "Veo Shorts - Pet Skydiving"

This is a real template example to guide your work.

#### Template Overview:
- **Name:** Veo on Shorts - Pet Skydiving
- **Duration:** 17 seconds
- **Screens:** 5 sections
- **Asset Slots:** 10 total (9 images + 1 video)

#### Screen Breakdown:

**Section 1: Grid Screen (0:00 - 0:02.5)**
- Shows 3x3 grid of recent images
- UI mockup of mobile interface
- "Done" button at bottom
- **Slots:**
  - `gridImage1` through `gridImage9` (9 images, 1:1 aspect ratio)

**Section 2: Prompt Input Screen (0:02.5 - 0:06.25)**
- Shows 2 selected images highlighted
- Prompt text input UI
- Example text: "Show me and my cat skydiving"
- **Slots:**
  - `selectedImage1`, `selectedImage2` (from grid)
  - `promptText` (text input, max 100 chars)

**Section 3: Result Full Screen (0:06.25 - 0:13.75)**
- Generated video plays full screen
- No UI elements
- **Slots:**
  - `generatedVideo` (9:16 video, max 15 seconds)

**Section 4: Result with Frame (0:13.75 - 0:15)**
- Same video but with subtle UI frame overlay
- Shows it's within the app context
- **Slots:**
  - (same `generatedVideo` continuing)

**Section 5: Branding End Card (0:15 - 0:17.5)**
- Brand logo
- Tagline: "Create with Veo on Shorts"
- Clean background
- **Slots:**
  - None (all fixed branding)

#### Asset Slots JSON:
```json
{
  "templateId": "veo-shorts-v1",
  "templateName": "Veo on Shorts - Pet Skydiving",
  "version": "1.0.0",
  "totalDuration": 17,
  "slots": [
    {
      "id": "gridImage1",
      "name": "Grid Image 1",
      "type": "image",
      "required": true,
      "constraints": {
        "aspectRatio": "1:1",
        "minWidth": 400,
        "maxFileSize": 10485760,
        "formats": ["jpeg", "png"]
      }
    },
    // ... gridImage2 through gridImage9 (same structure)
    {
      "id": "generatedVideo",
      "name": "AI-Generated Video",
      "type": "video",
      "required": true,
      "constraints": {
        "aspectRatio": "9:16",
        "minWidth": 720,
        "minHeight": 1280,
        "maxDuration": 15,
        "maxFileSize": 52428800,
        "formats": ["mp4"]
      }
    }
  ]
}
```

#### Figma File Structure:
```
📄 Veo-Shorts-Pet-Skydiving
  📁 00-Cover
  📁 01-Grid-Screen (0:00-0:02.5)
    📁 Fixed-Branding
      - TopBar (Recents ▼ | ✕)
      - DoneButton
      - GridLayout (3x3 frame)
    📁 Content-Slots
      - [SLOT: gridImage1 | image | 1:1 | required]
      - [SLOT: gridImage2 | image | 1:1 | required]
      - ... (9 total)
  📁 02-Prompt-Screen (0:02.5-0:06.25)
  📁 03-Result-Full (0:06.25-0:13.75)
  📁 04-Result-Frame (0:13.75-0:15)
  📁 05-Branding-End (0:15-0:17.5)
  📁 Assets-Export
```

---

## 9. Quality Checklist

Before delivering your template package, verify:

### Design Quality
- [ ] All screens are 720x1280px
- [ ] Asset slots are clearly marked with [SLOT: ...] notation
- [ ] Branding elements are vector-based (no rasterized logos)
- [ ] Text is outlined (converted to shapes)
- [ ] Colors match brand guidelines
- [ ] Layout works with various content types

### Technical Requirements
- [ ] All SVGs exported with outlined text
- [ ] Fonts included (if custom fonts used)
- [ ] Asset slot constraints defined (aspect ratio, file size)
- [ ] Example assets match slot requirements
- [ ] Total video duration documented

### Documentation
- [ ] `template-spec.md` completed with detailed description
- [ ] `asset-slots.json` includes all slots with full constraints
- [ ] Timing diagram shows sequence and duration
- [ ] Animation notes are clear and specific
- [ ] README.md provides package overview

### Deliverables Organization
- [ ] All files named using conventions (kebab-case)
- [ ] Folder structure matches specified format
- [ ] No missing or placeholder files
- [ ] Package is zipped and ready to deliver

### Preview & Testing
- [ ] Animated preview video created
- [ ] Screen capture PNGs exported for all screens
- [ ] Example assets test the template layout
- [ ] Visual consistency verified across all screens

---

## 10. Support & Questions

### Contact Information
For questions during template creation:
- **Technical Questions:** [dev-team@templatestamper.com]
- **Design Guidance:** [design@templatestamper.com]
- **Project Management:** [pm@templatestamper.com]

### Resources
- **Template Stamper Documentation:** [link to docs]
- **Remotion Examples:** https://www.remotion.dev/docs/
- **Figma Best Practices:** [internal guide link]

### Common Questions

**Q: Can I use gradients and blur effects?**
A: Limit use of complex effects as they can slow rendering. Simple gradients are OK, but avoid heavy blur/shadow effects.

**Q: What if my design needs more than 10 asset slots?**
A: Consult with our development team. More slots increase complexity and render time.

**Q: Can I use custom fonts?**
A: Yes, but include font files (WOFF2) and ensure you have web embedding rights. Prefer web-safe fonts when possible.

**Q: How do I handle different aspect ratios for user content?**
A: Specify the target aspect ratio in slot constraints. Content will be cropped/fitted during rendering.

**Q: Can templates be updated after deployment?**
A: Yes, we use semantic versioning. Minor updates (animations, colors) are easy. Major structural changes require creating a new template version.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Claude Code | Initial guide for creative agencies |

---

**END OF TEMPLATE CREATION GUIDE**
