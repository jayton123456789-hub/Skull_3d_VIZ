# Shader Overview

## Core architecture

The shader is a fragment shader that raymarches signed distance fields (SDFs):

- `map(vec3 p)` defines skull geometry and eye material
- `RM(...)` marches rays through distance field
- `calcNormal(...)` estimates normals for shading
- `mainImage(...)` handles camera, shading, and output

## Static avatar behavior

- Camera is fixed and front-facing
- Skull remains centered and stable
- Background is separate and dark
- No floor-plane blending with skull

## Speech-driven jaw

Jaw opening is computed by `JawOpenAmount()` from `u_value4`.

`u_value4` is interpreted as speech energy and converted into an opening angle using:

- thresholding (`JAW_OPEN_MIN`, `JAW_OPEN_MAX`)
- response curve (`JAW_OPEN_CURVE`)
- max angle clamp (`JAW_ANGLE_MAX`)

The lower jaw transform applies this angle for visible speaking motion.

## Performance

`u_value3` controls detail:

- lower values = faster
- higher values = cleaner normals and edges

Tune for your target device profile.
