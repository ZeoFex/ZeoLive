"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  height?: number;
  children: React.ReactElement;
  className?: string;
}

/** Defers Recharts until mount so SSR/prerender never sees width/height -1. */
export function ChartContainer({
  height = 300,
  children,
  className,
}: ChartContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ height, width: "100%", minWidth: 0 }}
        aria-hidden
      />
    );
  }

  return (
    <div className={className} style={{ height, width: "100%", minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
