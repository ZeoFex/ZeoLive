"use client";

import { useParticipants } from "@livekit/components-react";
import { Eraser, Maximize2, Minimize2, PenLine, Plus, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import { parseParticipantRole } from "@/lib/classroom-participant";
import type { ClassroomRole } from "@/lib/livekit";
import { limitPoints, MAX_WHITEBOARD_PAGES, WHITEBOARD_COLORS, type WhiteboardPoint, type WhiteboardStroke } from "@/lib/whiteboard";
import { paintBoard, renderWhiteboardJpeg } from "@/lib/whiteboard-image";
import { cn } from "@/lib/utils";

const WIDTHS = [
  { id: "thin", value: 0.003, label: "Thin" },
  { id: "medium", value: 0.006, label: "Medium" },
  { id: "thick", value: 0.012, label: "Thick" },
] as const;

export function Whiteboard({
  roomId,
  role,
  className,
  onBindSave,
}: {
  roomId: string;
  role: ClassroomRole;
  className?: string;
  onBindSave?: (save: (() => Promise<void>) | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const canDraw = role === "tutor";
  const { pages, activePage, selectPage, commit, authorId } = useWhiteboard(roomId, {
    writable: canDraw,
  });
  const participants = useParticipants();
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState<string>(WHITEBOARD_COLORS[0]);
  const [width, setWidth] = useState<number>(WIDTHS[1].value);
  const [live, setLive] = useState<WhiteboardStroke | null>(null);
  const [large, setLarge] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [pageHeight, setPageHeight] = useState(960);
  const drawingRef = useRef<WhiteboardStroke | null>(null);
  const pagesRef = useRef(pages);
  const savingRef = useRef(false);
  const strokes = pages[activePage] ?? [];

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const render = () => paintBoard(canvas, pages[activePage] ?? [], drawingRef.current);
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activePage, live, pages]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => {
      setPageHeight(Math.max(720, Math.round(scroller.clientHeight * 2.4)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [large]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [activePage]);

  const studentIds = participants
    .filter((participant) => parseParticipantRole(participant.metadata) === "student")
    .map((participant) => participant.identity)
    .sort()
    .join(",");

  const saveNow = useCallback(async () => {
    if (role !== "tutor" || savingRef.current) return;
    const current = pagesRef.current;
    if (!current.some((page) => page.length > 0)) return;
    savingRef.current = true;
    try {
      const file = await renderWhiteboardJpeg(current);
      if (!file) return;
      const body = new FormData();
      body.set("file", file);
      body.set("studentIds", JSON.stringify(studentIds ? studentIds.split(",") : []));
      const res = await fetch(`/api/classroom/${roomId}/whiteboard/save`, {
        method: "POST",
        credentials: "same-origin",
        body,
        keepalive: true,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(typeof json.error === "string" ? json.error : "Could not save the whiteboard");
      }
      toast.success("Whiteboard saved to this class");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The whiteboard could not be added to the student's materials."
      );
    } finally {
      savingRef.current = false;
    }
  }, [role, roomId, studentIds]);

  useEffect(() => {
    onBindSave?.(saveNow);
    return () => onBindSave?.(null);
  }, [onBindSave, saveNow]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
    const y = rect.height === 0 ? 0 : (event.clientY - rect.top) / rect.height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || event.button !== 0) return;
    if (!large) {
      setLarge(true);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke: WhiteboardStroke = {
      id: crypto.randomUUID(),
      authorId,
      tool,
      color,
      width: tool === "eraser" ? 0.03 : width,
      points: [pointFromEvent(event)],
    };
    drawingRef.current = stroke;
    setLive(stroke);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const current = drawingRef.current;
    if (!current) return;
    const point = pointFromEvent(event);
    const last = current.points[current.points.length - 1];
    const dx = point.x - last.x;
    const dy = point.y - last.y;
    if (dx * dx + dy * dy < 0.000004) return;
    current.points.push(point);
    setLive({ ...current, points: current.points });
  };

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const current = drawingRef.current;
    if (!current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = null;
    setLive(null);
    const stroke = { ...current, points: limitPoints(current.points) };
    void commit({ type: "stroke", page: activePage, stroke });
  };

  const undo = () => {
    const page = pages[activePage] ?? [];
    for (let i = page.length - 1; i >= 0; i -= 1) {
      if (page[i].authorId === authorId) {
        void commit({ type: "undo", page: activePage, id: page[i].id });
        return;
      }
    }
  };

  const clear = () => {
    if ((pages[activePage] ?? []).length === 0) return;
    setClearOpen(true);
  };

  const confirmClear = () => {
    void commit({ type: "clear", page: activePage });
    setClearOpen(false);
  };

  const addPage = () => {
    if (pages.length >= MAX_WHITEBOARD_PAGES) return;
    void commit({ type: "add-page" });
  };

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm",
        large && "fixed inset-x-0 top-0 bottom-[4.75rem] z-40 rounded-none border-x-0",
        className
      )}
      aria-label="Shared whiteboard"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50 px-2 py-2">
        <div className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <PenLine className="h-3.5 w-3.5" />
          Whiteboard
        </div>

        {canDraw ? (
          <>
            <Button
              type="button"
              size="icon"
              variant={tool === "pen" ? "default" : "outline"}
              className="h-8 w-8"
              onClick={() => setTool("pen")}
              aria-label="Pen"
              aria-pressed={tool === "pen"}
            >
              <PenLine className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={tool === "eraser" ? "default" : "outline"}
              className="h-8 w-8"
              onClick={() => setTool("eraser")}
              aria-label="Eraser"
              aria-pressed={tool === "eraser"}
            >
              <Eraser className="h-4 w-4" />
            </Button>

            <div className="mx-1 hidden h-6 w-px bg-stone-200 sm:block" />

            {WHITEBOARD_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={cn(
                  "h-6 w-6 rounded-full border border-black/10",
                  color === swatch && tool === "pen" && "ring-2 ring-primary ring-offset-2"
                )}
                style={{ backgroundColor: swatch }}
                onClick={() => {
                  setColor(swatch);
                  setTool("pen");
                }}
                aria-label={`Ink color ${swatch}`}
              />
            ))}

            <div className="mx-1 hidden h-6 w-px bg-stone-200 sm:block" />

            {WIDTHS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white",
                  width === option.value && tool === "pen" && "border-primary"
                )}
                onClick={() => {
                  setWidth(option.value);
                  setTool("pen");
                }}
                aria-label={`${option.label} stroke`}
              >
                <span
                  className="rounded-full bg-stone-800"
                  style={{
                    width: option.id === "thin" ? 4 : option.id === "medium" ? 8 : 12,
                    height: option.id === "thin" ? 4 : option.id === "medium" ? 8 : 12,
                  }}
                />
              </button>
            ))}
          </>
        ) : (
          <p className="text-xs text-stone-500">View only — your tutor is writing</p>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => setLarge((value) => !value)}
            aria-label={large ? "Shrink whiteboard" : "Enlarge whiteboard"}
          >
            {large ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {canDraw && (
            <>
              <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={undo} aria-label="Undo my last stroke">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={clear} aria-label="Clear this page">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-200 bg-white px-2 py-1.5">
        {pages.map((_, index) => (
          <button
            key={`page-${index}`}
            type="button"
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
              index === activePage
                ? "bg-primary text-primary-foreground"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
            onClick={() => selectPage(index)}
            aria-pressed={index === activePage}
          >
            Page {index + 1}
          </button>
        ))}
        {canDraw && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 rounded-full px-2"
            onClick={addPage}
            disabled={pages.length >= MAX_WHITEBOARD_PAGES}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Page
          </Button>
        )}
      </div>

      <div ref={scrollerRef} className="relative min-h-0 flex-1 overflow-y-auto bg-stone-100">
        <canvas
          ref={canvasRef}
          style={{ height: pageHeight }}
          className={cn(
            "block w-full bg-white",
            canDraw && "touch-none",
            canDraw && !large && "cursor-zoom-in",
            canDraw && large && (tool === "eraser" ? "cursor-cell" : "cursor-crosshair"),
            !canDraw && "cursor-default"
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
        <Dialog open={clearOpen} onOpenChange={setClearOpen}>
          <DialogContent className="z-[60] max-w-md gap-0 overflow-hidden p-0">
            <div className="bg-gradient-to-b from-amber-50 to-white px-6 pb-2 pt-6 dark:from-amber-950/40 dark:to-background">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Eraser className="h-7 w-7" />
              </div>
              <DialogHeader className="space-y-2 text-center sm:text-center">
                <DialogTitle className="text-xl">Clear this page?</DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  Page {activePage + 1} will be erased for everyone in this session. Other pages stay as they are.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setClearOpen(false)}>
                Keep writing
              </Button>
              <Button type="button" variant="destructive" className="rounded-xl" onClick={confirmClear}>
                <Eraser className="mr-2 h-4 w-4" />
                Clear page
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {strokes.length === 0 && !live && (
          <p className="pointer-events-none absolute inset-x-0 top-6 px-4 text-center text-sm text-stone-400">
            {canDraw
              ? large
                ? "Scroll for more room on this page. Add a page when you want a fresh board, and switch back anytime."
                : "Tap the whiteboard to enlarge it for teaching. Scroll for more writing room."
              : "Follow along here. Only your tutor can write on the board."}
          </p>
        )}
      </div>
    </section>
  );
}
