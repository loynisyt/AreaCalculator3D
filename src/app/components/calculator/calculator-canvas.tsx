import { useRef, useEffect, useState } from "react";
import { Furniture, Room } from "./types";

interface CanvasProps {
  furniture: Furniture[];
  selectedId: string | null;
  onSelectFurniture: (id: string | null) => void;
  onMoveFurniture: (id: string, x: number, y: number) => void;
  room: Room;
  snapToGrid: boolean;
  gridSize: number;
}

export function CalculatorCanvas({
  furniture,
  selectedId,
  onSelectFurniture,
  onMoveFurniture,
  room,
  snapToGrid,
  gridSize,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scale = 2; // 2 pixels = 1cm

  const snapToGridFn = (value: number) => {
    if (snapToGrid) {
      return Math.round(value / (gridSize * scale)) * (gridSize * scale);
    }
    return value;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paper texture background
    ctx.fillStyle = "#faf9f7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (light sketch lines)
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += gridSize * scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize * scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw room outline with sketch effect
    if (room.width && room.height) {
      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);

      // Multiple slightly offset lines for hand-drawn effect
      for (let offset = 0; offset < 2; offset++) {
        ctx.beginPath();
        ctx.rect(
          50 + offset,
          50 + offset,
          room.width * scale,
          room.height * scale
        );
        ctx.stroke();
      }

      // Draw room dimensions
      ctx.fillStyle = "#e74c3c";
      ctx.font = "bold 14px 'Comic Sans MS', cursive";
      ctx.fillText(
        `${room.width}cm`,
        50 + (room.width * scale) / 2 - 20,
        40
      );
      ctx.fillText(
        `${room.height}cm`,
        15,
        50 + (room.height * scale) / 2
      );
    }

    // Draw furniture with sketch style
    furniture.forEach((item) => {
      const x = 50 + item.x * scale;
      const y = 50 + item.y * scale;
      const w = item.width * scale;
      const h = item.height * scale;

      const isSelected = item.id === selectedId;
      const isHovered = item.id === hoveredId;

      // Shadow/hover effect
      if (isHovered || isSelected) {
        ctx.fillStyle = "rgba(52, 152, 219, 0.1)";
        ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      }

      // Draw furniture box with sketch lines
      ctx.strokeStyle = isSelected ? "#3498db" : "#34495e";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash([]);

      // Multiple lines for hand-drawn effect
      for (let offset = 0; offset < (isSelected ? 2 : 1); offset++) {
        ctx.beginPath();
        ctx.rect(x + offset, y + offset, w, h);
        ctx.stroke();
      }

      // Fill with light color
      ctx.fillStyle = isSelected
        ? "rgba(52, 152, 219, 0.15)"
        : "rgba(236, 240, 241, 0.8)";
      ctx.fillRect(x, y, w, h);

      // Draw diagonal lines (sketch pattern)
      ctx.strokeStyle = "rgba(52, 73, 94, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      for (let i = 0; i < w + h; i += 15) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x, y + i);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw text (furniture name)
      ctx.fillStyle = "#2c3e50";
      ctx.font = "bold 12px 'Comic Sans MS', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const lines = item.name.split(" ");
      lines.forEach((line, index) => {
        ctx.fillText(line, x + w / 2, y + h / 2 + (index - 0.5) * 14);
      });

      // Draw dimensions
      ctx.font = "10px 'Comic Sans MS', cursive";
      ctx.fillStyle = "#e74c3c";
      ctx.fillText(`${item.width}cm`, x + w / 2, y - 8);
      ctx.fillText(`${item.height}cm`, x - 25, y + h / 2);

      // Draw selection handles
      if (isSelected) {
        ctx.fillStyle = "#3498db";
        const handleSize = 6;
        [
          [x, y],
          [x + w, y],
          [x, y + h],
          [x + w, y + h],
        ].forEach(([hx, hy]) => {
          ctx.fillRect(
            hx - handleSize / 2,
            hy - handleSize / 2,
            handleSize,
            handleSize
          );
        });
      }
    });
  }, [furniture, selectedId, room, snapToGrid, gridSize, hoveredId]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findFurnitureAtPos = (x: number, y: number): Furniture | null => {
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      const fx = 50 + item.x * scale;
      const fy = 50 + item.y * scale;
      const fw = item.width * scale;
      const fh = item.height * scale;

      if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
        return item;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const item = findFurnitureAtPos(pos.x, pos.y);

    if (item) {
      const fx = 50 + item.x * scale;
      const fy = 50 + item.y * scale;
      setDragging({
        id: item.id,
        offsetX: pos.x - fx,
        offsetY: pos.y - fy,
      });
      onSelectFurniture(item.id);
    } else {
      onSelectFurniture(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (dragging) {
      const newX = snapToGridFn(pos.x - dragging.offsetX - 50) / scale;
      const newY = snapToGridFn(pos.y - dragging.offsetY - 50) / scale;
      onMoveFurniture(dragging.id, Math.max(0, newX), Math.max(0, newY));
    } else {
      const item = findFurnitureAtPos(pos.x, pos.y);
      setHoveredId(item?.id || null);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden border-4 border-gray-300 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-crosshair"
        style={{
          imageRendering: "crisp-edges",
        }}
      />
    </div>
  );
}
