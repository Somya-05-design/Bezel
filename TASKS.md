# TASKS.md — Task Checklist

Grouped by phase (see `PLAN.md`). Check off as completed. Add new tasks under the
relevant phase rather than creating a separate list.

## Phase 1 — Core Engine

- [x] Scaffold React + Vite project, PWA manifest boilerplate
- [x] Build one device frame asset (any single cutout style) with matching SVG mask
- [x] Implement `compositeFrame(source, frame, background) -> canvas`
- [x] Render a static image inside the frame, export as PNG
- [x] Implement `encodeSequence(frames[], format, fps, duration) -> file`
- [x] Wire `ffmpeg.wasm`, encode a trivial multi-frame sequence to MP4
- [x] Extend `compositeFrame` to accept a video source, live preview in-frame
- [x] Export a short video-in-frame clip end-to-end
- [x] Implement client-side dominant-color sampling from a source image
- [x] Generate a gradient background from sampled colors, set as default
- [x] Confirm client-side export performance on a representative low-end device;
      record findings against the client/server render threshold decision in
      `SPEC.md` §3

## Phase 2 — Editor UX

- [x] Build bottom toolbar: select/hand, crop, shapes dropdown, text, grid, zoom
      in/out, reset
- [x] Build side toolbar: container style picker, pre-defined backgrounds, custom
      background (solid/gradient/upload)
- [x] Build top nav: logo, upload file, slideshow dropdown (empty state ok for now)
- [x] Implement pen/freehand annotation tool
- [x] Implement arrow tool
- [x] Implement text tool
- [x] Implement shape tool (rectangle minimum, dropdown for more shapes)
- [x] Implement blur/pixelate (redaction) tool
- [x] Implement crop tool (manual)
- [x] Implement shared undo/redo stack across annotation + crop/transform
- [x] Implement smart crop: auto aspect-detect + auto-position on upload
- [x] Implement smart-crop toggle; verify manual crop persists across frame switches
      once disabled
- [x] Implement keyboard shortcuts per `PRD.md` §5.2 table
- [x] Build `?` shortcut cheat-sheet overlay

## Phase 3 — Sharing & Growth Features

- [ ] Set up Supabase project: Storage bucket + `links` table + RLS policies
      (anon insert-only, no list/select browsing)
- [ ] Implement anonymous upload flow from export action
- [ ] Implement slug generation and `links` row creation
- [ ] Build `/i/{slug}` share page with OG meta tags
- [ ] Decide and implement `expires_at` cleanup policy for anonymous uploads
- [ ] Build Ken Burns UI: draggable start/end crop keyframes on canvas
- [ ] Build Ken Burns duration + easing controls
- [ ] Add Ken Burns one-tap presets (slow zoom in, pan left-to-right, subtle drift)
- [ ] Build slideshow management UI (add/reorder/remove images, per-image duration)
- [ ] Implement slideshow export: MP4
- [ ] Implement slideshow export: forward-loop GIF
- [ ] Implement slideshow export: boomerang (forward + reversed sequence)
- [ ] Build export-size preset dropdown (App Store, Play Store, IG post/story,
      Twitter/X, Product Hunt, custom)
- [ ] Implement template save (serialize frame/background/overlay/layers to named
      JSON preset)
- [ ] Implement template load into editor state
- [ ] Build Templates dropdown in top nav
- [ ] Implement batch mode: multi-file upload, shared config application
- [ ] Implement batch export: zip for images, individual files for video

## Phase 4 — Polish & Launch Prep

- [ ] Design and build landing page hero + CTA
- [ ] Build landing page feature showcase section (video mockup, Ken Burns,
      content-aware bg, slideshow/GIF examples)
- [ ] Add "Add to Home Screen" install messaging/prompt flow
- [ ] Produce PWA icons and splash screens for Android + iOS
- [ ] Re-test video export performance end-to-end; finalize client/server render
      threshold
- [ ] Cross-browser/device QA pass (iOS Safari, Android Chrome at minimum)

## Phase 5 — Post-v1 (backlog, not blocking launch)

- [ ] Scope trimmed v1 hand-context asset set (per `SPEC.md` §6 recommendation)
- [ ] Commission/generate original hand-context art (no stock-derived assets)
- [ ] Implement hand-overlay layer in container style system
- [ ] Evaluate native wrapper (e.g. Capacitor) for iOS ReplayKit live recording
- [ ] Expand device-frame color-variant coverage
- [ ] Revisit anonymous-storage expiry policy against real usage data
