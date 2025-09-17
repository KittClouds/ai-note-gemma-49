import React from "react";
import { Card } from "@/components/ui/card";

interface DataPoint {
  x: number;
  y: number;
  id: string;
  title: string;
  snippet: string;
}

interface SimpleEmbeddingViewProps {
  data: {
    x: Float32Array;
    y: Float32Array;
    ids: string[];
    titles: string[];
    snippets: string[];
  };
  onSelection?: (pointId: string) => void;
  colorScheme?: "light" | "dark";
}

export function SimpleEmbeddingView({ data, onSelection, colorScheme = "light" }: SimpleEmbeddingViewProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = React.useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const width = 600;
  const height = 400;
  const padding = 40;

  // Convert data to points
  const points: DataPoint[] = React.useMemo(() => {
    if (!data.x.length) return [];
    
    return Array.from({ length: data.x.length }, (_, i) => ({
      x: ((data.x[i] + 1) / 2) * (width - 2 * padding) + padding,
      y: ((1 - data.y[i]) / 2) * (height - 2 * padding) + padding,
      id: data.ids[i],
      title: data.titles[i],
      snippet: data.snippets[i],
    }));
  }, [data, width, height, padding]);

  const handlePointClick = (point: DataPoint) => {
    onSelection?.(point.id);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  return (
    <div className="relative">
      <Card className="p-4">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border rounded"
          onMouseMove={handleMouseMove}
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={colorScheme === "dark" ? "#374151" : "#e5e7eb"}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={colorScheme === "dark" ? "#60a5fa" : "#3b82f6"}
              stroke={colorScheme === "dark" ? "#1e293b" : "#ffffff"}
              strokeWidth={1}
              className="cursor-pointer hover:r-6 transition-all duration-150"
              onClick={() => handlePointClick(point)}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                filter: hoveredPoint?.id === point.id ? "brightness(1.2)" : "none",
              }}
            />
          ))}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-popover text-popover-foreground p-2 rounded border shadow-lg max-w-xs pointer-events-none"
            style={{
              left: mousePos.x + 10,
              top: mousePos.y - 10,
            }}
          >
            <div className="font-semibold text-sm">{hoveredPoint.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {hoveredPoint.snippet}
            </div>
          </div>
        )}
      </Card>
      
      <div className="mt-2 text-sm text-muted-foreground text-center">
        {points.length} notes visualized • Click a point to open the note
      </div>
    </div>
  );
}