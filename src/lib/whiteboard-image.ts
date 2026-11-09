import type { WhiteboardStroke } from "@/lib/whiteboard";

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: WhiteboardStroke
) {
  const points = stroke.points;
  if (points.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(stroke.tool === "eraser" ? 8 : 1.5, stroke.width * width);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
  ctx.beginPath();
  ctx.moveTo(points[0].x * width, points[0].y * height);
  if (points.length === 1) {
    ctx.lineTo(points[0].x * width + 0.01, points[0].y * height + 0.01);
  } else {
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function paintPage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: WhiteboardStroke[],
  pageLabel: string | null
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = "#e7e5e4";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = 32;
  for (let x = step; x < width; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = step; y < height; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();

  if (pageLabel) {
    ctx.fillStyle = "#a8a29e";
    ctx.font = "20px sans-serif";
    ctx.fillText(pageLabel, 24, 32);
  }

  for (const stroke of strokes) drawStroke(ctx, width, height, stroke);
}

export function paintBoard(
  canvas: HTMLCanvasElement,
  strokes: WhiteboardStroke[],
  live: WhiteboardStroke | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  paintPage(ctx, width, height, live ? [...strokes, live] : strokes, null);
}

export async function renderWhiteboardJpeg(pages: WhiteboardStroke[][]): Promise<File | null> {
  if (!pages.some((page) => page.length > 0)) return null;

  const width = 1000;
  const height = 1400;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height * pages.length;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  pages.forEach((strokes, index) => {
    ctx.save();
    ctx.translate(0, index * height);
    paintPage(ctx, width, height, strokes, `Page ${index + 1}`);
    ctx.restore();
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.86);
  });
  if (!blob) return null;
  return new File([blob], "whiteboard.jpg", { type: "image/jpeg" });
}
