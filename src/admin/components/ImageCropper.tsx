import { useRef, useState, useEffect, useCallback, WheelEvent, MouseEvent, TouchEvent } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, Check } from "lucide-react";
interface Props {
  file: File;
  aspectRatio?: number; 
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}
const OUTPUT_SIZE = 800;
export function ImageCropper({ file, aspectRatio = 1, onCancel, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offX: 0, offY: 0 });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const frameW = 320;
  const frameH = frameW / aspectRatio;
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = frameW;
    canvas.height = frameH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, frameW, frameH);
    ctx.save();
    ctx.translate(frameW / 2 + offset.x, frameH / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    const baseScale = Math.max(frameW / img.width, frameH / img.height);
    const scale = baseScale * zoom;
    ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
    ctx.restore();
  }, [frameW, frameH, zoom, rotation, offset]);
  useEffect(() => {
    draw();
  }, [draw, ready]);
  function startDrag(clientX: number, clientY: number) {
    setDragging(true);
    dragStart.current = { x: clientX, y: clientY, offX: offset.x, offY: offset.y };
  }
  function moveDrag(clientX: number, clientY: number) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.offX + (clientX - dragStart.current.x),
      y: dragStart.current.offY + (clientY - dragStart.current.y),
    });
  }
  function onMouseDown(e: MouseEvent) { startDrag(e.clientX, e.clientY); }
  function onMouseMove(e: MouseEvent) { moveDrag(e.clientX, e.clientY); }
  function onMouseUp() { setDragging(false); }
  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }
  function onTouchMove(e: TouchEvent) {
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }
  function onTouchEnd() { setDragging(false); }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.001)));
  }
  function reset() {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }
  async function handleSave() {
    setSaving(true);
    const canvas = document.createElement("canvas");
    const outH = OUTPUT_SIZE / aspectRatio;
    canvas.width = OUTPUT_SIZE;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    if (ctx && img) {
      const scaleFactor = OUTPUT_SIZE / frameW;
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2 + offset.x * scaleFactor, outH / 2 + offset.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);
      const baseScale = Math.max(frameW / img.width, frameH / img.height) * scaleFactor;
      const scale = baseScale * zoom;
      ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
      ctx.restore();
    }
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onSave(blob);
      },
      "image/jpeg",
      0.9
    );
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Adjust Image</h3>
          <button onClick={onCancel} type="button"><X size={20} /></button>
        </div>
        <div
          ref={containerRef}
          className="relative mx-auto bg-gray-900 rounded-lg overflow-hidden touch-none select-none cursor-move"
          style={{ width: frameW, height: frameH, maxWidth: "100%" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          {!ready ? (
            <div className="w-full h-full flex items-center justify-center text-white text-sm">Loading...</div>
          ) : (
            <canvas ref={canvasRef} className="w-full h-full" />
          )}
        </div>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.1))} className="p-2 rounded-lg border hover:bg-gray-50">
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-28 sm:w-36"
          />
          <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.1))} className="p-2 rounded-lg border hover:bg-gray-50">
            <ZoomIn size={18} />
          </button>
          <button type="button" onClick={() => setRotation((r) => r - 90)} className="p-2 rounded-lg border hover:bg-gray-50">
            <RotateCcw size={18} />
          </button>
          <button type="button" onClick={() => setRotation((r) => r + 90)} className="p-2 rounded-lg border hover:bg-gray-50">
            <RotateCw size={18} />
          </button>
          <button type="button" onClick={reset} className="p-2 rounded-lg border hover:bg-gray-50">
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onCancel} className="flex-1 border rounded-lg py-2.5 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!ready || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? "Saving..." : <><Check size={18} /> Use Photo</>}
          </button>
        </div>
      </div>
    </div>
  );
}