import React from "react";

interface SparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  isPositive,
  width = 110,
  height = 36,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const padding = 2;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * usableWidth;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathString = `M ${points.join(" L ")}`;
  const color = isPositive ? "#00c853" : "#ff5252";
  const gradientId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

  // Area path for gradient under the line
  const firstPoint = points[0].split(",");
  const lastPoint = points[points.length - 1].split(",");
  const areaPath = `M ${firstPoint[0]},${height} L ${points.join(" L ")} L ${lastPoint[0]},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={pathString}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tiny circle on the last point */}
      <circle
        cx={Number(lastPoint[0])}
        cy={Number(lastPoint[1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
};
