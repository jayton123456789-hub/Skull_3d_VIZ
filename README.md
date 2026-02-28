# Dull Skull Avatar Shader

A standalone GLSL skull avatar designed for **AI assistant speaking visualization**.

- Static, front-facing skull (no camera drift)
- Fully raymarched 3D SDF skull
- Audio-reactive jaw movement (speech-energy input)
- Easy to embed in WebGL-based apps

## Repository layout

- `shaders/dull_skull.frag` — main shader
- `examples/basic-webgl.html` — minimal drop-in WebGL demo
- `docs/INTEGRATION.md` — integration guide for apps
- `docs/SHADER_OVERVIEW.md` — how the shader works

## Quick start

### 1) Run the example

Serve this repo with any static server, then open `examples/basic-webgl.html`.

Examples:

```bash
python -m http.server 8080
# or
npx serve .
```

Open:

- `http://localhost:8080/examples/basic-webgl.html`

### 2) Drive speaking energy

Update uniform `u_value4` each frame with a value in `[0..1]`:

- `0.0` = mouth mostly closed
- `1.0` = mouth opens widest

In a real app, map this to audio RMS/envelope.

## Uniforms (current behavior)

- `time` — seconds
- `resolution` — viewport size
- `u_value` — brightness
- `u_value3` — detail/march quality
- `u_value4` — **speech energy / jaw input**

(Other legacy uniforms may exist for compatibility but are not required for static speaking mode.)

## Jaw sensitivity tuning

Jaw behavior is controlled by constants near the top of `shaders/dull_skull.frag`:

- `JAW_OPEN_MIN` — lower threshold (smaller = reacts sooner)
- `JAW_OPEN_MAX` — upper threshold (smaller = reaches max faster)
- `JAW_OPEN_CURVE` — response curve (smaller = more sensitive early)
- `JAW_ANGLE_MAX` — maximum jaw rotation angle

Default values are tuned for speech-like motion and can be edited safely.

## Standalone 3D note

This version removes the old plane blending that made the skull look like it was sinking/morphing out of the background. The skull now renders as a standalone 3D avatar against a separate dark backdrop.

## Open-source customization suggestions

- Change eye color/glow in `mainImage` eye material branch
- Adjust camera distance by editing `ro` in `mainImage`
- Tune quality/perf with `u_value3` and march steps
- Build expression presets by remapping `u_value4`

For full details see `docs/INTEGRATION.md` and `docs/SHADER_OVERVIEW.md`.

## GitHub Pages deployment

1. Push this repo to GitHub.
2. In **Settings → Pages**, set source to **GitHub Actions**.
3. Add a simple static-pages workflow (or use any static deploy action).
4. Your demo URL will be:
   - `https://<your-user>.github.io/<repo>/examples/basic-webgl.html`

This lets friends test instantly and copy the integration pattern.
