import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TrpFramePanelVariant = "left" | "middle" | "right";

type TrpFramePanelProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  variant?: TrpFramePanelVariant;
};

export default function TrpFramePanel({
  children,
  style,
  className,
  variant = "middle",
}: TrpFramePanelProps) {
  return (
    <div
      className={cn(
        "figma-nine-slice rounded-[36px]",
        variant === "left" && "figma-home-panel-left",
        variant === "middle" && "figma-home-panel-middle",
        variant === "right" && "figma-home-panel-right",
        className
      )}
      style={{
        ...style,
      }}
    >
      {children}
    </div>
  );
}
