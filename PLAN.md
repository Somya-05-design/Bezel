# PLAN.md — Phased Roadmap

See `SPEC.md` for technical detail behind each item, `TASKS.md` for granular
checklist.

## Phase 1 — Core Engine
Goal: prove the shared export engine works before building UI around it.

1. Device frame + SVG cutout-mask system (static image only, one frame to start)
2. Shared export engine: `compositeFrame` + `encodeSequence` (image → PNG first,
   then image sequence → GIF/MP4)
3. Video-in-frame: extend engine to accept video source
4. Content-aware background sampling

**Exit criteria:** a single image and a single video can each be framed and exported
to a file, with an auto-generated background, without any toolbar UI yet.

## Phase 2 — Editor UX
5. Toolbar: bottom tools (select, crop, shapes, text, grid, zoom, reset) + side
   toolbar (container style, backgrounds) + top nav (logo, upload, slideshow
   dropdown)
6. Annotation tools: pen, arrow, text, shapes, blur, crop, undo/redo
7. Smart crop: default-on behavior + toggle + persistence on disable
8. Keyboard shortcuts + `?` cheat-sheet overlay

**Exit criteria:** a user can go from upload to a fully annotated, framed export
using only the UI, no manual code/config.

## Phase 3 — Sharing & Growth Features
9. Supabase wiring: anonymous upload, slug generation, `/i/{slug}` share page with OG
   tags
10. Ken Burns motion export UI (draggable keyframes, duration, easing, presets)
11. Slideshow + boomerang/GIF export
12. Preset export sizes dropdown
13. Templates (save/load named presets)
14. Batch mode (multi-file, shared config, zip/individual output)

**Exit criteria:** all four core differentiators (video-in-frame, Ken Burns,
content-aware background, slideshow/boomerang) are usable end-to-end from the UI,
plus optional cloud sharing.

## Phase 4 — Polish & Launch Prep
15. Landing page (visual identity, showcase examples, install messaging)
16. PWA install experience: icons, splash screens, install prompts (Android + iOS)
17. Performance pass on video export — confirm/tune the client-vs-server render
    threshold from `SPEC.md` §3

## Phase 5 — Post-v1 Expansion (not required for launch)
- Hand context frames (see `SPEC.md` §6) — start with trimmed asset set, expand by
  usage
- Native wrapper for iOS ReplayKit live recording, if user demand requires it
- Full device-frame color-variant coverage
- Anonymous-upload expiry policy tuning based on real storage usage

## Risks to revisit before committing later phases
- Client-side video export performance on lower-end phones (validate in Phase 1,
  not after building UI around an assumption)
- Trademark exposure if frame art drifts toward exact device replicas
- Supabase storage cost growth without an expiry policy in place before Phase 3
  ships publicly
