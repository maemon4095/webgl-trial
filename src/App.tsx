import {} from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import render from "./render.ts";

export default function App() {
  const [transform, setTransform] = useState({ left: 0, top: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function fitCanvas() {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    const containerAspectRatio = container.clientHeight / container.clientWidth;
    const canvasAspectRatio = canvas.height / canvas.width;
    const scale = canvasAspectRatio > containerAspectRatio
      ? container.clientHeight / canvas.height
      : container.clientWidth / canvas.width;
    const left = (container.clientWidth - canvas.width * scale) * 0.5;
    const top = (container.clientHeight - canvas.height * scale) * 0.5;
    setTransform({ left, top, scale });
  }

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      fitCanvas();
    });

    observer.observe(containerRef.current!);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("render");
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("webgl2");
    if (ctx === null) {
      throw new Error("failed to init webgl");
    }
    render(ctx);
  });

  return (
    <div
      ref={containerRef}
      style="width: 100%; height: 100%; transform: translate(0px, 0px);"
    >
      <canvas
        ref={canvasRef}
        width="512"
        height="512"
        style={`position: absolute; transform-origin: top left; transform: translate(${transform.left}px, ${transform.top}px ) scale(${transform.scale});`}
      />
    </div>
  );
}
