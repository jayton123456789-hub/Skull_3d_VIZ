# 💀 Dull Skull Avatar

A real-time **3D raymarched skull avatar** designed for speech visualization.
It is built to be dropped into apps where an AI assistant (or any voice source) needs a speaking visual identity.

## ✨ What this is

- Static, front-facing skull avatar (stable composition)
- Fully SDF raymarched 3D shader (not a 2D sprite)
- Audio-driven jaw animation (`u_value4` = speaking energy)
- Lightweight WebGL demo included
- GitHub Pages workflow included

## 📁 Project structure

- `shaders/dull_skull.frag` — production shader
- `examples/basic-webgl.html` — demo runner with audio source selector
- `docs/INTEGRATION.md` — embedding guide for app developers
- `docs/SHADER_OVERVIEW.md` — shader architecture and tuning notes
- `.github/workflows/pages.yml` — Pages deployment workflow
- `RUN.bat` — one-click Windows launcher

## 🚀 Quick start

### Option A: Windows one-click

Double-click `RUN.bat`.

It will:
1. start a local server,
2. open the demo in a browser tab,
3. serve `examples/basic-webgl.html`.

### Option B: Manual

```bash
python -m http.server 8080
```

Then open:

- `http://localhost:8080/examples/basic-webgl.html`

## 🎙 Audio control modes in the demo

The demo includes an **Audio source** dropdown:

- `Microphone` — direct mic capture
- `Tab audio` — choose browser tab + enable tab audio in share dialog
- `Desktop/System audio` — screen share path with system audio enabled

Click **Start audio input** to attach the selected source.

## 🎛 Main uniforms used

- `time` — elapsed seconds
- `resolution` — viewport size
- `u_value` — brightness
- `u_value3` — detail quality
- `u_value4` — speech energy input (jaw driver)

## 🗣 Jaw sensitivity tuning

Edit these constants in `shaders/dull_skull.frag`:

- `JAW_OPEN_MIN` — lower trigger threshold
- `JAW_OPEN_MAX` — upper threshold for full opening
- `JAW_OPEN_CURVE` — response curve shape
- `JAW_ANGLE_MAX` — maximum jaw opening angle

### Tuning intuition

- More sensitive speaking:
  - lower `JAW_OPEN_MIN`
  - lower `JAW_OPEN_CURVE`
  - increase `JAW_ANGLE_MAX`
- Less twitchy speaking:
  - raise `JAW_OPEN_MIN`
  - increase smoothing in app-side envelope follower

## 🧠 Integration concept (for AI assistant avatars)

1. Compute audio envelope (RMS/peak) from assistant voice output.
2. Normalize to `[0..1]`.
3. Smooth with attack/release.
4. Feed that value to `u_value4` each frame.

That’s enough to get convincing speaking motion.

## 🌐 Publish as GitHub Pages

1. Push this repo to GitHub.
2. Enable **Settings → Pages → GitHub Actions**.
3. Workflow deploys automatically from `main`.
4. Share URL:
   - `https://<your-user>.github.io/<repo>/examples/basic-webgl.html`

## 🛠 Notes

- The shader is intentionally static and avatar-focused.
- Demo now surfaces shader compile/link errors in-page for easier debugging.
- If browser audio capture yields silence, re-run and ensure audio sharing is enabled in the browser prompt.
