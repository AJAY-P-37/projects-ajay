import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "shadcn-lib/dist/components/ui/popover";

export const ErrorPopover = ({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  const hoverTimer = React.useRef<NodeJS.Timeout | null>(null);
  const leaveTimer = React.useRef<NodeJS.Timeout | null>(null);

  if (!error) return <>{children}</>;

  const triggerOpen = (e) => {
    e.preventDefault();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 0);
  };

  const triggerClose = (e) => {
    e.preventDefault();
    // Delay closing so small mouse movements don't cause flicker
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(false);
    // leaveTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        // sideOffset={6}
        className='max-w-full w-full px-2 py-0 text-sm border-destructive text-destructive'
        onMouseEnter={() => {
          // Keep open if user moves into the content
          if (leaveTimer.current) clearTimeout(leaveTimer.current);
        }}
        onMouseLeave={triggerClose}
      >
        {error}
      </PopoverContent>
    </Popover>
  );
};
