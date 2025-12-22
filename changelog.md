# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
