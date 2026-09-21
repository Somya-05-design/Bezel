# CLAUDE.md

Guidance for Claude (or any AI coding assistant) working in this repository.

## Project

A mobile-first Progressive Web App (PWA) for framing phone screenshots and screen
recordings inside device mockups (notch/punch-hole/Dynamic Island/etc.), with video
mockups, Ken Burns motion export, content-aware backgrounds, and slideshow/GIF export
as the core differentiators. No login required; anonymous cloud sharing is optional.

See `SPEC.md` for the full technical spec, `PLAN.md` for phased roadmap, and
`TASKS.md` for the current task breakdown.

## Stack

- Frontend: React + Vite, installable PWA (manifest.json + service worker)
- Canvas/compositing: HTML5 Canvas (Fabric.js or Konva.js for layers)
- Device frame masking: SVG masks over `<img>`/`<video>`
- Video export: `ffmpeg.wasm` client-side; server-side render job as fallback
- Backend: Supabase (Storage + Postgres + Row Level Security), anonymous-only, no auth
- Hosting target: static PWA + Supabase; no custom server required for v1 unless the
  render-fallback service is needed

## Core architectural principle

**One shared export engine.** Static image export, video-in-frame, Ken Burns motion
export, and slideshow export are all the same underlying operation: a sequence of
frames, optionally with pan/zoom, composited inside a masked device frame, rendered to
GIF/MP4/PNG. Build this once as a reusable pipeline. Do not implement these as four
separate export paths — that is the single most important thing to get right early,
since every other feature (batch mode, presets, templates) sits on top of it.

## Known platform constraints (do not try to work around these)

- iOS Safari/WebKit does not support `getDisplayMedia`. There is no true in-browser
  live screen recording on iOS. iOS input is: file picker / Share Sheet import of an
  existing recording.
- Android Chrome supports `getDisplayMedia` — in-browser screen recording works there.
- Web Share Target API (receiving shared files into an installed PWA) is stronger on
  Android; iOS relies on the standard Share Sheet "Share to [App]" pattern once
  installed.
- Real branded device silhouettes (exact iPhone/Samsung shapes) carry trademark risk.
  Ship original, abstracted frame designs grouped by **cutout style**, not by brand or
  model name.

## Conventions

- No user accounts in v1. Do not add auth scaffolding unless a task explicitly calls
  for it.
- All uploads/exports should work fully client-side by default; cloud upload is opt-in
  and only triggers on an explicit "get shareable link" action.
- Device frames, backgrounds, and hand-overlay assets are organized by **style/cutout
  category**, not gender or brand — see `SPEC.md` §Hand Context Frames for the
  tone/style/grip axis naming convention.
- Prefer small, composable components for toolbar tools (select, crop, shape, text,
  grid, zoom) — each should be independently testable against the shared canvas state.

## Commands

(Fill in once the project is scaffolded — e.g. `npm run dev`, `npm run build`,
`npm run test`.)

## When picking up a task

1. Check `TASKS.md` for the current phase and unchecked items.
2. Confirm which phase of `PLAN.md` the task belongs to before starting — later-phase
   work (templates, batch mode, landing page) should not block or complicate the
   Phase 1 export engine.
3. Update `TASKS.md` checkboxes as work completes.
