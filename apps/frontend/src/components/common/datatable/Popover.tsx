import React from "react";
import {
  Popover as RadixPopover,
  PopoverTrigger,
  PopoverContent,
} from "shadcn-lib/dist/components/ui/popover";

export const Popover = ({
  content,
  children,
  isError = false,
}: {
  content?: React.ReactNode;
  children: React.ReactNode;
  isError?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const hoverTimer = React.useRef<NodeJS.Timeout | null>(null);

  if (!content) return <>{children}</>;

  // Only open on hover for desktop, and on click/tap for mobile
  const triggerOpen = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === "touchstart") {
      setOpen((prev) => !prev);
    } else {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => setOpen(true), 0);
    }
  };

  const triggerClose = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === "touchend") {
      setOpen(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <RadixPopover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={triggerOpen}
        onMouseLeave={triggerClose}
        onTouchStart={triggerOpen}
        onTouchEnd={triggerClose}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        align='start'
        side='top'
        className={`max-w-full w-full px-2 py-0 text-sm ${isError ? "border-destructive text-destructive" : "text-foreground"}`}
        style={{ pointerEvents: open ? "auto" : "none" }} // allow pointer events only when open
        onMouseEnter={() => {
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
        }}
        onMouseLeave={triggerClose}
      >
        {content}
      </PopoverContent>
    </RadixPopover>
  );
};
