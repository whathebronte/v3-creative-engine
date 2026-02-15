# Template Creation Quick Reference

**Template Stamper - Agency Cheat Sheet**

---

## Video Output Specs

| Parameter | Value |
|-----------|-------|
| **Resolution** | 720x1280px (9:16 vertical) |
| **Frame Rate** | 24 fps |
| **Format** | MP4 (H.264) |
| **Duration** | 10-30 seconds (flexible) |
| **Color Space** | sRGB |

---

## Asset Slot Naming

Use **camelCase** format: `{category}{Type}{Number}`

**Examples:**
- `gridImage1`, `gridImage2`, `gridImage3`
- `selectedImage1`, `selectedImage2`
- `generatedVideo`, `backgroundVideo`
- `userPrompt`, `productTitle`

---

## Slot Types & Constraints

### Images
```json
{
  "type": "image",
  "constraints": {
    "aspectRatio": "1:1" | "16:9" | "9:16",
    "minWidth": 400,
    "minHeight": 400,
    "maxFileSize": 10485760,  // 10MB
    "formats": ["jpeg", "png"]
  }
}
```

### Videos
```json
{
  "type": "video",
  "constraints": {
    "aspectRatio": "9:16" | "16:9",
    "minWidth": 720,
    "minHeight": 1280,
    "maxDuration": 15,        // seconds
    "maxFileSize": 52428800,  // 50MB
    "formats": ["mp4", "mov"],
    "codec": "h264"
  }
}
```

### Text (Optional)
```json
{
  "type": "text",
  "constraints": {
    "maxLength": 100,
    "fontFamily": "Roboto",
    "fontSize": 24
  }
}
```

---

## Figma Layer Naming

Mark content slots with brackets:

```
✅ GOOD:
[SLOT: gridImage1 | image | 1:1 | required]
[SLOT: generatedVideo | video | 9:16 | required | 0-15s]
[SLOT: userPrompt | text | 100 chars | optional]

❌ BAD:
Layer 1
Rectangle 23
Image placeholder
```

**Tips:**
- Use bright pink/orange fill for slots (easy to spot)
- Lock branding layers to prevent edits
- Group related elements

---

## File Naming Conventions

Use **kebab-case** for all files:

```
✅ GOOD:
veo-shorts-template.fig
brand-logo.svg
ui-elements-screen-1.svg

❌ BAD:
VeoShortsTemplate.fig
Brand Logo.svg
ui_elements_screen_1.svg
```

---

## Package Structure

```
template-package/
├── 01-figma-files/
│   └── template-name.fig
├── 02-assets/
│   ├── logo.svg
│   ├── ui-elements.svg
│   └── fonts/ (if custom)
├── 03-specification/
│   ├── template-spec.md
│   ├── asset-slots.json
│   └── timing-diagram.pdf
├── 04-reference/
│   ├── preview-mockup.mp4
│   ├── screen-captures/
│   └── example-assets/
└── README.md
```

---

## asset-slots.json Template

```json
{
  "templateId": "template-name-v1",
  "templateName": "Human Readable Name",
  "version": "1.0.0",
  "totalDuration": 17,
  "slots": [
    {
      "id": "slotName1",
      "name": "Slot Display Name",
      "type": "image" | "video" | "text",
      "required": true | false,
      "description": "What this slot is for",
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
        "location": "Top left corner"
      }
    }
  ]
}
```

---

## Design Best Practices

**✅ DO:**
- Use vector graphics (SVG) for branding
- Outline text before exporting
- Keep animations simple (fade, slide, scale)
- Limit to 8-10 asset slots max
- Document timing clearly
- Test with example assets

**❌ DON'T:**
- Use rasterized logos
- Add heavy blur/shadow effects
- Create overly complex animations
- Exceed 30 seconds total duration
- Forget to lock branding layers

---

## Export Checklist

### Assets
- [ ] All SVGs with outlined text
- [ ] Custom fonts included (WOFF2)
- [ ] Screen mockups (720x1280px PNG)
- [ ] Example test assets

### Documentation
- [ ] `template-spec.md` completed
- [ ] `asset-slots.json` all slots defined
- [ ] Timing diagram created
- [ ] Animation notes documented

### Preview
- [ ] Animated mockup video
- [ ] Screen captures of all sections
- [ ] README.md with overview

### Organization
- [ ] Files named with kebab-case
- [ ] Folder structure correct
- [ ] Package zipped and ready

---

## Performance Guidelines

**To ensure 1-2 minute render time:**

| Element | Recommendation |
|---------|----------------|
| **Total Slots** | Max 8-10 per template |
| **Video Duration** | 10-30 seconds total |
| **Image Size** | Under 10MB each |
| **Video Size** | Under 50MB each |
| **Animations** | Simple (no complex paths) |
| **Effects** | Minimal blur/shadows |

---

## Common Mistakes to Avoid

1. **Not marking slots clearly** → Use `[SLOT: ...]` notation
2. **Using wrong aspect ratios** → Check constraints
3. **Text not outlined** → Convert to shapes before export
4. **Missing timing info** → Document when each element appears
5. **Oversized assets** → Compress before including
6. **Inconsistent naming** → Use camelCase for IDs, kebab-case for files
7. **No example assets** → Include test images/videos

---

## Contact & Support

**Questions?**
- Technical: [dev-team@templatestamper.com]
- Design: [design@templatestamper.com]
- PM: [pm@templatestamper.com]

**Resources:**
- Full Guide: `template-creation-guide-for-agencies.md`
- Schema: `asset-slots-schema.json`
- Example: `asset-slots-example-veo-shorts.json`
- Remotion Docs: https://www.remotion.dev/docs/

---

## Timeline

**Typical template creation timeline:**

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Design | 3-5 days | Figma files + assets |
| Handoff | 1 day | Complete package delivery |
| Dev Review | 2-3 days | Feedback & clarifications |
| Development | 3-5 days | React/Remotion conversion |
| Testing | 1-2 days | Preview & adjustments |
| Deployment | 1 day | Live in system |
| **TOTAL** | **1-2 weeks** | Production-ready template |

---

**Last Updated:** 2026-02-04 | **Version:** 1.0
