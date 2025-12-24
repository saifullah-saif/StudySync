# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed - December 24, 2025

#### Mobile Responsiveness: Pages and Components
- **Updated** `client/app/view-notes/[id]/page.tsx` - Mobile responsive note viewing page
  - Stacked layout for document preview and comments on mobile
  - Responsive action buttons with wrapping
  - Adaptive iframe height for different screen sizes
  - Responsive typography scaling
- **Updated** `client/app/library/page.tsx` - Mobile responsive library page
  - Stacked filter controls on mobile
  - Full-width search and select elements
  - Responsive room card grid (1 column on mobile, 2 on tablet, 3 on desktop)
  - Mobile-optimized modals with proper sizing and scrolling
- **Updated** `client/components/booking-modal.tsx` - Mobile-friendly booking modal
  - Full-screen modal on mobile devices
  - Stacked date/time and filter sections
  - 2-column room grid on mobile (vs 3 on desktop)
  - Touch-friendly button sizes
- **Updated** `client/components/room-layout.tsx` - Responsive seat layout
  - Adaptive container height for different screens
  - Smaller seat labels on mobile

**Files Modified:**
- `client/app/view-notes/[id]/page.tsx`
- `client/app/library/page.tsx`
- `client/components/booking-modal.tsx`
- `client/components/room-layout.tsx`

#### Navigation Components: TypeScript Modernization
- **Created** `client/hooks/use-media-query.ts` - TypeScript version of media query hook with proper typing
- **Created** `client/components/mobile-nav.tsx` - TypeScript mobile navigation matching header.tsx styling
- **Created** `client/components/responsive-nav.tsx` - Wrapper component for conditional nav rendering
- **Updated** `client/components/header-gate.tsx` - Integrated responsive navigation (desktop header, mobile nav)
- **Features:** Bottom navigation bar on mobile with quick access to Dashboard, Library, Profile, and full menu sheet
- **Styling:** Consistent with THEME system using primary brand color (#191265) and glass effects

**Files Modified:**
- `client/hooks/use-media-query.ts` (created)
- `client/components/mobile-nav.tsx` (created)
- `client/components/responsive-nav.tsx` (created)
- `client/components/header-gate.tsx` (updated)

### Changed - December 22, 2025

#### Podcast Generation: Python edge-tts → edge-tts-universal Migration
- **Migrated** podcast TTS service from Python `edge-tts` CLI to `edge-tts-universal` npm package
- **Eliminated** Python runtime dependency from podcast generation feature
- **Added** `edge-tts-universal@^1.3.3` and `ffprobe-static` npm packages
- **Maintained** 100% feature parity: voice selection, caching, duration extraction, error handling
- **Updated** `server/services/edgeTtsService.js` with direct JavaScript API integration
- **Created** `server/services/test-edge-tts.js` test suite (all tests passing)
- **Backed up** old implementation to `server/services/edgeTtsService.old.js`
- **Verified** audio generation works identically (4.8s test audio generated successfully)
- **Benefits:** Simplified deployment, faster performance, pure Node.js stack, better maintainability

**Files Modified:**
- `server/services/edgeTtsService.js` (refactored)
- `server/package.json` (dependencies added)
- `EDGE_TTS_MIGRATION.md` (comprehensive migration documentation)
- `changelog.md` (this file)

**Migration Status:** ✅ Complete and production-ready
