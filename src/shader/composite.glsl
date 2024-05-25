#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D u_aboveImage;
uniform sampler2D u_belowImage;
uniform vec2 u_inputOffset;
uniform vec2 u_inputSize;
uniform vec2 u_porterDuff;

varying vec2 v_coord;
varying vec2 v_inputCoord;

vec4 porterDuff(float fa, float fb, vec4 below, vec4 above);
float getPorterDuffArg(float f, float ba, float aa);
void main() {
    bool outside = any(bvec4(lessThan(v_inputCoord, vec2(0.0)), greaterThan(v_inputCoord, vec2(1.0))));
    vec4 cb = texture2D(u_belowImage, v_coord);
    if (outside) {
        gl_FragColor = cb;
        return;
    }
    vec4 ca = texture2D(u_aboveImage, v_inputCoord);
    float fa = getPorterDuffArg(u_porterDuff.x, cb.a, ca.a);
    float fb = getPorterDuffArg(u_porterDuff.y, cb.a, ca.a);
    gl_FragColor = porterDuff(fa, fb, ca, cb);
}

// 0 -> 0, 1 -> 1, -1 -> ba, -2 -> aa, -3 -> 1 - ba, -4 -> 1 - aa
float getPorterDuffArg(float f, float ba, float aa) {
    float rem2 = mod(f, 2.0);
    float a_or_b = rem2 * ba + (1.0 - rem2) * aa;
    float b = 1.0 - step(-2.0, f) + step(-2.0, f) * a_or_b;
    return mix(b, f, step(0.0, f));
}

vec4 porterDuff(float fa, float fb, vec4 below, vec4 above) {
    float aa = above.a;
    float ab = below.a;
    vec3 ca = above.rgb;
    vec3 cb = below.rgb;

    float ao = aa * fa + ab * fb;
    vec3 cm = (1.0 - ab) * ca + ab * cb;
    vec3 co = aa * fa * cm + ab * fb * cb;
    return sign(ao) * vec4(co / ao, ao);
}