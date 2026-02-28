# Integration Guide

This shader is intended to be embedded as an avatar renderer for assistants, bots, or voice interfaces.

## Minimum runtime requirements

Your host must provide these uniforms:

- `time` (float seconds)
- `resolution` (vec2 pixel size)
- `u_value` (brightness)
- `u_value3` (detail)
- `u_value4` (**speech energy input**, 0..1)

## Speaking pipeline

1. Capture mic or TTS playback audio.
2. Compute an envelope (RMS/peak follower), normalize to `[0..1]`.
3. Smooth envelope in app code (attack/release).
4. Send smoothed value to `u_value4` each frame.

### Recommended envelope smoothing

- Attack: `0.15–0.30`
- Release: `0.03–0.12`

Higher attack = snappier mouth opens.
Higher release = slower mouth closing.

## Mapping examples

- Conversation UI (subtle): clamp to `0.0–0.65`
- Energetic avatar: clamp to `0.0–0.95`
- Loud TTS: apply soft-knee compression before sending

## Jaw response editing (in shader)

Edit constants in `shaders/dull_skull.frag`:

- `JAW_OPEN_MIN`
- `JAW_OPEN_MAX`
- `JAW_OPEN_CURVE`
- `JAW_ANGLE_MAX`

## Embedding in another app

- Web app: use WebGL canvas and upload uniforms each frame
- Electron: same as web
- Native wrappers: pass uniform values from host audio engine

If you need phoneme-level lip sync, keep this jaw envelope as fallback and blend with phoneme viseme weights on top.
