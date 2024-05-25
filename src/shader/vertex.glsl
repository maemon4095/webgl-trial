#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec2 a_position; // each vertex position in pixel

uniform vec2 u_inputSize;
uniform vec2 u_inputOffset;
uniform vec2 u_resolution; // canvas resolution passed by javascript

varying vec2 v_coord; // output texture position in pixel that will be passed to flagment shader.
varying vec2 v_inputCoord;

void main() {
    vec2 normalized = a_position / u_resolution;
    vec2 clipSpace = normalized * 2.0 - 1.0;

    v_coord = normalized;
    v_inputCoord = (a_position - u_inputOffset) / u_inputSize;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}