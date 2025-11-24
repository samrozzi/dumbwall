import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser, Trash2 } from "lucide-react";

interface CreateDoodleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (imageBlob: Blob) => void;
}

const COLORS = ["#000000", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];
const BRUSH_SIZES = [2, 4, 8];

export const CreateDoodleDialog = ({ open, onOpenChange, onCreate }: CreateDoodleDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [open]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
    ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (e.type === "mousedown") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleCreate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCreate(blob);
        clearCanvas();
        onOpenChange(false);
      }
    }, "image/png");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Draw a Doodle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border-2 border-teal-200 dark:border-teal-800 rounded cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c && !isEraser ? "border-foreground" : "border-border"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant={isEraser ? "default" : "outline"}
                size="icon"
                onClick={() => setIsEraser(!isEraser)}
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={clearCanvas}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Paintbrush className="w-4 h-4" />
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-8 h-8 rounded flex items-center justify-center border ${
                  brushSize === size ? "border-foreground bg-accent" : "border-border"
                }`}
              >
                <div
                  className="rounded-full bg-foreground"
                  style={{ width: size * 2, height: size * 2 }}
                />
              </button>
            ))}
          </div>

          <Button onClick={handleCreate} className="w-full">
            Post Doodle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
