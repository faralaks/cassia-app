# Cassia — what this fork changes

> 🤖 **This document was written entirely by an AI (Claude, by Anthropic).**
> It summarizes a fork whose changes were also largely AI-generated and have **not** been
> fully human-reviewed. Treat it as a map of intent, not a guarantee of behavior.

Cassia is a fork of [Cinny](https://github.com/cinnyapp/cinny) reshaped into a
**Telegram-Desktop-like daily driver** for Matrix. It is a personal client, not a
full-featured Cinny replacement — simplicity and feel are prioritized over feature
completeness. It is meant to run against a self-hosted homeserver.

This file is the high-level overview. Each section maps to a coherent area of the codebase.

---

## Design direction

The target is **Telegram-like, not Discord-like**:

- **Unified home** — one list with a *Direct* section (DMs) above a *Rooms* section, both
  collapsible, both sorted by last activity. No tab-switching to get anywhere.
- **Bubble messages by default** — own messages on the right (accent color), others on the
  left with an avatar. Grouping by sender change only; in-bubble timestamps; double-click a
  bubble to reply.
- **Quiet chrome** — no floating hover action bar (everything is on right-click), no inline
  connection banner (a small sidebar icon shows trouble states only).
- **Green accent** in place of Cinny purple, a new circular logo, and bundled default chat
  backgrounds.

---

## Feature areas

### Messages & layout
Telegram-style bubbles with per-message grouping, reply blocks (colored left border, click to
jump to the original), transparent reaction chips, an "Edited" indicator that opens full edit
history, and media (images/video) rendered bare without a bubble with the timestamp overlaid.
System/state events render inside a dark, readable pill so they survive bright wallpapers.

### Chat style (background & bubbles)
A shared editor used both globally (Settings → Chat Style) and per-room (Room Settings → Chat
Style tab). Controls: background image with a dim slider, incoming/outgoing bubble color +
opacity, bubble corner radius, and bubble text color. Per-room settings override theme-aware
global defaults (dark and light theme groups have separate defaults). Stored locally.

### Avatars
A single resolution path everywhere: **custom photo override → Matrix avatar → colored letter
fallback**, always circular. A custom photo can be set per contact from the contact card and
shows up consistently across the chat list, message bubbles, headers, and member lists.

### Voice messages
- **Playback** — waveform visualization (from the MSC1767 waveform field), drag/click to seek,
  size scaled to clip length, and single-active-clip playback.
- **Recording** — an empty composer turns the Send button into a Mic; recording shows a live
  waveform and timer in place of the text area, with a one-tap cancel. Sent as a standard
  Matrix voice message (MSC1767 waveform + MSC3245 voice marker), encrypted in E2EE rooms.

### Calls (legacy 1:1 audio)
Audio-only 1:1 calls over the **legacy Matrix call protocol** (`m.call.*`), for self-hosted
backends without LiveKit / Element Call. A call button appears in DM headers and becomes a
mic-meter + mute + hang-up cluster while active; incoming calls show a non-blocking prompt so
the timeline stays usable during a ring.

### Direct messages & invites
Proper handling of Matrix's `m.direct` convention: a flat Direct list, inline pending invites
with a Join button (direct invites land under Direct on accept), and a Room Settings toggle to
flip any room between Direct and Room.

### Uploads & image compression
Clear upload-failure messages (instead of opaque errors), automatic image compression for files
over a configurable size limit, and a manual "Compress & send" quality menu on oversized or
failed image attachments.

### Composer
A link tool in the formatting toolbar (insert / edit / remove links, with paste-a-URL-over-a-
selection support) and the voice-recording / image-compression wiring described above.

### Motion
A reduced-motion-aware animation pass (using `motion`) covering message arrival, the
"New Messages" divider, list reordering and section folds, and consistent open/close animation
for anchored popups (emoji board, contact card, pinned messages).

### Encryption resilience
Messages that initially fail to decrypt re-render automatically once keys arrive, and entering a
recovery key also restores the key backup to recover previously undecryptable events.

### Toolchain
TypeScript was bumped to 5.4.5 with bundler module resolution to consume the matrix-js-sdk
type definitions cleanly, plus module augmentation for the custom account-data / state-event
keys this fork uses.

---

## Roadmap & known limitations

- **Desktop packaging** — the companion Tauri wrapper bundles this UI as a native app.
- **Local-only personalization** — chat styles and custom avatars are stored in browser
  storage and are not synced across devices.
- **Legacy calls need both ends** — 1:1 audio works only between clients that speak the legacy
  `m.call.*` protocol (this fork, or classic Element).
- **Placeholder sounds** — the voice-recording minute tick and incoming-call ringtone are
  synthesized placeholders.
- Older, non-bubble message layouts still exist in the code but are no longer exposed.

---

## Credits

Built on [Cinny](https://github.com/cinnyapp/cinny) by
[Ajay Bura](https://github.com/ajbura) and its contributors. Bundled logo and default chat
backgrounds were AI-generated.
