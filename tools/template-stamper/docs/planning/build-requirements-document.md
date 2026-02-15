# Template Stamper - Build Requirements Document (BRD)

**Project:** Template Stamper - Vertical Video Ad Automation Tool
**Version:** 1.0
**Date:** 2026-01-28
**Status:** Approved for Development

---

## 1. Executive Summary

### 1.1 Project Overview
Template Stamper is a professional automation tool for creating vertical video advertisements. The system enables users to apply consistent branding templates to variable content assets (images and videos), producing final video assets at scale through a one-click batch generation process.

### 1.2 Business Objectives
- **Scale:** Support 4 markets with up to 16 final video assets per market per month (64 videos/month, ~768 videos/year)
- **Efficiency:** One-click batch generation to increase production scale
- **Consistency:** Maintain consistent branding across all generated videos
- **Speed:** Generate videos in 1-2 minutes per asset with optimization
- **Integration:** Seamless asset transfer from YTM Creative Generator via MCP bridge

### 1.3 Success Criteria
- Generate 64+ videos per month reliably
- Render time: 1-2 minutes per 17-second video
- Template management system supporting 8+ template variations
- Successful MCP integration with YTM Creative Generator
- Job history tracking and status monitoring
- Total operational cost under $20/month

---

## 2. Stakeholders

### 2.1 Primary Users
- **Market Teams:** 4 markets requiring video ad generation
- **Content Creators:** Users generating video variations from templates
- **Administrators:** Managing templates and monitoring system performance

### 2.2 Technical Stakeholders
- **Development Team:** Building and maintaining the system
- **YTM Creative Generator Team:** Integration partners

---

## 3. Functional Requirements

### 3.1 Asset Management

#### 3.1.1 Asset Input
- **FR-1.1:** System SHALL accept asset transfer via MCP bridge from YTM Creative Generator
- **FR-1.2:** System SHALL support JPEG format for image assets
- **FR-1.3:** System SHALL support MPEG format for video assets
- **FR-1.4:** System SHALL provide manual asset upload as fallback option
- **FR-1.5:** System SHALL preview uploaded assets before processing
- **FR-1.6:** System SHALL validate asset format, size, and duration
- **FR-1.7:** System SHALL store assets in Firebase Storage

#### 3.1.2 Asset Organization
- **FR-1.8:** System SHALL organize assets by market and project
- **FR-1.9:** System SHALL support average of 8 content assets per template instance
- **FR-1.10:** System SHALL maintain asset metadata (upload date, source, dimensions)

### 3.2 Template Management

#### 3.2.1 Template Library
- **FR-2.1:** System SHALL maintain a template library with preview capability
- **FR-2.2:** System SHALL support minimum 8 template variations
- **FR-2.3:** System SHALL allow manual template upload via simplified package delivery
- **FR-2.4:** System SHALL display template preview before selection
- **FR-2.5:** System SHALL version control templates for reproducibility

#### 3.2.2 Template Structure
- **FR-2.6:** Templates SHALL be React/Remotion components with prop-based content slots
- **FR-2.7:** Templates SHALL define consistent branding elements (logo, colors, typography, UI elements)
- **FR-2.8:** Templates SHALL define variable content slots for images and videos
- **FR-2.9:** Templates SHALL include timing/animation sequences
- **FR-2.10:** Templates SHALL support SVG vector graphics for branding elements

#### 3.2.3 Template Creation Workflow
- **FR-2.11:** Templates SHALL be created from Figma designs
- **FR-2.12:** Design assets SHALL be exported as SVG files
- **FR-2.13:** Developers SHALL convert SVG and layouts to React components
- **FR-2.14:** Template packages SHALL be uploaded via web interface

### 3.3 Video Generation

#### 3.3.1 Generation Process
- **FR-3.1:** System SHALL provide one-click batch generation interface
- **FR-3.2:** Users SHALL select template from library
- **FR-3.3:** Users SHALL map assets to template content slots
- **FR-3.4:** System SHALL trigger Remotion Lambda rendering jobs
- **FR-3.5:** System SHALL support parallel rendering of multiple videos
- **FR-3.6:** System SHALL optimize assets before rendering (resize/transcode)

#### 3.3.2 Rendering Specifications
- **FR-3.7:** Output format: MP4 (H.264)
- **FR-3.8:** Resolution: 720x1280 (9:16 vertical)
- **FR-3.9:** Frame rate: 24fps
- **FR-3.10:** Target render time: 1-2 minutes per 17-second video
- **FR-3.11:** Quality: High (balanced optimization - Option A)

#### 3.3.3 Output Management
- **FR-3.12:** System SHALL store final videos in Firebase Storage
- **FR-3.13:** System SHALL provide download capability for generated videos
- **FR-3.14:** System SHALL maintain video metadata (template used, assets, generation date)

### 3.4 Job Tracking

#### 3.4.1 Status Monitoring
- **FR-4.1:** System SHALL track job status (queued, processing, completed, failed)
- **FR-4.2:** System SHALL display real-time progress for active jobs
- **FR-4.3:** System SHALL provide job history view
- **FR-4.4:** System SHALL store job records in Firestore database

#### 3.4.2 Error Handling
- **FR-4.5:** System SHALL log rendering errors with details
- **FR-4.6:** System SHALL provide retry capability for failed jobs
- **FR-4.7:** System SHALL notify users of job completion or failure

### 3.5 MCP Bridge Integration

#### 3.5.1 Asset Transfer
- **FR-5.1:** System SHALL implement MCP server for receiving assets from YTM Creative Generator
- **FR-5.2:** System SHALL support bidirectional communication with YTM Creative Generator
- **FR-5.3:** MCP bridge SHALL transfer JPEG images and MPEG videos
- **FR-5.4:** MCP bridge SHALL include asset metadata in transfers

#### 3.5.2 Communication Protocol
- **FR-5.5:** MCP bridge SHALL authenticate connections (to be enhanced in launch phase)
- **FR-5.6:** MCP bridge SHALL handle transfer errors gracefully
- **FR-5.7:** YTM Creative Generator SHALL be updated with MCP client capability

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1.1:** Video rendering: 1-2 minutes per 17-second video (optimized)
- **NFR-1.2:** Batch rendering: 2-3 minutes for 16 videos in parallel
- **NFR-1.3:** Web interface: Page load under 2 seconds
- **NFR-1.4:** Asset upload: Support files up to 100MB

### 4.2 Scalability
- **NFR-2.1:** Support 64 videos per month initially
- **NFR-2.2:** Scale to 200+ videos per month if needed
- **NFR-2.3:** Handle 8+ template variations
- **NFR-2.4:** Support 4+ markets concurrently

### 4.3 Reliability
- **NFR-3.1:** System uptime: 99% availability
- **NFR-3.2:** Rendering success rate: 95%+
- **NFR-3.3:** Data persistence: No data loss for assets or generated videos
- **NFR-3.4:** Error recovery: Automatic retry for transient failures

### 4.4 Maintainability
- **NFR-4.1:** Codebase: Well-documented React/Node.js components
- **NFR-4.2:** Template updates: 1-2 days for new template creation
- **NFR-4.3:** System updates: Minimal downtime for deployments
- **NFR-4.4:** Monitoring: Logging for debugging and performance analysis

### 4.5 Security
- **NFR-5.1:** Asset storage: Secure Firebase Storage with access controls
- **NFR-5.2:** Authentication: To be implemented in launch phase
- **NFR-5.3:** Data transmission: Secure MCP bridge communication
- **NFR-5.4:** API security: Firebase Functions with appropriate permissions

### 4.6 Usability
- **NFR-6.1:** Intuitive web interface for non-technical users
- **NFR-6.2:** Clear status indicators for job progress
- **NFR-6.3:** Preview capability before video generation
- **NFR-6.4:** Simplified template package upload process

### 4.7 Cost
- **NFR-7.1:** Total operational cost: Under $20/month
  - Firebase: ~$5/month
  - Remotion Lambda: ~$10/month
- **NFR-7.2:** Cost efficiency: Under $0.15 per video generated

---

## 5. Technical Requirements

### 5.1 Infrastructure
- **TR-1.1:** Frontend hosting: Firebase Hosting
- **TR-1.2:** Backend: Firebase Cloud Functions
- **TR-1.3:** Database: Firestore
- **TR-1.4:** Storage: Firebase Storage
- **TR-1.5:** Video rendering: Remotion Lambda (AWS)
- **TR-1.6:** Development framework: React/TypeScript

### 5.2 Integration
- **TR-2.1:** MCP bridge for YTM Creative Generator integration
- **TR-2.2:** Firebase Storage ↔ Remotion Lambda data flow
- **TR-2.3:** Webhook/callback system for job status updates

### 5.3 Template Technology
- **TR-3.1:** Template framework: Remotion (React-based)
- **TR-3.2:** Design source: Figma → SVG → React components
- **TR-3.3:** Template packaging: Deployable React component bundles

---

## 6. User Stories

### 6.1 Content Creator User Stories
- **US-1:** As a content creator, I want to select a template from the library so that I can maintain brand consistency
- **US-2:** As a content creator, I want to upload 8 images/videos so that I can create variations of the ad
- **US-3:** As a content creator, I want to click one button to generate all video variants so that I can work efficiently
- **US-4:** As a content creator, I want to see real-time progress of video generation so that I know when videos are ready
- **US-5:** As a content creator, I want to download generated videos so that I can use them in campaigns
- **US-6:** As a content creator, I want to receive assets from YTM Creative Generator automatically so that I don't have to manually transfer files

### 6.2 Administrator User Stories
- **US-7:** As an administrator, I want to upload new templates so that I can add new ad formats
- **US-8:** As an administrator, I want to view job history so that I can monitor system usage
- **US-9:** As an administrator, I want to see rendering errors so that I can troubleshoot issues

### 6.3 Developer User Stories
- **US-10:** As a developer, I want to convert Figma designs to templates so that I can add new creative formats
- **US-11:** As a developer, I want to maintain template code so that I can fix bugs or add features
- **US-12:** As a developer, I want to monitor rendering performance so that I can optimize the system

---

## 7. Constraints & Assumptions

### 7.1 Constraints
- **C-1:** Authentication not required for initial launch (added in final phase)
- **C-2:** Templates require developer involvement for creation/modification
- **C-3:** MCP bridge does not yet exist, must be built from scratch
- **C-4:** Google Cloud infrastructure preferred, but Remotion Lambda (AWS) required for optimal rendering

### 7.2 Assumptions
- **A-1:** Users have basic technical competency to use web interfaces
- **A-2:** YTM Creative Generator can be updated with MCP client capability
- **A-3:** Figma design files will be provided for template creation
- **A-4:** Average video length: 17 seconds (may vary by template)
- **A-5:** Asset quality is sufficient (proper resolution, format, not corrupted)
- **A-6:** Internet connectivity is reliable for cloud rendering

---

## 8. Out of Scope

The following items are explicitly OUT OF SCOPE for the initial build:

- **OS-1:** User authentication system (deferred to launch phase)
- **OS-2:** Visual drag-and-drop template builder
- **OS-3:** In-app video editing capabilities
- **OS-4:** Real-time collaborative editing
- **OS-5:** Mobile application (web-only for now)
- **OS-6:** Advanced analytics and reporting
- **OS-7:** Multi-language support
- **OS-8:** Custom branding per user/organization
- **OS-9:** Video hosting/CDN integration
- **OS-10:** Social media direct publishing

---

## 9. Dependencies

### 9.1 External Dependencies
- **D-1:** Firebase/Google Cloud Platform services
- **D-2:** AWS account and Remotion Lambda setup
- **D-3:** Figma design files for templates
- **D-4:** YTM Creative Generator API/MCP compatibility
- **D-5:** Node.js/React ecosystem packages

### 9.2 Internal Dependencies
- **D-6:** Template Stamper frontend depends on backend API
- **D-7:** Video generation depends on template library
- **D-8:** MCP bridge must be built before YTM integration
- **D-9:** Template upload requires template conversion workflow

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Remotion Lambda rendering issues | Low | High | Use proven Remotion Lambda, extensive testing |
| MCP bridge complexity | Medium | High | Allocate sufficient development time, prototype early |
| Firebase Storage ↔ AWS latency | Low | Medium | Optimize asset transfer, use CDN if needed |
| Template conversion errors | Medium | Medium | Establish clear design-to-code guidelines |
| Asset format incompatibility | Medium | Low | Implement robust validation and error messaging |

### 10.2 Business Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Template creation bottleneck | Medium | Medium | Document template creation process, train multiple developers |
| Scale beyond 64 videos/month | Low | Medium | Architecture supports scaling, monitor costs |
| YTM Creative Generator delays | Low | High | Build manual upload fallback, prioritize MCP development |
| User adoption challenges | Low | Medium | Intuitive UI design, provide documentation |

### 10.3 Cost Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Rendering costs exceed budget | Low | Low | Current volume is well within budget, set up cost alerts |
| Storage costs increase | Low | Low | Implement cleanup policies for old assets/videos |

---

## 11. Timeline & Milestones

### 11.1 Development Phases

**Phase 1: Core Infrastructure** (Week 1-2)
- Milestone 1.1: Firebase project setup complete
- Milestone 1.2: Remotion Lambda configured and tested
- Milestone 1.3: Basic MCP bridge prototype working

**Phase 2: Template Stamper App** (Week 2-3)
- Milestone 2.1: Frontend UI completed (template selection, job tracking)
- Milestone 2.2: Backend job queue and Remotion trigger functional
- Milestone 2.3: Template management system operational

**Phase 3: First Template** (Week 3-4)
- Milestone 3.1: Figma design converted to React/Remotion
- Milestone 3.2: End-to-end rendering tested successfully
- Milestone 3.3: Render time optimized to 1-2 minutes

**Phase 4: YTM Integration** (Week 4)
- Milestone 4.1: YTM Creative Generator updated with MCP client
- Milestone 4.2: Asset transfer tested and working
- Milestone 4.3: End-to-end integration validated

**Total Timeline:** 4-5 weeks

### 11.2 Post-Launch
- **Month 1-3:** Monitor performance, fix bugs, optimize costs
- **Month 3-6:** Add 3-4 additional templates
- **Month 6-12:** Add remaining templates to reach 8 total
- **Launch Phase:** Implement authentication for full market rollout

---

## 12. Success Metrics

### 12.1 Quantitative Metrics
- **M-1:** Videos generated per month: Target 64+, Success ≥ 60
- **M-2:** Average render time: Target 1-2 minutes, Success ≤ 2.5 minutes
- **M-3:** Rendering success rate: Target 95%+, Success ≥ 90%
- **M-4:** System uptime: Target 99%, Success ≥ 98%
- **M-5:** Monthly operational cost: Target <$20, Success ≤ $25
- **M-6:** Template variations: Target 8, Success ≥ 6 by month 12

### 12.2 Qualitative Metrics
- **M-7:** User satisfaction with interface intuitiveness
- **M-8:** Quality of generated videos (brand consistency, no rendering errors)
- **M-9:** Ease of template creation workflow
- **M-10:** Reliability of MCP bridge integration

---

## 13. Acceptance Criteria

The system is considered complete and acceptable when:

1. **AC-1:** All functional requirements (FR-1.1 to FR-5.7) are implemented and tested
2. **AC-2:** Performance meets targets: 1-2 minute render time for 17-second videos
3. **AC-3:** At least 1 production-ready template is deployed and working
4. **AC-4:** MCP bridge successfully transfers assets from YTM Creative Generator
5. **AC-5:** Users can generate batch videos with one-click operation
6. **AC-6:** Job history is tracked and viewable
7. **AC-7:** System operates within $20/month budget for target volume
8. **AC-8:** End-to-end testing passes with 95%+ success rate
9. **AC-9:** Documentation is complete (user guide, template creation guide, API docs)
10. **AC-10:** All critical bugs are resolved

---

## 14. Glossary

- **Template:** React/Remotion component defining consistent branding and variable content slots
- **Asset:** Input image (JPEG) or video (MPEG) file to be inserted into template
- **MCP Bridge:** Model Context Protocol bridge enabling communication between Template Stamper and YTM Creative Generator
- **Remotion:** React-based framework for programmatic video creation
- **Remotion Lambda:** AWS Lambda-based rendering service optimized for Remotion
- **Firebase:** Google Cloud platform providing hosting, storage, database, and serverless functions
- **Job:** A video generation request including template selection and asset mapping
- **Content Slot:** Variable position in template where asset will be inserted
- **Batch Generation:** Creating multiple video variations simultaneously

---

## 15. Approval

This Build Requirements Document represents the agreed-upon scope and requirements for the Template Stamper project.

**Approved By:** Project Stakeholders
**Date:** 2026-01-28
**Version:** 1.0 - Initial Approved Plan

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | Claude Code | Initial document based on stakeholder discussions |

---

**END OF BUILD REQUIREMENTS DOCUMENT**
