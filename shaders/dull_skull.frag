// "Dull Skull"
// Prologue
// 2024
// by KΛTUR
//
// Tweaks:
// - Static, front-facing skull (no camera drift)
// - No rave overlays/warping; clean dark background
// - Jaw is audio-reactive to mimic speaking

// u_value  = intensity/brightness
// u_value2 = speed
// u_value3 = detail/complexity (march steps / normal eps)
// u_value4 = beat/pulse (eye sparkle)
// u_value5 = camera shake amount

#define PI 3.141592
#define sat(x) clamp(x, 0.0, 1.0)

const float SKULL_START_SECONDS = 26.0;
const float SKULL_FADE_SECONDS = 4.0;
const float FRONT_LOCK_SECONDS = 18.0;

const float ZOMBIE_FIRE_START = 44.8;
const float ZOMBIE_FIRE_DURATION = 3.0;
const float EYE_RED_START = 44.8;
const float EYE_RED_DURATION = 5.0;
const float END_ZOOM_START = 160.0;
const float END_ZOOM_DURATION = 1.1;

// Jaw sensitivity tuning (edit these for speech responsiveness)
const float JAW_OPEN_MIN = 0.03;
const float JAW_OPEN_MAX = 0.78;
const float JAW_OPEN_CURVE = 0.72;
const float JAW_ANGLE_MAX = 0.52;

float SkullReveal() {
    return smoothstep(SKULL_START_SECONDS, SKULL_START_SECONDS + SKULL_FADE_SECONDS, time);
}

float MotionUnlock() {
    return smoothstep(SKULL_START_SECONDS + SKULL_FADE_SECONDS,
                      SKULL_START_SECONDS + SKULL_FADE_SECONDS + FRONT_LOCK_SECONDS,
                      time);
}


float ZombieFireAmount() {
    float localT = time - ZOMBIE_FIRE_START;
    float on = smoothstep(0.0, 0.22, localT);
    float off = 1.0 - smoothstep(ZOMBIE_FIRE_DURATION - 0.6, ZOMBIE_FIRE_DURATION, localT);
    return sat(on * off);
}

float EyeRedAmount() {
    float localT = time - EYE_RED_START;
    float on = smoothstep(0.0, 0.25, localT);
    float off = 1.0 - smoothstep(EYE_RED_DURATION - 0.9, EYE_RED_DURATION, localT);
    return sat(on * off);
}

float EndZoomAmount() {
    return smoothstep(END_ZOOM_START, END_ZOOM_START + END_ZOOM_DURATION, time);
}

// --------- basic helpers ----------
mat2 Rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// https://mercury.sexy/hg_sdf/
float pModPolar(inout vec2 p, float repetitions) {
    float angle = 2.0*PI/repetitions;
    float a = atan(p.y, p.x) + angle;
    float r = length(p);
    float c = floor(a / angle);
    a = mod(a, angle) - angle * 0.5;
    p = vec2(cos(a), sin(a)) * r;
    if (abs(c) >= (repetitions * 0.5)) c = abs(c);
    return c;
}

// iq smooth ops
float sMin(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}
float sMax(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5*(d2+d1)/k, 0.0, 1.0);
    return mix(d2, -d1, h) + k*h*(1.0-h);
}

float Sphere(vec3 p,float s){ return length(p)-s; }

float Ellipsoid(vec3 p, vec3 r){
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/max(k1, 1e-6);
}

float rBox(vec3 p, vec3 b, float r){
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float Capsule(vec3 p, vec3 a, vec3 b, float r){
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-6), 0.0, 1.0);
    return length(pa - ba*h) - r;
}

float HollowSphere(vec3 p, float r, float h, float t){
    float w = sqrt(max(r*r-h*h, 0.0));
    vec2 q = vec2(length(p.xz), p.y);
    float d = (h*q.x < w*q.y) ? length(q-vec2(w,h)) : abs(length(q)-r);
    return d - t;
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z){
    vec3 f = normalize(l-p);
    vec3 r = normalize(cross(vec3(0.0,1.0,0.0), f));
    vec3 u = cross(f,r);
    vec3 c = f*z;
    vec3 i = c + uv.x*r + uv.y*u;
    return normalize(i);
}


vec3 hsv2rgb(vec3 c){
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0))*6.0 - 3.0);
    vec3 rgb = clamp(p - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

vec3 RavePalette(float t){
    return hsv2rgb(vec3(fract(t), 0.9, 1.0));
}


vec3 BeatBands(float beat){
    float low = smoothstep(0.18, 0.70, beat) * (1.0 - smoothstep(0.75, 0.98, beat));
    float mid = smoothstep(0.35, 0.88, beat);
    float high = pow(smoothstep(0.72, 0.99, beat), 2.0);
    return vec3(sat(low), sat(mid), sat(high));
}

float DropGate(float t){
    float open = smoothstep(SKULL_START_SECONDS + 10.0, SKULL_START_SECONDS + 20.0, t);
    return open;
}

float PeakGate(float beat){
    return smoothstep(0.78, 0.97, beat);
}

float hash31(vec3 p){
    p = fract(p*0.1031);
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec3 AudioProfile(float t, float br, float spd, float det, float beat, float shake){
    // Coarse windows to extract track-dependent "DNA" from control motion.
    float w1 = floor(t*0.33);
    float w2 = floor(t*0.57 + 11.0);
    float w3 = floor(t*0.81 + 23.0);

    float a = hash31(vec3(w1, br*7.3 + beat*13.7, spd*5.1 + shake*3.7));
    float b = hash31(vec3(w2, det*9.1 + beat*4.3, br*2.9 + spd*8.3));
    float c = hash31(vec3(w3, shake*11.7 + beat*6.1, det*4.9 + br*10.1));

    // Smoothly morph profile over time with incoming audio/controls.
    vec3 base = vec3(a,b,c);
    vec3 drift = vec3(
        0.5 + 0.5*sin(t*0.31 + beat*4.0 + br*2.0),
        0.5 + 0.5*cos(t*0.27 + det*3.0 + spd*3.2),
        0.5 + 0.5*sin(t*0.41 + shake*5.0 + beat*2.6)
    );
    return mix(base, drift, 0.45);
}

// --------- scene-specific ----------
const float MAX_DIST  = 24.0;
const float SURF_DIST = 0.005;
float H = 1.8;

// was "t(time)" in source; rename to avoid collisions
float tAnim(float tm){
    float tt = 3.0 + tm*0.5;
    tt += sin(tm*0.5)*0.3;
    return tt;
}

float sabs(float x){
    float a = 0.3;
    return sqrt(x*x + a*a) - a;
}

float f2(vec3 p){
    float sdf = p.y;
    for(float j = 2.56; j < 6.0; j += j){
        sdf += (sabs(dot(sin(p.z*0.1 + p/j), vec3(0.2))) - 0.1) * j;
    }
    sdf = min(sdf, p.y + H);
    return sdf;
}

float JawOpenAmount(){
    float b = sat(u_value4);
    float responsive = pow(smoothstep(JAW_OPEN_MIN, JAW_OPEN_MAX, b), JAW_OPEN_CURVE);
    return responsive * JAW_ANGLE_MAX;
}

vec3 Transform(vec3 p, float tt){
    p.y -= 0.4;
    return p;
}

// returns (distance, material) where material 1 = eyeballs
vec2 map(vec3 p){
    float tt = 0.0;
    mat2 ani = Rot(-JawOpenAmount());

    vec3 p_skull = Transform(p, tt);

    // HEAD
    vec3 p_head = p_skull;
    float d = Ellipsoid(p_head, vec3(0.9,1.1,1.2));

    float p_cutb = p_head.y + 0.7 + sin(p_head.x + sin(cos(p_head.z*1.4))*21.0)*0.02;
    p_cutb = sMin(p_cutb, Ellipsoid(p_head-vec3(0.0,-0.3,-0.2), vec3(0.7)), 0.05);
    p_cutb = sMin(p_cutb, Ellipsoid(p_head-vec3(0.0,-0.24,0.5), vec3(0.51)), 0.1);
    d = sMax(p_cutb, d, 0.05);

    float p_cutf = -p_head.z + 1.1;
    d = sMax(p_cutf, d, 0.2);

    float cuts_temple = Capsule(vec3(-abs(p_head.x), p_head.yz), vec3(-1.0,-1.0,0.8), vec3(-1.8,3.0,0.0), 0.5);
    d = sMax(cuts_temple, d, 0.3);

    float bcut_temple = Capsule(p_head, vec3(-2.0,-1.1,0.6), vec3(2.0,-1.1,0.6), 0.6);
    d = sMax(bcut_temple, d, 0.3);

    // UPPER JAW
    vec3 p_jaw = p_skull - vec3(0.0,0.36,0.1);
    p_jaw.yz *= Rot(PI);
    p_jaw.y -= sin(p_jaw.x*37.0)*0.007 - cos(p_jaw.z*59.0)*0.001;
    p_jaw.z *= 0.9;

    float ujaw = HollowSphere(p_jaw + vec3(0.0,-0.95,0.5), 0.38, 0.02, 0.05);
    float p_cutB = p_skull.z - 0.6;
    ujaw = sMax(p_cutB, ujaw, 0.05);

    vec3 p_jawsc = vec3(abs(p_skull.x), p_skull.yz);
    p_jawsc.xy *= Rot(-1.0);
    p_jawsc.yz *= Rot(-0.4);
    p_jawsc.y += 0.3;
    ujaw = sMax(p_jawsc.y, ujaw, 0.04);

    d = sMin(ujaw, d, 0.1);
    d -= sin(10.0*p_skull.x)*sin(8.0*p_skull.y)*sin(6.0*p_skull.z)*0.03;

    // CHEEKBONES
    vec3 p_eyesur = p_skull - vec3(0.0,0.3,0.0);
    float eyesur = Ellipsoid(vec3(abs(p_eyesur.x), p_eyesur.yz) + vec3(-0.34,0.5,-0.87), vec3(0.25,0.3,0.2));
    eyesur += sin(12.0*p_skull.x)*sin(11.0*p_skull.y)*sin(13.0*p_skull.z)*0.02;
    d = sMin(eyesur, d, 0.1);

    // ZYGOMATIC ARCH
    vec3 p_zyg = vec3(abs(p_skull.x), p_skull.yz);
    p_zyg.x += sin(p_zyg.z*4.0+PI)*0.08;
    p_zyg.y += cos(p_zyg.z*9.0)*0.03;
    float zyg = Capsule(p_zyg, vec3(0.5,-0.3,0.8), vec3(0.75,-0.3,0.1), (p_zyg.z)*0.1);
    d = sMin(d, zyg, 0.06);

    // NOSE BONE
    vec3 p_nbone = p_skull;
    p_nbone.yz *= Rot(-2.2);
    float nbone = HollowSphere(p_nbone + vec3(0.0,-1.0,0.4), 0.1, 0.08, 0.04);
    d = sMin(d, nbone, 0.05);

    // NOSE HOLE
    vec3 p_nose = p_skull;
    p_nose.xy *= Rot(0.25);
    float nose = Ellipsoid(p_nose - vec3(0.04,-0.35,1.0), vec3(0.03,0.1,0.8));
    p_nose.xy *= Rot(-0.4);
    nose = sMin(nose, Ellipsoid(p_nose - vec3(0.02,-0.36,1.0), vec3(0.04,0.1,0.8)), 0.1);
    d = sMax(nose, d, 0.06);
    d = sMax(Ellipsoid(p_nose + vec3(0.0,0.3,-0.4), vec3(0.1,0.1,0.6)), d, 0.1);

    // LOWER JAW (pN is jaw parent)
    vec3 pN = p_skull;
    pN.z -= 0.5;
    pN.y += 0.4;
    pN.yz *= ani;
    pN.z += 0.5;
    pN.y -= 0.4;
    pN -= sin(pN.y*15.0)*0.01 - cos(pN.z*39.0)*0.002;

    vec3 p_ljaw = pN;
    p_ljaw.y *= 0.8;
    p_ljaw.z -= sin(pN.y*26.0)*0.008;
    p_ljaw.y -= cos(pN.x*15.0 + sin(pN.y*7.0)*2.0)*0.01;
    float ljaw = HollowSphere(p_ljaw + vec3(0.0,0.77,-0.74), 0.38, 0.03, 0.04);
    ljaw = sMax(p_ljaw.z - 0.65, ljaw, 0.1);

    vec3 p_maB = vec3(abs(pN.x), pN.yz);
    p_maB.yz *= Rot(-1.3);
    p_maB.xz *= Rot(-0.34);
    p_maB.xy *= Rot(-0.39);
    p_maB -= vec3(0.85,0.0,0.63);

    ljaw = sMin(ljaw, rBox(p_maB, vec3(0.0, smoothstep(0.0,6.0,abs(-p_maB.z)+0.9), 0.45), 0.04), 0.17);
    ljaw = sMax(Ellipsoid(p_maB - vec3(0.0,0.0,-0.55), vec3(0.5,0.15,0.26)), ljaw, 0.04);
    p_ljaw -= sin(p_ljaw.y*22.0)*0.001 - cos(p_ljaw.z*19.0)*0.006;
    ljaw = sMax(p_ljaw.y + 0.93, ljaw, 0.02);
    d = sMin(ljaw, d, 0.002);

    // EYE HOLES
    vec3 p_eyeH = p_skull;
    p_eyeH += sin(p_eyeH.x*29.0 + cos(p_eyeH.y*32.0))*0.005;
    float eyes = Ellipsoid(vec3(abs(p_eyeH.x), p_eyeH.y-0.4, p_eyeH.z) + vec3(-0.29,0.49,-1.1), vec3(0.21,0.25,0.25));
    float eyeH = sMin(eyes, Sphere(vec3(abs(p_skull.x),p_skull.yz) - vec3(0.25,0.0,0.7), 0.35), 0.05);
    eyeH = sMax(-p_eyeH.y, eyeH, 0.2);
    d = sMax(eyeH, d, 0.05);

    // EYE SOCKETS - hollow with red back (material 1)
    vec3 p_eye = p_skull;
    p_eye.x = abs(p_eye.x);
    p_eye.y -= 0.4;
    p_eye += vec3(-0.29,0.57,-0.9);
    // Full sphere
    float eyesBall = Ellipsoid(p_eye, vec3(0.2));
    // Subtract front part to make hollow socket (keep only back-facing surface)
    float eyeFront = -p_eye.z + 0.05; // cut off front
    eyesBall = max(eyesBall, eyeFront);

    // UPPER TEETH
    vec3 p_tooth = p_skull - vec3(0.0,-0.77,0.7);
    p_tooth *= vec3(1.2,1.0,1.0);
    pModPolar(p_tooth.xz, 32.0);
    float teeth = Ellipsoid(p_tooth - vec3(0.43,0.0,0.0), vec3(0.03,0.15,0.045));
    teeth = max(teeth, -p_skull.y - 0.73 + sin(p_skull.x*32.0)*0.006);
    teeth = max(teeth, -p_skull.z + 0.7);
    teeth = sMax(Sphere(p_skull - vec3(0.02,-0.88,0.98), 0.23), teeth, 0.01);
    d = min(d, teeth);

    // LOWER TEETH
    vec3 p_ltooth = pN - vec3(0.0,-0.77,0.7);
    p_ltooth *= vec3(1.2,1.0,1.0);
    pModPolar(p_ltooth.xz, 32.0);
    float lteeth = Ellipsoid(p_ltooth - vec3(0.42,0.0,0.0), vec3(0.03,0.15,0.045));
    lteeth = max(lteeth, pN.y + 0.79 + sin(p_skull.x*29.0)*0.004);
    lteeth = max(lteeth, -pN.z + 0.7);
    lteeth = sMax(Sphere(pN - vec3(0.005,-0.87,0.89), 0.24), lteeth, 0.02);
    d = min(d, lteeth);

    vec2 res = vec2(d, 0.0);
    if (eyesBall < d) res = vec2(eyesBall, 1.0);
    return res;
}

vec2 RM(vec3 ro, vec3 rd, int steps){
    float tt = 0.0;
    float mat = 0.0;
    for(int i=0;i<64;i++){
        if(i >= steps) break;
        vec3 p = ro + rd * tt;
        vec2 m = map(p);
        float d = m.x;
        mat = m.y;
        tt += d;
        if(tt > MAX_DIST || abs(d) < SURF_DIST) break;
    }
    return vec2(tt, mat);
}

vec3 calcNormal(vec3 p, float eps){
    vec2 e = vec2(eps, 0.0);
    float dx = map(p + e.xyy).x - map(p - e.xyy).x;
    float dy = map(p + e.yxy).x - map(p - e.yxy).x;
    float dz = map(p + e.yyx).x - map(p - e.yyx).x;
    return normalize(vec3(dx,dy,dz) + 1e-6);
}

vec3 Background(vec2 uv, float br) {
    vec3 bgA = vec3(0.01, 0.01, 0.015);
    vec3 bgB = vec3(0.03, 0.03, 0.04);
    vec3 col = mix(bgA, bgB, sat(uv.y * 0.5 + 0.5));
    float v = smoothstep(1.25, 0.15, length(uv));
    col *= 0.35 + 0.65 * v;
    return col * mix(0.45, 1.1, br);
}



float hash21(vec2 p){
    p = fract(p*vec2(123.34, 345.45));
    p += dot(p, p+34.23);
    return fract(p.x*p.y);
}

float noise2(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash21(i);
    float b = hash21(i+vec2(1.0,0.0));
    float c = hash21(i+vec2(0.0,1.0));
    float d = hash21(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float fbm2(vec2 p){
    float v = 0.0;
    float a = 0.5;
    for(int i=0;i<4;i++){
        v += a*noise2(p);
        p = p*2.03 + vec2(7.1, -3.7);
        a *= 0.5;
    }
    return v;
}

vec3 FireGust(vec2 uv, float fireAmt, float beat) {
    vec2 mouth = vec2(0.0, -0.15);
    vec2 q = uv - mouth;

    vec2 dir = normalize(vec2(0.95, 0.10));
    float along = dot(q, dir);
    float side = dot(q, vec2(-dir.y, dir.x));

    float localT = time - ZOMBIE_FIRE_START;
    float blastShape = exp(-pow((localT - 1.1) * 1.15, 2.0));
    float reach = mix(0.3, 1.35, blastShape);

    float widthBase = mix(0.035, 0.22, sat(along / max(reach, 1e-4)));
    float n = fbm2(vec2(along*8.0 - time*5.0, side*22.0 + time*2.3));
    float n2 = fbm2(vec2(along*14.0 - time*8.5, side*35.0 - time*3.2));
    float wWarp = mix(0.75, 1.35, n);
    float width = widthBase * wWarp;

    float plume = sat(1.0 - abs(side)/max(width, 1e-4)) * sat(1.0 - along/max(reach, 1e-4)) * step(0.0, along);
    float tongues = sat(plume * (0.65 + 0.55*n2));

    float core = pow(plume, 1.8) * (0.9 + 0.25*n);
    float mid = pow(tongues, 1.1);
    float smokeEdge = pow(plume, 0.5) * (1.0 - pow(plume, 1.6));

    vec3 col = vec3(0.0);
    col += vec3(2.2, 1.3, 0.45) * core;
    col += vec3(1.3, 0.22, 0.03) * mid;
    col += vec3(0.35, 0.05, 0.03) * smokeEdge * 0.6;

    float muzzle = exp(-38.0*dot(q, q));
    col += vec3(2.8, 0.45, 0.08) * muzzle * (0.6 + 0.4*beat);

    float flicker = 0.85 + 0.15*sin(time*36.0 + along*12.0);
    return col * fireAmt * flicker;
}


vec3 RaveOverlay(vec2 uv, float beat, float energy, float t, float laserEnable, vec3 profile){
    vec3 laserCol = vec3(0.0);
    vec3 bands = BeatBands(beat);

    // low band: fan lasers from stage floor
    vec2 p = uv - vec2(0.0, -0.68);
    float a = atan(p.y, p.x);
    float r = length(p);
    float beamFreq = mix(12.0 + profile.x*6.0, 22.0 + profile.y*8.0, bands.x);
    float beams = abs(sin((a + t*1.5)*beamFreq));
    float beamMask = smoothstep(0.90, 1.0, beams) * smoothstep(1.25, 0.10, r);
    vec3 beamColor = RavePalette(t*0.13 + a*0.24 + profile.z*0.6);
    laserCol += beamColor * beamMask * (0.5 + 1.6*bands.x) * laserEnable;

    // mid band: crossing diagonal scanners
    float diagA = smoothstep(0.992, 1.0, sin((uv.x+uv.y)*(17.0+profile.x*8.0) - t*(7.0+profile.y*3.0)));
    float diagB = smoothstep(0.992, 1.0, sin((uv.x-uv.y)*(15.0+profile.z*7.0) + t*(6.0+profile.x*3.0)));
    laserCol += RavePalette(t*0.28 + 0.1) * diagA * (0.5 + 0.9*bands.y) * laserEnable;
    laserCol += RavePalette(t*0.31 + 0.6) * diagB * (0.45 + 0.85*bands.y) * laserEnable;

    // high band: vertical hard lasers + impact burst
    float vscan = smoothstep(0.995, 1.0, sin(uv.x*(30.0+profile.y*16.0) + t*(10.0+profile.z*5.0)));
    laserCol += vec3(0.9, 0.15, 1.0) * vscan * (0.7 + 1.8*bands.z) * laserEnable;

    float burst = pow(smoothstep(0.86, 0.995, beat), 3.0) * laserEnable;
    float ring = 1.0 - smoothstep(0.02, 0.18, abs(length(uv) - (0.28 + 0.05*sin(t*4.0))));
    laserCol += RavePalette(t*0.5 + 0.2) * ring * burst * 1.8;

    // universal strobe (works for rap/dubstep/anything with transients)
    float strobe = pow(beat, 8.0) * (0.4 + 0.6*energy);
    laserCol += vec3(1.0) * strobe * 0.32 * laserEnable;

    return laserCol;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 R = max(resolution, vec2(1.0));
    vec2 uv = (fragCoord - 0.5*R) / R.y;

    float br   = sat(u_value);
    float det  = sat(u_value3);

    // Fixed camera: skull always facing viewer.
    vec3 ro = vec3(0.0, 0.0, 4.0);
    vec3 rd = GetRayDir(uv, ro, vec3(0.0,0.0,0.0), 1.0);

    int steps = int(mix(24.0, 34.0, det));
    float epsN = mix(0.0025, 0.0010, det);

    vec2 hit = RM(ro, rd, steps);
    float dist = hit.x;
    float mat  = hit.y;

    vec3 bg = Background(uv, br);
    vec3 col = bg;

    if(dist < MAX_DIST){
        vec3 p = ro + rd*dist;
        vec3 n = calcNormal(p, epsN);

        bool isEye = mat > 0.5;
        if (isEye) {
            float viewDot = abs(dot(-rd, n));
            float radial = 1.0 - viewDot;
            vec3 darkColor = vec3(0.03, 0.0, 0.0);
            vec3 edgeColor = vec3(0.22, 0.02, 0.02);
            col = mix(darkColor, edgeColor, radial * 0.55);
            float glow = 1.0 - smoothstep(0.0, 0.45, radial);
            col += vec3(0.9, 0.08, 0.05) * glow;
        } else {
            float fresnel = pow(1.0 + dot(rd, n), 2.0);
            vec3 skullCol = vec3(0.03);
            skullCol += fresnel * 0.3;
            vec3 l = normalize(vec3(0.45, 0.8, 0.35));
            skullCol += 0.20 * max(dot(n, l), 0.0);
            col = skullCol * 0.78;
        }
    }

    col *= mix(0.45, 1.25, br);
    col = pow(max(col, 0.0), vec3(0.72));
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}

void main(){
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
