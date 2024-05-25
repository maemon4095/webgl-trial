// @deno-types="@loader-type/text.d.ts"
import vertexShader from "./shader/vertex.glsl";
// @deno-types="@loader-type/text.d.ts"
import fragmentShader from "./shader/composite.glsl";
import { sample } from "./assets.ts";

export default async function render(gl: WebGL2RenderingContext) {
    const image = await (async () => {
        const img = new Image();
        return await new Promise<HTMLImageElement>(r => {
            img.onload = () => r(img);
            img.src = sample;
        });
    })();

    const program = gl.createProgram();
    if (program === null) {
        throw new Error("Failed to initialize WebGL.");
    }
    const vs = loadShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error("Failed to compile WebGL program. \n\n" + info);
    }
    gl.useProgram(program);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const positionBuffer = gl.createBuffer();
    writeRectangle(gl, positionBuffer, 0, 0, image.width, image.height);

    // setup attributes
    // tell webgl to assign vertex position to a_position
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        positionLocation,
        2 /** position is two dimensional vector */,
        gl.FLOAT, /** each position element type is float */
        false, /** do not normalize */
        0,
        0
    );

    const [outputTexture, outputFrameBuffer] = createOutputTexture(gl);

    const inputTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    setTextureParams(gl);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const belowImageLocation = gl.getUniformLocation(program, "u_belowImage");
    const aboveImageLocation = gl.getUniformLocation(program, "u_aboveImage");
    gl.uniform1i(belowImageLocation, 0);  // texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, outputTexture);

    gl.uniform1i(aboveImageLocation, 1);  // texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const textureOffsetLocation = gl.getUniformLocation(program, "u_inputOffset");
    const textureSizeLocation = gl.getUniformLocation(program, "u_inputSize");
    const porterDuffLocation = gl.getUniformLocation(program, "u_porterDuff");
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(porterDuffLocation, 1, -4);
    gl.uniform2f(textureSizeLocation, image.width, image.height);
    gl.uniform2f(textureOffsetLocation, 0, 128);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6 /** vertex count; a rectangle = two triangles = 3 * 2 vertices. */);
}

function setTextureParams(gl: WebGL2RenderingContext) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function createOutputTexture(gl: WebGL2RenderingContext) {
    const outputTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, outputTexture);
    setTextureParams(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const outputFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

    return [outputTexture, outputFrameBuffer] as const;
}

function writeRectangle(gl: WebGL2RenderingContext, buffer: WebGLBuffer | null, x: number, y: number, w: number, h: number) {
    const x0 = x;
    const x1 = x + w;
    const y0 = y;
    const y1 = y + h;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        // list vertices in clockwise order.
        // triangle 0: top left half of the rectangle
        x0, y0, //    top left
        x1, y0, //    top right
        x0, y1, // bottom left
        // triangle 1: bottom right half of the rectangle
        x0, y1, // bottom left
        x1, y0, //    top right
        x1, y1, // bottom right
    ]), gl.STATIC_DRAW);
}

function loadShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (shader === null) {
        throw new Error("Failed to load shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Failed to load shader: " + info);
    }

    return shader;
}