import { Loader2 } from "lucide-react";

export const Loader = ({
  className,
  height,
  width,
}: {
  className?: string;
  height?: number;
  width?: number;
}) => {
  return (
    <div className={`flex flex-1 bg-card justify-center w-full h-dvh items-center ${className}`}>
      <Loader2
        className={`h-14 w-14 animate-spin text-card-foreground`}
        height={height}
        width={width}
      />
    </div>
  );
};
