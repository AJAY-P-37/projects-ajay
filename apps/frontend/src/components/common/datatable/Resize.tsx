import { useState, useRef, useCallback, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { getAccessorKey } from "./TableUtils";

export const ResizeHandle = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className='absolute top-0 right-0 h-full w-[3px] cursor-col-resize bg-card hover:bg-cyan-500'
  />
);

export const ResizeIndicator = ({ x }: { x: number }) => (
  <div
    className='fixed top-0 bottom-0 w-[2px] bg-cyan-500 pointer-events-none transition-all duration-75'
    style={{ left: x }}
  />
);

export function useColumnResize(columns: ColumnDef<any, any>[]) {
  const [columnWidths, setColumnWidths] = useState(
    Object.fromEntries(columns.map((c) => [getAccessorKey(c), c.meta?.width ?? 150])),
  );

  const [indicatorX, setIndicatorX] = useState<number | null>(null);

  const activeColRef = useRef<ColumnDef<any> | null>(null);
  const startXRef = useRef(0);

  const startResize = useCallback((col: ColumnDef<any>, clientX: number) => {
    activeColRef.current = col;
    startXRef.current = clientX;

    // Set initial indicator position
    requestAnimationFrame(() => {
      setIndicatorX(clientX);
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeColRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    startXRef.current = e.clientX;

    const id = getAccessorKey(activeColRef.current);

    setColumnWidths((prev) => ({
      ...prev,
      [id]: Math.max(60, prev[id] + deltaX),
    }));

    // Move indicator
    setIndicatorX(e.clientX);
  }, []);

  const handleMouseUp = useCallback(() => {
    activeColRef.current = null;
    setIndicatorX(null);
  }, []);

  // Attach listeners globally
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return {
    columnWidths,
    indicatorX,
    startResize,
  };
}
