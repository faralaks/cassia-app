// Module augmentation for matrix-js-sdk's strongly-typed account-data / state-event maps.
//
// matrix-js-sdk@41 types `getAccountData` / `setAccountData` / `getStateEvents` /
// `sendStateEvent` with generic keys constrained to `keyof AccountDataEvents` /
// `keyof StateEvents` etc. Cinny uses several custom event types (im.ponies.*,
// in.cinny.*, io.element.recent_emoji) that aren't part of the SDK's built-in maps.
// Registering them here keeps those call sites type-safe without per-site casts.
//
// Content is intentionally permissive (`Record<string, any>`): Cinny validates these
// payloads at runtime with its own content types, and the SDK map only needs the keys
// to exist so the method generics resolve.

import 'matrix-js-sdk';

declare module 'matrix-js-sdk/lib/@types/event' {
  interface AccountDataEvents {
    'in.cinny.spaces': Record<string, any>;
    'io.element.recent_emoji': Record<string, any>;
    'im.ponies.user_emotes': Record<string, any>;
    'im.ponies.emote_rooms': Record<string, any>;
  }

  interface StateEvents {
    'im.ponies.room_emotes': Record<string, any>;
    'in.cinny.room.power_level_tags': Record<string, any>;
  }
}
