# SPEC.md — Technical Specification

Companion to `PRD.md` (product-level). This file is the engineering-facing spec:
data model, components, and feature-by-feature technical behavior.

## 1. System Overview

- **Frontend**: React + Vite PWA. Installable on Android and iOS home screens.
- **Backend**: Supabase (Storage + Postgres + RLS). No custom auth server.
- **Render pipeline**: shared export engine (see §3) used by all export-producing
  features.
- **Optional render fallback**: a lightweight service for video exports that exceed
  what `ffmpeg.wasm` can handle client-side in reasonable time (long duration or high
  resolution).

## 2. Data Model (Supabase / Postgres)

### `links` table
| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | short random slug, used in share URL `domain.com/i/{id}` |
| `storage_path` | text | path in Supabase Storage bucket |
| `media_type` | text | `image`, `video`, `gif` |
| `created_at` | timestamptz | default now() |
| `expires_at` | timestamptz | nullable; used for anonymous-upload cleanup policy |

### Storage
- Single bucket, anonymous-write via scoped anon key.
- RLS: `insert` allowed for anon role; `select`/`list` restricted so uploads cannot be
  browsed — only fetched by exact known path (i.e., via the `links` row that
  references it).

No `users` table in v1. No auth schema.

## 3. Shared Export Engine

**Concept:** every export is "N frames of visual content, optionally transformed
(pan/zoom), composited inside a masked device frame, encoded to an output format."

### Inputs to the engine
- `source`: image, video, or ordered array of images (slideshow)
- `frame`: selected device frame (SVG mask + frame art + color variant)
- `background`: solid / gradient / custom / content-aware-generated
- `transform`: optional per-frame pan/zoom keyframes (used by Ken Burns and, per
  frame, by slideshow)
- `overlay`: optional hand-context asset (see §6), optional annotation layers
- `outputFormat`: `png`, `mp4`, `gif`, `boomerang-gif`
- `outputSize`: from preset list or custom dimensions

### Output paths
- **Static image** → single composited frame → PNG
- **Video-in-frame** → video source decoded frame-by-frame (or streamed), each frame
  masked/composited live for preview; final export encoded via `ffmpeg.wasm`
  (client) or render-fallback service (server)
- **Ken Burns** → single static source + transform keyframes → sequence of composited
  frames → MP4/GIF via same encoder path as video export
- **Slideshow** → ordered image array, each shown for a duration (with optional
  transform) → sequence of composited frames → MP4/GIF/boomerang-GIF (boomerang =
  sequence + reversed sequence appended)

Because all four reduce to "sequence of composited frames → encode," implement frame
composition and encoding as two decoupled stages:
1. `compositeFrame(source, frame, background, overlay, transformAtT) -> canvas/bitmap`
2. `encodeSequence(frames[], format, fps, duration) -> file`

## 4. Device Frames

- Grouped by **cutout style**: notch, Dynamic Island, punch-hole, waterdrop,
  U-shaped, bezel/no-cutout.
- Each frame asset: frame art (PNG/SVG) + matching SVG clip mask defining the exact
  screen-content region (handles irregular cutout shapes correctly — a plain
  rectangular clip-path is insufficient for notch/punch-hole cutouts).
- Color variants per frame (e.g. black/white/titanium) as separate art or tinted
  programmatically if the frame art supports it.
- Portrait and landscape orientations require separate frame art (not a 90° rotation)
  since bezel proportions and cutout position differ.

## 5. Smart Crop

- On source upload: compute source aspect ratio, select best-fit frame (or best-fit
  crop within the currently selected frame), auto-position.
- Toggle (`Shift+A` / UI control) disables auto behavior; once disabled, user's manual
  crop/position must persist across frame switches (do not reset on frame change).

## 6. Hand Context Frames

Extends the "container style" system (side toolbar item 1) with an optional overlay
layer showing a hand holding the device.

### Asset axes
- **Orientation**: portrait, landscape (separate art per orientation — grip geometry
  differs, not a rotation)
- **Grip**: one-hand hold, two-hand hold
- **Hand side**: left, right
- **Style**: realistic/3D-render style, flat illustration/cartoon style
- **Tone/finish**: skin-tone variants; nail-polish as an independent toggle (not tied
  to a gendered label)

### Naming convention
Asset IDs should encode axes explicitly and avoid gendered terms, e.g.:
`hand_portrait_onehand_right_realistic_tone2_nopolish`
rather than labeling by "male"/"female" hand sets.

### Rendering
- Hand asset is a layer behind the device frame body, in front of the background.
- Pre-rendered per orientation/grip/side/style combination so the device slot aligns
  precisely with the phone frame's position and scale — this is hand-authored/curated
  art, not a runtime composite of separate hand + arbitrary phone position.
- Legal note: do not derive hand assets from existing stock photography (e.g.
  watermarked reference images) — commission or generate original art only.

### v1 scope recommendation
Full matrix (2 orientation × 2 grip × 2 side × 2 style × tone/polish variants) is
15–25+ assets — too much for v1. Launch with a trimmed set (e.g. one-hand portrait,
both styles, 2–3 tone variants) and expand based on usage data. Track this as a
phase-2 expansion in `PLAN.md`.

## 7. Content-Aware Background

- On upload, sample dominant/accent colors from the source image client-side
  (histogram bucket or lightweight k-means over a downsampled copy — do not run this
  on full resolution).
- Generate a gradient or mesh-gradient from the sampled palette; set as default
  background.
- User can lock, adjust, or override with manual/custom background at any time
  without losing the option to regenerate the auto suggestion.

## 8. Annotation Layer

- Tools: pen/freehand, arrow, text, rectangle/shape (dropdown for multiple shapes),
  blur/pixelate (redaction), crop.
- Undo/redo stack shared across annotation actions and crop/transform actions.
- Flattened into the composited frame at export time (see §3, stage 1).

## 9. Sharing

- Local export: always available, no network dependency, uses native OS share sheet.
- Cloud share: uploads final export to Supabase Storage, creates a `links` row,
  returns `domain.com/i/{slug}`. Page at that route renders the media with Open Graph
  tags for link-preview services (Slack, iMessage, etc.).
- No account required for either path.

## 10. Export Presets

Dropdown list at export time (dimensions maintained as a config list, not hardcoded
per-feature, so it can be updated without touching export logic):
App Store (iOS), Play Store, Instagram Post (1080×1080), Instagram Story
(1080×1920), Twitter/X Card, Product Hunt gallery, Custom.

## 11. Templates & Batch Mode

- **Templates**: serialize {frame, background, overlay, layer positions} as a named
  JSON preset; store locally (and optionally in Supabase if cloud save is added
  later).
- **Batch mode**: apply one template/config across multiple uploaded sources; render
  each through the same export engine independently; package image outputs as a zip,
  video outputs as individual files (each needs its own encode pass).
